// server/src/services/aiClient.js
// Clean SDK adapter for Gemini via @google/generative-ai
// Categories include extra medical domains.

const { withRetries } = require('../utils/retry');

const ALLOWED = [
    'Dental',
    'OPD',
    'Vision',
    'Mental Health',
    'Maternity',
    'Chronic Care',
    'Physiotherapy',
    'Unknown'
];

const MODEL = process.env.LLM_MODEL;
const API_KEY = process.env.LLM_API_KEY;

if (!API_KEY) throw new Error('LLM_API_KEY is required');

let GoogleGenerativeAI;
try {
    GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
} catch (e) {
    throw new Error('Install @google/generative-ai: npm i @google/generative-ai');
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL });

// Helpers
function tryParseJSON(raw) {
    if (!raw || typeof raw !== 'string') return null;
    try { return JSON.parse(raw.trim()); } catch { }
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
        try { return JSON.parse(m[0]); } catch { }
    }
    return null;
}

function padSteps(steps) {
    const out = [...steps];
    while (out.length < 3) out.push('Contact HR or consult the benefits portal for next steps.');
    return out.slice(0, 3);
}

// Core model call
async function callModel(promptText, opts = {}) {
    const temperature = opts.temperature ?? 0.0;
    const maxOutputTokens = opts.maxOutputTokens || 512;

    // Simplest working SDK pattern (your environment supports this)
    try {
        const resp = await model.generateContent(promptText);
        if (resp?.response?.text) return resp.response.text();
        if (typeof resp === 'string') return resp;
        if (resp?.output) return String(resp.output);
        if (typeof resp?.text === 'function') return await resp.text();
        return JSON.stringify(resp);
    } catch { }

    // Fallback: prompt array
    try {
        const resp = await model.generateContent({
            prompt: [{ role: 'user', content: promptText }],
            temperature,
            maxOutputTokens
        });
        if (resp?.response?.text) return resp.response.text();
        if (typeof resp === 'string') return resp;
        if (resp?.output) return String(resp.output);
        if (typeof resp?.text === 'function') return await resp.text();
        return JSON.stringify(resp);
    } catch { }

    throw new Error('LLM call failed for all patterns.');
}

// Classification
async function classifyText(text) {
    if (!text || !String(text).trim()) {
        return { raw: '', category: 'Unknown', confidence: 0.12 };
    }

    const promptText = `
You are a health benefits classifier. Analyze the user's health-related need and classify it into ONE category.

Available categories:
${ALLOWED.filter(c => c !== 'Unknown').join(', ')}

IMPORTANT: Return ONLY the category name as JSON. Do not include any explanation or additional text.

Return EXACTLY this format (nothing else):
{"category":"<category_name>"}

User's health need:
"${String(text).trim()}"

Rules:
- Choose the most appropriate single category
- If the need doesn't clearly fit any category, return "OPD" (Outpatient Department)
- Return ONLY the JSON object, no other text
  `.trim();

    const callLLM = async () => {
        const raw = await callModel(promptText, { temperature: 0.0, maxOutputTokens: 120 });
        const parsed = tryParseJSON(raw);

        if (parsed?.category) {
            const cat = parsed.category.trim();
            const category = ALLOWED.includes(cat) ? cat : 'OPD';
            const confidence = category === cat ? 0.9 : 0.6;
            return { raw, category, confidence };
        }

        const lower = raw.toLowerCase();
        for (const c of ALLOWED) {
            if (lower.includes(c.toLowerCase())) return { raw, category: c, confidence: 0.6 };
        }
        return { raw, category: 'OPD', confidence: 0.45 };
    };

    try {
        return await withRetries(callLLM, 2, 600);
    } catch (e) {
        return { raw: `LLM call failed: ${e}`, category: 'OPD', confidence: 0.45 };
    }
}

// Plan generation
async function generatePlan(category, benefit) {
    const cat = category || 'OPD';
    const benefitTitle = benefit?.title || 'the benefit';
    const coverage = benefit?.coverage || 'N/A';
    const description = benefit?.description || 'N/A';

    const promptText = `
Return EXACTLY:
{"steps":["Step one","Step two","Step three"]}

Rules:
- 3 steps only.
- Each must be actionable and start with a verb.
- Use category, title, coverage, description.

Category: ${cat}
Title: ${benefitTitle}
Coverage: ${coverage}
Description: ${description}
  `.trim();

    const callLLM = async () => {
        const raw = await callModel(promptText, { temperature: 0.12, maxOutputTokens: 400 });
        const parsed = tryParseJSON(raw);

        if (parsed?.steps) {
            const steps = parsed.steps
                .map(s => typeof s === 'string' ? s.trim() : '')
                .filter(Boolean)
                .slice(0, 3);
            if (steps.length === 3) return steps;
            if (steps.length > 0) return padSteps(steps);
        }

        const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length >= 3) return lines.slice(0, 3);

        // Fallback: Generic 3-step plan
        return [
            `Contact your HR department or access the benefits portal to verify eligibility for ${benefitTitle}.`,
            `Gather required documentation (ID, medical records if needed) and submit your request through the portal or HR.`,
            `Follow up with HR or the benefits provider to confirm approval and next steps for availing ${benefitTitle}.`
        ];
    };

    try {
        return await withRetries(callLLM, 2, 600);
    } catch {
        // Final fallback: Generic actionable steps
        return [
            `Contact your HR department or access the benefits portal to verify eligibility for ${benefitTitle}.`,
            `Gather required documentation (ID, medical records if needed) and submit your request through the portal or HR.`,
            `Follow up with HR or the benefits provider to confirm approval and next steps for availing ${benefitTitle}.`
        ];
    }
}

module.exports = { classifyText, generatePlan };
