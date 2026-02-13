const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require('cors');


const app = express();
const port = 4040;
app.use(cors());


const MONGO_URI = "mongodb+srv://trezhy:lWn7NInsHxJtoOG5@cluster0.oedzme4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const BASE_URL = "http://localhost:4040";

app.use(express.json({ limit: "15mb" }));

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("❌ Erro MongoDB:", err));


const userSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  password: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);


const profileSchema = new mongoose.Schema({
  name: String,
  imageBase64: String,
  bio: String,
  links: [String],
  createdAt: { type: Date, default: Date.now }
});

const Profile = mongoose.model("Profile", profileSchema);


// ==================================================
// 🔐 REGISTRAR USUÁRIO
// ==================================================
// Registro
app.post("/register", async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password)
      return res.status(400).json({ error: "Preencha todos os campos" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      password: hashedPassword
    });

    await newUser.save();

    // Envia mensagem e link de redirect
    res.json({
      message: "Usuário criado com sucesso",
      redirect: "https://exemplo.com/boas-vindas"
    });

  } catch (err) {
    res.status(500).json({ error: "Erro ao registrar usuário" });
  }
});


// Login
app.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;

    const user = await User.findOne({ name });
    if (!user)
      return res.status(404).json({ error: "Usuário não encontrado" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: "Senha incorreta" });

    res.json({
      message: "Login realizado com sucesso",
      redirect: "https://exemplo.com/painel"
    });

  } catch (err) {
    res.status(500).json({ error: "Erro no login" });
  }
});


// ==================================================
// 👤 CRIAR PERFIL
// ==================================================
app.post("/profile", async (req, res) => {
  try {
    const { name, imageBase64, bio, links } = req.body;
    
    if (!name || !imageBase64)
      return res.status(400).json({ error: "Nome e imagem são obrigatórios" });
    
    const newProfile = new Profile({
      name,
      imageBase64,
      bio,
      links
    });
    
    await newProfile.save();
    
    res.json({
      message: "Perfil criado",
      id: newProfile._id,
      url: `${BASE_URL}/profile/${newProfile._id}`
    });
    
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar perfil" });
  }
});


app.get("/profile/:id", async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    
    if (!profile)
      return res.status(404).json({ error: "Perfil não encontrado" });
    
    res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${profile.name}</title>

<meta property="og:title" content="${profile.name}">
<meta property="og:description" content="${profile.bio || ''}">
<meta property="og:image" content="${profile.imageBase64}">

<style>
body{
  background:#111;
  color:#fff;
  text-align:center;
  font-family:Arial;
}
img{
  width:200px;
  border-radius:50%;
  margin:20px;
}
a{
  color:#00aaff;
  text-decoration:none;
}
.link{
  margin:10px;
}
</style>
</head>
<body>

<h1>${profile.name}</h1>
<img src="${profile.imageBase64}" />

<p>${profile.bio || ""}</p>

<div>
  ${(profile.links || []).map(link =>
    `<div class="link"><a href="${link}" target="_blank">${link}</a></div>`
  ).join("")}
</div>

</body>
</html>
    `);
    
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar perfil" });
  }
});


app.listen(port, () => {
  console.log("🚀 Servidor rodando na porta " + port);
});
