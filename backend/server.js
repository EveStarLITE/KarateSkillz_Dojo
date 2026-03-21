require('dotenv').config();
const express = require('express');
const cors = require('cors');
const inventory = require('./inventory');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/inventory', (req, res) => {
  res.json(inventory);
});

app.listen(PORT, () => {
  console.log(`Yin & Yang API listening on http://localhost:${PORT}`);
});
