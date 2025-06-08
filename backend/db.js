import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o caminho do diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'sosdoacoes.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar no banco de dados:', err);
  } else {
    console.log('Conectado ao banco de dados SQLite');
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('pessoa', 'ong'))
    );
  `, (err) => {
    if (err) {
      console.error('Erro ao criar tabela usuarios:', err);
    } else {
      console.log('Tabela usuarios criada ou já existe.');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS doacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imagem TEXT,
      categoria TEXT,
      estado TEXT,
      alimenticio TEXT,
      descricao TEXT UNIQUE,
      -- ADICIONADO: Coluna para o ID da ONG que postou a doação
      id_ong INTEGER NOT NULL,
      reservado_por INTEGER,
      FOREIGN KEY(id_ong) REFERENCES usuarios(id), -- Chave estrangeira para o criador
      FOREIGN KEY(reservado_por) REFERENCES usuarios(id)
    );
  `, (err) => {
    if (err) {
      console.error('Erro ao criar tabela doacoes:', err);
    } else {
      console.log('Tabela doacoes criada ou já existe.');
    }
  });
});

export default db;