import { db, saveDatabase } from '../config/database.js';

// 1. Criar uma nova loja
export function createStore(req, res) {
  const { name, allowedSizes } = req.body;
  const userId = req.user?.id;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'O nome da loja é obrigatório.' });
  }

  const storeCode = `LOJA-${Math.floor(1000 + Math.random() * 9000)}`;
  const newStore = {
    id: `STORE-${Date.now().toString().slice(-4)}`,
    name: name.trim(),
    code: storeCode,
    allowedSizes: allowedSizes || ['P', 'M', 'G'],
    ownerId: userId,
    createdAt: new Date().toISOString(),
  };

  db.stores.push(newStore);

  const ownerMembership = {
    id: `MEM-${Date.now().toString().slice(-4)}`,
    storeId: newStore.id,
    userId: userId,
    role: 'Gerente',
    status: 'approved',
  };
  db.members.push(ownerMembership);
  saveDatabase();

  return res.status(201).json({
    store: newStore,
    role: 'Gerente',
    membershipStatus: 'approved',
  });
}

// 2. Listar lojas gerenciadas ou criadas pelo usuário logado
export function getMyStores(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }

    const managerStoreIds = (db.members || [])
      .filter(m => m.userId === userId && m.role === 'Gerente' && m.status === 'approved')
      .map(m => m.storeId);

    const myStores = (db.stores || []).filter(
      s => s.ownerId === userId || managerStoreIds.includes(s.id)
    );

    return res.json(myStores);
  } catch (error) {
    console.error('Erro ao listar lojas do usuário:', error);
    return res.status(500).json({ error: 'Erro ao buscar suas lojas.' });
  }
}

// 3. Solicitar entrada em uma loja via código
export function joinStoreRequest(req, res) {
  const { code, requestedRole } = req.body;
  const userId = req.user?.id;

  if (!code) {
    return res.status(400).json({ error: 'Informe o código da loja.' });
  }

  const store = db.stores.find(s => s.code.toUpperCase() === code.trim().toUpperCase());
  if (!store) {
    return res.status(404).json({ error: 'Loja não encontrada com esse código.' });
  }

  const existingMember = db.members.find(
    m => m.storeId === store.id && m.userId === userId
  );

  if (existingMember) {
    if (existingMember.status === 'pending') {
      return res.status(400).json({ error: 'Você já possui uma solicitação pendente nesta loja.' });
    }
    return res.status(400).json({ error: 'Você já é membro ativo desta loja.' });
  }

  const newMembership = {
    id: `MEM-${Date.now().toString().slice(-4)}`,
    storeId: store.id,
    userId: userId,
    role: requestedRole || 'Vendedor',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  db.members.push(newMembership);
  saveDatabase();

  return res.status(201).json({
    store,
    role: newMembership.role,
    membershipStatus: 'pending',
    message: 'Solicitação de entrada enviada com sucesso ao gerente.',
  });
}

// 4. Listar membros ativos e pendentes (Apenas Gerente)
export function getStoreMembers(req, res) {
  const { storeId } = req.params;
  const userId = req.user?.id;

  const isManager = db.members.some(
    m => m.storeId === storeId && m.userId === userId && m.role === 'Gerente' && m.status === 'approved'
  );

  if (!isManager) {
    return res.status(403).json({ error: 'Acesso restrito apenas para o Gerente da loja.' });
  }

  const allStoreMemberships = db.members.filter(m => m.storeId === storeId);

  const populated = allStoreMemberships.map(m => {
    const user = db.users.find(u => u.id === m.userId);
    return {
      membershipId: m.id,
      userId: m.userId,
      name: user?.name || 'Colaborador',
      nickname: user?.nickname || '@usuario',
      email: user?.email || '',
      role: m.role,
      status: m.status,
    };
  });

  const activeEmployees = populated.filter(m => m.status === 'approved');
  const pendingRequests = populated.filter(m => m.status === 'pending');

  return res.json({
    activeEmployees,
    pendingRequests,
  });
}

// 5. Aprovar ou rejeitar colaborador (Apenas Gerente)
export function handleMembershipRequest(req, res) {
  const { membershipId } = req.params;
  const { action, role } = req.body;
  const userId = req.user?.id;

  const membership = db.members.find(m => m.id === membershipId);
  if (!membership) {
    return res.status(404).json({ error: 'Solicitação não encontrada.' });
  }

  const isManager = db.members.some(
    m => m.storeId === membership.storeId && m.userId === userId && m.role === 'Gerente' && m.status === 'approved'
  );

  if (!isManager) {
    return res.status(403).json({ error: 'Apenas o Gerente pode aprovar ou rejeitar membros.' });
  }

  if (action === 'approve') {
    membership.status = 'approved';
    if (role) membership.role = role;
    saveDatabase();
    return res.json({ message: 'Membro aprovado com sucesso!', membership });
  } else if (action === 'reject') {
    const index = db.members.findIndex(m => m.id === membershipId);
    db.members.splice(index, 1);
    saveDatabase();
    return res.json({ message: 'Solicitação recusada com sucesso.' });
  }

  return res.status(400).json({ error: 'Ação inválida. Use "approve" ou "reject".' });
}