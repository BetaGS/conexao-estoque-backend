import { Router } from 'express';
import { createOrder, updateOrderStatus, listOrders } from '../controllers/orderController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

export default function orderRoutes(io) {
  const router = Router();

  router.use(authMiddleware);
  router.get('/:storeId', listOrders);
  router.post('/', createOrder(io));
  router.patch('/:orderId/status', updateOrderStatus(io));

  return router;
}