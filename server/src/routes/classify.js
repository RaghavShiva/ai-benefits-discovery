const express = require('express');
const { classifyText } = require('../services/aiClient');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text (string) is required' });
    }

    const result = await classifyText(text.trim());

    // Remove `raw` so the client only gets important info
    const { raw, ...cleaned } = result;

    return res.json(cleaned);

  } catch (err) {
    console.error('classify error:', err);
    return res.status(500).json({ error: 'classification failed' });
  }
});

module.exports = router;
