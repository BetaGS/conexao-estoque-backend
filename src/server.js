import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Importação das rotas
import authRoutes from './routes/authRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

// WebSocket para eventos em tempo real
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado no WebSocket: ${socket.id}`);

  socket.on('entrar_loja', (storeId) => {
    socket.join(`store_${storeId}`);
    console.log(`Dispositivo ${socket.id} escutando a loja: store_${storeId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

// Registrando todas as rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes(io));

app.get('/', (req, res) => {
  res.send({ status: 'API Conexão Estoque online e completa 📦' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});