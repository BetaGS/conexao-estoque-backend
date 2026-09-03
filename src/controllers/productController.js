import { db } from '../config/database.js';

// 1. Listar todos os produtos de uma loja
export function listProducts(req, res) {
  const { storeId } = req.params;

  const storeProducts = db.products.filter((p) => p.storeId === storeId);
  return res.json(storeProducts);
}

// 2. Criar um novo card de produto
export function createProduct(req, res) {
  const { storeId, title, sizes, variants } = req.body;
  const userId = req.user.id;

  if (!storeId || !title || !title.trim()) {
    return res.status(400).json({ error: 'Loja e título do produto são obrigatórios.' });
  }

  if (!sizes || !Array.isArray(sizes) || sizes.length === 0) {
    return res.status(400).json({ error: 'Selecione ao menos um tamanho para o produto.' });
  }

  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    return res.status(400).json({ error: 'Cadastre ao menos uma cor para o produto.' });
  }

  // Verifica permissão (apenas membros aprovados com cargo de Gerente)
  const isManager = db.members.some(
    (m) => m.storeId === storeId && m.userId === userId && m.role === 'Gerente' && m.status === 'approved'
  );

  if (!isManager) {
    return res.status(403).json({ error: 'Apenas o Gerente pode criar novos cards de produto.' });
  }

  const newProduct = {
    id: `PROD-${Date.now().toString().slice(-4)}`,
    storeId,
    title: title.trim(),
    sizes,
    variants: variants.map((v, index) => ({
      id: v.id || `VAR-${Date.now()}-${index}`,
      colorName: v.colorName,
      imageUri: v.imageUri || null, // Foto é opcional
    })),
    createdAt: new Date().toISOString(),
  };

  db.products.unshift(newProduct);
  return res.status(201).json(newProduct);
}

// 3. Atualizar card de produto existente
export function updateProduct(req, res) {
  const { productId } = req.params;
  const { title, sizes, variants } = req.body;
  const userId = req.user.id;

  const product = db.products.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  // Verifica permissão de Gerente na loja do produto
  const isManager = db.members.some(
    (m) => m.storeId === product.storeId && m.userId === userId && m.role === 'Gerente' && m.status === 'approved'
  );

  if (!isManager) {
    return res.status(403).json({ error: 'Apenas o Gerente pode editar cards de produto.' });
  }

  if (title) product.title = title.trim();
  if (sizes && Array.isArray(sizes)) product.sizes = sizes;
  if (variants && Array.isArray(variants)) {
    product.variants = variants.map((v, index) => ({
      id: v.id || `VAR-${Date.now()}-${index}`,
      colorName: v.colorName,
      imageUri: v.imageUri || null,
    }));
  }

  return res.json(product);
}

// 4. Deletar card de produto
export function deleteProduct(req, res) {
  const { productId } = req.params;
  const userId = req.user.id;

  const index = db.products.findIndex((p) => p.id === productId);
  if (index === -1) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  const product = db.products[index];

  const isManager = db.members.some(
    (m) => m.storeId === product.storeId && m.userId === userId && m.role === 'Gerente' && m.status === 'approved'
  );

  if (!isManager) {
    return res.status(403).json({ error: 'Apenas o Gerente pode remover cards de produto.' });
  }

  db.products.splice(index, 1);
  return res.json({ message: 'Produto removido com sucesso do catálogo.' });
}