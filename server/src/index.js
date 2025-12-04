require('dotenv').config();
const express = require('express');
const cors = require('cors');

const classifyRouter = require('./routes/classify');
const planRouter = require('./routes/plan');

const PORT = process.env.PORT || 4000;
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.json({ status: 'ok', service: 'ai-benefits-discovery-server' }));

app.use('/api/classify', classifyRouter);
app.use('/api/plan', planRouter);

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});
