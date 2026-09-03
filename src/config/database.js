import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

// Estrutura inicial do banco
const defaultData = {
  users: [],
  stores: [],
  members: [],
  products: [],
  orders: [],
};

// Carrega os dados gravados em disco ou inicia padrão
function loadDatabase() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(fileData);
    }
  } catch (error) {
    console.error('Erro ao ler data.json, usando base padrão:', error.message);
  }
  return { ...defaultData };
}

export const db = loadDatabase();

// Salva em disco sempre que houver alteração
export function saveDatabase() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erro ao salvar no arquivo data.json:', error.message);
  }
}