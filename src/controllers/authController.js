import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';

export async function register(req, res) {
  const { name, nickname, email, password } = req.body;

  if (!name || !nickname || !email || !password) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  const formattedNickname = nickname.toLowerCase().replace(/\s+/g, '');
  const userExists = db.users.find(u => u.email === email || u.nickname === formattedNickname);

  if (userExists) {
    return res.status(400).json({ error: 'E-mail ou Nickname já em uso.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: `USR-${Date.now().toString().slice(-4)}`,
    name,
    nickname: formattedNickname.startsWith('@') ? formattedNickname : `@${formattedNickname}`,
    email,
    password: hashedPassword,
  };

  db.users.push(newUser);

  const token = jwt.sign(
    { id: newUser.id, nickname: newUser.nickname, email: newUser.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  return res.status(201).json({
    user: { id: newUser.id, name: newUser.name, nickname: newUser.nickname, email: newUser.email },
    token
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = db.users.find(u => u.email === email);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Senha incorreta.' });
  }

  const token = jwt.sign(
    { id: user.id, nickname: user.nickname, email: user.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  return res.json({
    user: { id: user.id, name: user.name, nickname: user.nickname, email: user.email },
    token
  });
}