const express = require('express');
const { askClarifyingQuestion } = require('../services/aiClient');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text (string) is required' });
    }

    const result = await askClarifyingQuestion(text.trim());

    return res.json(result);

  } catch (err) {
    console.error('clarify error:', err);
    return res.status(500).json({ error: 'clarification failed' });
  }
});

module.exports = router;
