import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, saveDatabase } from '../config/database.js';

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
  saveDatabase();

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

  // 1. Verifica se o usuário é proprietário/gerente de alguma loja
  let userStore = Array.isArray(db.stores)
    ? db.stores.find(s => s.ownerId === user.id)
    : null;
  let userRole = userStore ? 'Gerente' : null;
  let membershipStatus = userStore ? 'approved' : null;

  // 2. Se não for proprietário, verifica na lista de membros (members)
  if (!userStore && Array.isArray(db.members)) {
    const membership = db.members.find(m => m.userId === user.id);
    if (membership) {
      userStore = db.stores.find(s => s.id === membership.storeId) || null;
      userRole = membership.role;
      membershipStatus = membership.status;
    }
  }

  return res.json({
    user: { id: user.id, name: user.name, nickname: user.nickname, email: user.email },
    token,
    store: userStore,
    role: userRole,
    membershipStatus: membershipStatus,
  });
}

export async function deleteAccount(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }

    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    db.users.splice(userIndex, 1);

    if (Array.isArray(db.members)) {
      db.members = db.members.filter(m => m.userId !== userId);
    }

    if (Array.isArray(db.stores)) {
      const ownedStore = db.stores.find(s => s.ownerId === userId);
      if (ownedStore) {
        db.stores = db.stores.filter(s => s.id !== ownedStore.id);
        if (Array.isArray(db.products)) {
          db.products = db.products.filter(p => p.storeId !== ownedStore.id);
        }
        if (Array.isArray(db.orders)) {
          db.orders = db.orders.filter(o => o.storeId !== ownedStore.id);
        }
      }
    }

    saveDatabase();
    return res.json({ message: 'Conta excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    return res.status(500).json({ error: 'Erro interno ao excluir conta.' });
  }
}