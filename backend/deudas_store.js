const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'deudas.json');

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify([]), 'utf8');
}

function read() {
  ensure();
  try {
    const txt = fs.readFileSync(FILE, 'utf8');
    return JSON.parse(txt || '[]');
  } catch (e) {
    return [];
  }
}

function write(data) {
  ensure();
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getAll() { return read(); }

function getById(id) { return read().find(x=>x.id===id); }

function add(client) {
  const data = read();
  data.unshift(client);
  write(data);
  return client;
}

function update(id, patch) {
  const data = read();
  const idx = data.findIndex(x=>x.id===id);
  if (idx === -1) return null;
  data[idx] = Object.assign({}, data[idx], patch);
  write(data);
  return data[idx];
}

function remove(id) {
  let data = read();
  data = data.filter(x=>x.id!==id);
  write(data);
}

function addProduct(id, product) {
  const data = read();
  const c = data.find(x=>x.id===id);
  if (!c) return null;
  c.products = c.products || [];
  c.products.push(product);
  write(data);
  return c;
}

function removeProduct(id, index) {
  const data = read();
  const c = data.find(x=>x.id===id);
  if (!c) return null;
  if (!Array.isArray(c.products)) return c;
  c.products.splice(index,1);
  write(data);
  return c;
}

module.exports = { getAll, getById, add, update, remove, addProduct, removeProduct };
