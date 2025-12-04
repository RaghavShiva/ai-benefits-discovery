const express = require('express');
const { classifyText } = require('../services/aiClient');

const router = express.Router();

// POST /api/classify
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    if (typeof text !== 'string') return res.status(400).json({ error: 'text required' });

    const result = await classifyText(String(text));
    return res.json(result);
  } catch (err) {
    console.error('classify error:', err);
    return res.status(500).json({ error: 'classification failed' });
  }
});

module.exports = router;
