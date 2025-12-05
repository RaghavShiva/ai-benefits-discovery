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

// Clarifying question generation
async function askClarifyingQuestion(text) {
    if (!text || !String(text).trim()) {
        return { question: 'Could you provide more details about your health need?', category: 'OPD', confidence: 0.3 };
    }

    const promptText = `
You are a health benefits advisor. The user's input was unclear or ambiguous. Generate a ONE-SENTENCE clarifying question to help better understand their health need.

User's input:
"${String(text).trim()}"

IMPORTANT: Return a JSON object with:
1. A short, friendly clarifying question (one sentence)
2. A best-guess category based on the input
3. A confidence score (0.0 to 1.0)

Return EXACTLY this format:
{"question":"<one sentence question>","category":"<category_name>","confidence":<0.0-1.0>}

Available categories: ${ALLOWED.filter(c => c !== 'Unknown').join(', ')}

Rules:
- Question should be specific and helpful
- Category should be your best guess
- Confidence should reflect uncertainty (lower if very unclear)
- Return ONLY the JSON object
  `.trim();

    const callLLM = async () => {
        const raw = await callModel(promptText, { temperature: 0.3, maxOutputTokens: 200 });
        const parsed = tryParseJSON(raw);

        if (parsed?.question && parsed?.category) {
            const cat = parsed.category.trim();
            const category = ALLOWED.includes(cat) ? cat : 'OPD';
            const confidence = Math.min(Math.max(parsed.confidence || 0.4, 0), 1);
            return {
                question: String(parsed.question).trim(),
                category,
                confidence
            };
        }

        // Fallback
        return {
            question: 'Could you provide more specific details about your health concern?',
            category: 'OPD',
            confidence: 0.35
        };
    };

    try {
        return await withRetries(callLLM, 2, 600);
    } catch (e) {
        return {
            question: 'Could you provide more specific details about your health concern?',
            category: 'OPD',
            confidence: 0.35
        };
    }
}

module.exports = { classifyText, generatePlan, askClarifyingQuestion };
