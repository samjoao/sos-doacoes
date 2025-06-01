import sqlite3 from 'sqlite3';
const myURL = new URL('https://example.com/path?name=value');
console.log(myURL.hostname); // 'example.com'
console.log(myURL.pathname); // '/path'
console.log(myURL.search); // '?name=value'
import path from 'path';

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
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS doacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imagem TEXT,
      categoria TEXT,
      estado TEXT,
      alimenticio TEXT,
      descricao TEXT,
      reservado_por INTEGER,
      FOREIGN KEY(reservado_por) REFERENCES usuarios(id)
    );
  `);
});

export { db };
