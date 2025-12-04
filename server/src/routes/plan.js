const express = require('express');
const { generatePlan } = require('../services/aiClient');

const router = express.Router();

// POST /api/plan
router.post('/', async (req, res) => {
  try {
    const { category, benefit } = req.body;
    if (!category || !benefit || !benefit.title) {
      return res.status(400).json({ error: 'category and benefit.title required' });
    }

    const steps = await generatePlan(String(category), {
      title: String(benefit.title),
      coverage: benefit.coverage ? String(benefit.coverage) : undefined,
      description: benefit.description ? String(benefit.description) : undefined,
    });

    return res.json({ steps });
  } catch (err) {
    console.error('plan error:', err);
    return res.status(500).json({ error: 'plan generation failed' });
  }
});

module.exports = router;
