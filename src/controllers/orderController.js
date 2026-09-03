import { db } from '../config/database.js';

export function createOrder(io) {
  return (req, res) => {
    const { storeId, productId, productTitle, color, size, quantity, isUrgent } = req.body;

    if (!storeId || !productTitle || !color || !size || !quantity) {
      return res.status(400).json({ error: 'Dados incompletos do pedido.' });
    }

    const newOrder = {
      id: `PED-${Date.now().toString().slice(-4)}`,
      storeId,
      productId,
      productTitle,
      color,
      size,
      quantity: Number(quantity),
      isUrgent: Boolean(isUrgent),
      requestedBy: {
        id: req.user.id,
        nickname: req.user.nickname,
      },
      status: 'Pendente',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    db.orders.unshift(newOrder);

    // DISPARO EM TEMPO REAL VIA WEBSOCKET PARA A LOJA
    io.to(`store_${storeId}`).emit('novo_pedido', newOrder);

    return res.status(201).json(newOrder);
  };
}

export function updateOrderStatus(io) {
  return (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body; // 'Em Separação' | 'Pronto' | 'Entregue'

    const order = db.orders.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    order.status = status;

    // AVISA TODOS NA LOJA QUE O PEDIDO MUDOU DE STATUS (ex: foi pra "Pronto")
    io.to(`store_${order.storeId}`).emit('status_pedido_atualizado', order);

    return res.json(order);
  };
}

export function listOrders(req, res) {
  const { storeId } = req.params;
  const storeOrders = db.orders.filter(o => o.storeId === storeId);
  return res.json(storeOrders);
}