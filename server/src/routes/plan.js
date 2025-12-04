const express = require('express');
const { generatePlan } = require('../services/aiClient');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { category, benefit } = req.body;

    // Validation
    if (!category || typeof category !== 'string') {
      return res.status(400).json({ error: 'category (string) is required' });
    }
    if (!benefit || typeof benefit !== 'object') {
      return res.status(400).json({ error: 'benefit object is required' });
    }
    if (!benefit.title || typeof benefit.title !== 'string') {
      return res.status(400).json({ error: 'benefit.title (string) is required' });
    }

    // Normalize benefit values
    const cleanBenefit = {
      title: benefit.title.trim(),
      coverage: benefit.coverage ? String(benefit.coverage).trim() : undefined,
      description: benefit.description ? String(benefit.description).trim() : undefined,
    };

    const steps = await generatePlan(category.trim(), cleanBenefit);

    return res.json({ steps });

  } catch (err) {
    console.error('plan error:', err);
    return res.status(500).json({ error: 'plan generation failed' });
  }
});

module.exports = router;
