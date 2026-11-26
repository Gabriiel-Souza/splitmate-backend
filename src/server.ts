import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import { Table, Participant, Item } from './types.js';
import { calculateTableSummary } from './calculator.js';

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage (equivalent to [String: Table] in Swift)
const tables = new Map<string, Table>();

function generateTableCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return tables.has(code) ? generateTableCode() : code;
}

app.get('/api/hello', (_req, res) => {
  res.json({ message: 'SplitMate API online!' });
});

// 1. Create a new table
app.post('/api/tables', (req, res) => {
  const { venueName, creatorName } = req.body;

  if (!creatorName || typeof creatorName !== 'string') {
    res.status(400).json({ error: 'O nome de quem criou a mesa é obrigatório.' });
    return;
  }

  const creator: Participant = {
    id: crypto.randomUUID(),
    name: creatorName.trim(),
  };

  const newTable: Table = {
    id: crypto.randomUUID(),
    code: generateTableCode(),
    venueName: venueName?.trim() || 'Mesa sem nome',
    serviceFeeEnabled: true,
    participants: [creator],
    items: [],
  };

  tables.set(newTable.code, newTable);
  res.status(201).json(newTable);
});

// 2. Get / Join a table by 4-character code
app.get('/api/tables/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const table = tables.get(code);

  if (!table) {
    res.status(404).json({ error: 'Mesa não encontrada.' });
    return;
  }

  res.json(table);
});

// 3. Add a participant to the table
app.post('/api/tables/:code/participants', (req, res) => {
  const code = req.params.code.toUpperCase();
  const table = tables.get(code);

  if (!table) {
    res.status(404).json({ error: 'Mesa não encontrada.' });
    return;
  }

  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'O nome do participante é obrigatório.' });
    return;
  }

  const newParticipant: Participant = {
    id: crypto.randomUUID(),
    name: name.trim(),
  };

  table.participants.push(newParticipant);
  res.status(201).json(table);
});

// 4. Add an item to the table
app.post('/api/tables/:code/items', (req, res) => {
  const code = req.params.code.toUpperCase();
  const table = tables.get(code);

  if (!table) {
    res.status(404).json({ error: 'Mesa não encontrada.' });
    return;
  }

  const { name, priceCents, quantity, consumedByIds } = req.body;

  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'O nome do item é obrigatório.' });
    return;
  }

  if (typeof priceCents !== 'number' || !Number.isInteger(priceCents) || priceCents <= 0) {
    res.status(400).json({ error: 'O preço deve ser um inteiro positivo em centavos.' });
    return;
  }

  if (!Array.isArray(consumedByIds) || consumedByIds.length === 0) {
    res.status(400).json({ error: 'Selecione pelo menos um participante para dividir o item.' });
    return;
  }

  const validQuantity = typeof quantity === 'number' && quantity > 0 ? Math.floor(quantity) : 1;

  const newItem: Item = {
    id: crypto.randomUUID(),
    name: name.trim(),
    priceCents,
    quantity: validQuantity,
    consumedByIds,
  };

  table.items.push(newItem);
  res.status(201).json(table);
});

// 5. Remove an item from the table
app.delete('/api/tables/:code/items/:itemId', (req, res) => {
  const code = req.params.code.toUpperCase();
  const table = tables.get(code);

  if (!table) {
    res.status(404).json({ error: 'Mesa não encontrada.' });
    return;
  }

  table.items = table.items.filter((item) => item.id !== req.params.itemId);
  res.json(table);
});

// 6. Toggle 10% service fee
app.patch('/api/tables/:code/service-fee', (req, res) => {
  const code = req.params.code.toUpperCase();
  const table = tables.get(code);

  if (!table) {
    res.status(404).json({ error: 'Mesa não encontrada.' });
    return;
  }

  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') {
    res.status(400).json({ error: 'O campo enabled deve ser booleano.' });
    return;
  }

  table.serviceFeeEnabled = enabled;
  res.json(table);
});

// 7. Get calculated bill split summary
app.get('/api/tables/:code/summary', (req, res) => {
  const code = req.params.code.toUpperCase();
  const table = tables.get(code);

  if (!table) {
    res.status(404).json({ error: 'Mesa não encontrada.' });
    return;
  }

  const summary = calculateTableSummary(table);
  res.json(summary);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`SplitMate API running on http://localhost:${PORT}`));