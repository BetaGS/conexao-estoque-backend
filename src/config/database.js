// Banco em memória simulado para testes rápidos
export const db = {
  users: [],         // { id, name, nickname, email, password }
  stores: [],        // { id, name, code, allowedSizes, ownerId }
  members: [],       // { id, storeId, userId, role, status: 'pending' | 'approved' }
  products: [],      // { id, storeId, title, sizes, variants }
  orders: []         // { id, storeId, productId, color, size, quantity, isUrgent, requestedBy, status, createdAt }
};