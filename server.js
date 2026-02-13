const express = require('express');
const cheerio = require('cheerio'); 
const cors = require('cors');
const qrcode = require('qrcode-terminal');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const axios = require('axios');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');
const app = express();
const PORT = 3000;
const HOST = "127.0.0.1"
const host_server = `http://127.0.0.1:${PORT}`;
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 600 });
app.use(cors());


mongoose.connect('mongodb+srv://dreqxyxl:5jvkLqtTRsDcgvY1@winewinks.ajyhewm.mongodb.net/?retryWrites=true&w=majority&appName=winewinks', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    name: String,
    age: Number,
    bio: String,
    image: String,
    category: String
});

const User = mongoose.model('User', UserSchema);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'seu-segredo',
    resave: false,
    saveUninitialized: true
}));

function checkAuth(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/login');
}

app.get('/preview', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL ausente' });

  try {
    const { data: html } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' } // Evita bloqueios
    });
    const $ = cheerio.load(html);

    const getMeta = (prop) =>
      $(`meta[property='${prop}']`).attr('content') ||
      $(`meta[name='${prop}']`).attr('content');

    const preview = {
      titulo: getMeta('og:title') || $('title').text() || 'Sem título',
      descricao: getMeta('og:description') || '',
      imagem: getMeta('og:image') || '',
      url
    };

    res.json(preview);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar link' });
  }
});

app.post('/upload', upload.single('foto'), async (req, res) => {
    try {
        const { nome, usernameAntigo, bio } = req.body;
        const fotoBuffer = req.file?.buffer;

        if (!usernameAntigo) {
            return res.status(400).json({ message: 'Username antigo é obrigatório.' });
        }

        const user = await User.findOne({ username: usernameAntigo });
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        if (nome && nome !== usernameAntigo) {
            const existing = await User.findOne({ username: nome });
            if (existing) {
                return res.status(409).json({ message: 'Esse nome de usuário já existe.' });
            }
            user.username = nome;
        }

        if (bio) user.bio = bio;

        if (fotoBuffer) {
            // converte para base64
            const base64Image = `data:${req.file.mimetype};base64,${fotoBuffer.toString('base64')}`;
            user.image = base64Image;
        }

        await user.save();
        res.json({ message: 'Perfil salvo com sucesso!' });
    } catch (err) {
        console.error('Erro ao salvar perfil:', err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

app.use(express.static('login'))
app.use('/login', express.static(path.join(__dirname, 'login')));
app.use('/u', checkAuth, express.static(path.join(__dirname, 'u')));

app.get('/u', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'u/index.html'));
    } else {
        res.redirect('/login');
    }
});

app.get("/users", async (req, res) => {

    const users = await User.find();

    res.json(users);

});

//  cors: { origin: '*' }
//});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (user) {
            req.session.userId = user.username;
            res.json({ success: true, redirect: "/u" });
        } else {
            res.json({ success: false, message: 'Usuário ou senha incorretos' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar usuários' });
    }
});

// Rota JSON: retorna os dados do usuário em JSON
app.get('/k/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });

        if (user) {
            res.json({
                username: user.username,
                name: user.name,
                image: user.image,
                bio: user.bio,
                id: user._id
            });
        } else {
            res.status(404).json({ error: 'Usuário não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});


// Rota para carregar perfis de usuários
app.get('/user/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (user) {
            res.send(`
                <html>
                    <head><title>Perfil de ${user.username}</title></head>
                    <body>
                        <h1>${user.username}</h1>
                        <img src="${user.image}" alt="Foto de ${user.name}" width="150">
                        <p>Bio: ${user.bio}</p>
                    </body>
                </html>
            `);
        } else {
            res.status(404).send("Usuário não encontrado");
        }
    } catch (error) {
        res.status(500).send("Erro ao buscar usuário");
    }
});

app.post('/register', upload.single('image'), async (req, res) => {
    try {
        const { username, password, category } = req.body;

        if (!req.file) return res.status(400).json({ error: 'Imagem obrigatória' });

        const imageBase64 = req.file.buffer.toString('base64');

        const newUser = new User({
            username,
            password,
//            email,
            category,
            image: imageBase64
        });

        await newUser.save();
        req.session.userId = newUser._id;

        res.json({ success: true, redirect: "/u" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/fsnfwenfsdbnfwerdv', (req, res) => {
res.sendFile(path.join(__dirname, 'winks_dif_tool.server', 'fsnfwenfsdbnfwerdv.js'))
});

app.get('/winks_dif_tool_server', (req, res) => {
res.sendFile(path.join(__dirname, 'you', 'style.css'));
});

app.get('/tool-key/:params', (req, res) => {
  const { params } = req.params;
  const [from, to] = params.split('=');

  if (!from || !to) {
    return res.status(400).send('Parâmetros inválidos');
  }

 res.sendFile(path.join(__dirname, 'you', 'index.html'));
});

app.get('/winks/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username: username });

    if (!user) {
      return res.status(404).send('<h1>Usuário não encontrado</h1>');
    }

    const html = `
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=Edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${user.username}</title>
  <link rel="stylesheet" href="http://localhost:3000/winks_dif_tool_server">
 <script src="https://unpkg.com/boxicons@2.1.4/dist/boxicons.js"></script>
</head>
<body>
  <div class="topmessage">
    <div class="nottonu">
      <span>
<box-icon name='chevron-left' type='solid' color='#ffffff' style="width: 40px; height: 40px;" ></box-icon>
      </span>
    </div>
    <div class="nameuser">
      <div class="dixed">
      <div class="firl">
    <span style="font-weight: 500; font-size: 20px;" class="mignameY">${user.username}</span>
      </div>
    <div class="svg">
    </div>
</div>
      <p style="opacity: 0.4; font-size: 12px;">offline</p>
    </div>
    <div class="fileuser">
      <img src="data:image/png;base64,${user.image}" class="migimageY" onclick="iframE()" id="phor" width="50" height="50"/>
    </div>
  </div>
  <div class="iframe">
  <iframe class="" src="./iframe.html" frameborder="0"></iframe>
  </div>
      <script>
function iframE() {
    console.log("ok");
    const ifg = document.querySelector('.iframe');

    if (ifg.style.display === "none" || getComputedStyle(ifg).display === "none") {
        ifg.style.display = "inline";
    } else {
        ifg.style.display = "none";
    }
}

    </script>
  <div class="centermessage">
    <div class="foder">
    <br><br><br>
    <div class="welcome">
      <div class="filewinks">
      <img src="data:image/png;base64,${user.image}" class="migimage" width="80" height="80" style="border-radius: 3px;"/>
      </div>
    <br>
    <div class="namewinks">
<div class="dixed">
      <div class="firl">
    <span style="font-weight: 600; font-size: 25px; letter-spacing: -1px;" class="migname">${user.username}</span>
      </div>
    <div class="svg">
    <span>
    </span>
    </div>
      </div>
    <p style="font-size: 14px; opacity: 0.6;">Hello user, I'm wine. Welcome to my prived.
    <span style="color: #3193e4; font-weight:600;">Share</span><br></p>
    </div>
    </div>
    <div class="botsd">
<div class="ioniconv">
<style>
.ioniconv{
margin-top: 20px;
}
.ringh{
text-align: left;
}
.uio{
margin-top: 5px;
}
</style>
</div>

<div class="share view">
<div class="uio">
<box-icon style="fill: #fff;" name='link-alt'></box-icon>
</div>
<div class="ringh">
<span>
Compartilhar
<br><p style="font-size: 13px; opacity: 0.4;">Cique para compartilhar esse usuario.</p>
</span>
</div>
<div class="uio">
<box-icon style="fill: #fff;" name='chevron-right'></box-icon>
</div>
      </div>

<div class="share view">
<div class="uio">
<box-icon style="fill: #fff;" type='solid' name='flask'></box-icon>
</div>
<div class="ringh">
<span>
Visualizar perfil
<br><p style="font-size: 13px; opacity: 0.4;">Cique para ver o perfil desse usuario.</p>
</span>
</div>
<div class="uio">
<box-icon style="fill: #fff;" name='chevron-right'></box-icon>
</div>
      </div>

    </div>
<style>
#comment-section{
padding: 10px;
width: 450px;
padding-bottom: 10%;
}
 
.usuario-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 5px;
}


.data-comentario {
  font-size: 0.8em;
  color: #666;
}

.usuario-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.comentario p {
  white-space: pre-wrap;
  word-break: break-word;
}

.comentario {
padding: 10px;
width: 450px;
}
 
@media(max-width: 999px){
.comentario{
width: 95%;
}
#comment-section{
width: 95%;
}
}
 
</style>
<div id="comment-section">
<div id="chat"></div>
</div>
    </div>
  </div>

  <div class="inputmessage">
    <div class="masdin">
      <h2 style="font-size: 40px; font-weight: 100;">
<box-icon name='bong' type='solid' color='#fffbfb' style="width: 34px; height: 34px;" ></box-icon> </h2>
    </div>
    <div class="inputmeng">
      <input type="text" name="" id="message" >
    </div>
    <div class="sendmessage" id="send">
      <span> 
<box-icon name='telegram' type='logo' color='#ffffff' style="width: 34px; height: 34px;"  ></box-icon>
      </span>
    </div>
  </div>
<!--script src="http://localhost:3000/fsnfwenfsdbnfwerdv"></script-->
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
<script>
  const socket = io("http://localhost:3000");

  const meuUsuario = {
    username: "joao", // ← pode vir do localStorage
    image: "https://via.placeholder.com/40"
  };

  const outroUsername = window.location.pathname.split("/").pop();

  const input = document.getElementById("comment-input");
  const chatBox = document.getElementById("chat-box");

  function enviarMensagem() {
    const texto = input.value.trim();
    if (!texto) return;

    const msg = {
      from: meuUsuario.username,
      to: outroUsername,
      message: texto,
      image: meuUsuario.image
    };

    socket.emit("private message", msg);
    mostrarMensagem(msg, true);
    input.value = "";
  }

  document.getElementById("submit-comment").onclick = enviarMensagem;
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") enviarMensagem();
  });

  socket.on("private message", (msg) => {
    // Mostrar só se for entre os dois usuários
    if ((msg.from === outroUsername && msg.to === meuUsuario.username) ||
        (msg.from === meuUsuario.username && msg.to === outroUsername)) {
      mostrarMensagem(msg, msg.from === meuUsuario.username);
    }
  });

function mostrarMensagem(msg, souEu) {
  const div = document.createElement("div");
  div.className = souEu ? "me" : "you";

  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.gap = "10px";

  const img = document.createElement("img");
  img.src = msg.image;
  img.style.width = "40px";
  img.style.height = "40px";
  img.style.borderRadius = "100px";

  const content = document.createElement("div");

  const nome = document.createElement("b");
  nome.textContent = msg.from;

  const mensagem = document.createElement("p");
  mensagem.textContent = msg.message;

  content.appendChild(nome);
  content.appendChild(mensagem);
  container.appendChild(img);
  container.appendChild(content);
  div.appendChild(container);

  chatBox.appendChild(div);
}

</script>
</body>
</html>
    `;

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('<h1>Erro interno do servidor</h1>');
  }
});

app.listen(PORT, HOST, () => {
qrcode.generate(host_server, {small: true}, function(qrcode) {
console.log(qrcode);
})
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
