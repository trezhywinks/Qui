const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = 'mongodb+srv://dreqxyxl:5jvkLqtTRsDcgvY1@winewinks.ajyhewm.mongodb.net/painelLogin?retryWrites=true&w=majority';
//const MONGO_URI = 'mongodb+srv://dreqxyxl:5jvkLqtTRsDcgvY1@winewinks.ajyhewm.mongodb.net/painelLogin?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB (login) conectado'))
  .catch(err => console.log('Erro MongoDB:', err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, select: false },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ message: 'Usuário já existe' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await User.create({ username, password: hashedPassword });
    
    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: { id: newUser._id, username: newUser.username }
    });
    
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username }).select('+password');
    if (!user) return res.status(400).json({ message: 'Usuário ou senha inválidos' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Usuário ou senha inválidos' });
    
    const token = jwt.sign({ id: user._id }, 'supersegredo123', { expiresIn: '1d' });
    
    res.json({ message: 'Login realizado com sucesso', token });
    
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token não fornecido' });
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, 'supersegredo123');
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
}

app.get('/painel', authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId);
  res.json({ message: 'Bem-vindo ao painel 🔐', user: { id: user._id, username: user.username } });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
