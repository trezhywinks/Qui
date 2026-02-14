//mongodb+srv://trezhy:lWn7NInsHxJtoOG5@cluster0.oedzme4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
const express = require('express');
const path = require("path");
const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();
const port = 9090;

app.use(express.json());

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect("mongodb+srv://trezhy:lWn7NInsHxJtoOG5@cluster0.oedzme4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("Connected!"))
  .catch(err => console.error("Erro:", err));

const userSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  password: String,
  image: String, 
  date: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);


const storage = multer.memoryStorage();
const upload = multer({ storage });


app.post("/register", async (req, res) => {
  try {
    
    const { name, password, image } = req.body;
    
    if (!name || !password || !image) {
      return res.status(400).json({ mensagem: "Envie tudo!" });
    }
    
    const userExists = await User.findOne({ name });
    if (userExists) {
      return res.status(400).json({ mensagem: "Nome já existe!" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({
      name,
      password: hashedPassword,
      image
    });
    
    await newUser.save();
    
    res.json({ mensagem: "Criado!" });
    
  } catch (err) {
    res.status(500).json({ mensagem: "Erro servidor" });
  }
});

app.post("/login", async (req, res) => {
  try {
    
    const { name, password } = req.body;
    
    if (!name || !password) {
      return res.status(400).json({ mensagem: "Informe nome e senha!" });
    }
    
    const user = await User.findOne({ name });
    if (!user) {
      return res.status(400).json({ mensagem: "Usuário não encontrado!" });
    }
    
    const senhaValida = await bcrypt.compare(password, user.password);
    
    if (!senhaValida) {
      return res.status(400).json({ mensagem: "Senha incorreta!" });
    }
    
    res.json({
      mensagem: "Login realizado com sucesso!",
      id: user._id
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro no servidor" });
  }
});

/* ========================= */

app.listen(port, () => {
  console.log("Port =>", port);
});   
