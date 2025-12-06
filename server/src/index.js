require('dotenv').config();
const express = require('express');
const cors = require('cors');

const classifyRouter = require('./routes/classify');
const planRouter = require('./routes/plan');
const clarifyRouter = require('./routes/clarify');

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN; // allowed frontend

const app = express();

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true
  })
);

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-benefits-discovery-server',
  });
});

app.use('/api/classify', classifyRouter);
app.use('/api/plan', planRouter);
app.use('/api/clarify', clarifyRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
