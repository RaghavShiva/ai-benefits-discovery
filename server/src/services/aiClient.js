const { withRetries } = require('../utils/retry');

const ALLOWED = [
    'Dental',
    'OPD',
    'Vision',
    'Mental Health',
    'Maternity',       // added extra category
    'Chronic Care',    // added extra category
    'Physiotherapy',   // added extra category
    'Unknown'
];

const DEFAULT_MODEL = process.env.LLM_MODEL || 'gemini-1.0';
const API_KEY = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || null;
const ENDPOINT = process.env.LLM_ENDPOINT || process.env.GEMINI_REST_ENDPOINT || null;

// Prefer SDK if installed; otherwise use REST fetch
let genaiClient = null;
try { genaiClient = require('@google/generative-ai'); } catch (e) { genaiClient = null; }

const fetcher = global.fetch ? global.fetch.bind(global) : require('node-fetch');

/* Send prompt to LLM via SDK (if available) or REST endpoint.
   Returns raw text output. */
async function sendToLLM(prompt, opts = {}) {
    const model = process.env.LLM_MODEL || DEFAULT_MODEL;
    const maxTokens = opts.maxTokens ?? 512;
    const temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.0;

    if (genaiClient) {
        try {
            const client = new genaiClient.Client({ apiKey: API_KEY });
            if (typeof client.models?.generateContent === 'function') {
                const resp = await client.models.generateContent({
                    model,
                    contents: prompt,
                    temperature,
                    maxOutputTokens: maxTokens,
                });
                if (resp?.text) return String(resp.text);
                if (resp?.outputs?.[0]?.content?.[0]?.text) return String(resp.outputs[0].content[0].text);
                if (resp?.candidates?.[0]?.content) return String(resp.candidates[0].content);
                return JSON.stringify(resp);
            } else if (typeof client.generate === 'function') {
                const r = await client.generate({ model, prompt, temperature, maxTokens });
                return String(r.output || r.text || JSON.stringify(r));
            }
        } catch (err) {
            console.warn('SDK call failed, falling back to REST:', err?.message || err);
        }
    }

    const endpoint = ENDPOINT;
    if (!endpoint) {
        throw new Error('LLM REST endpoint not configured. Set LLM_ENDPOINT or install SDK.');
    }

    const body = { model, prompt, temperature, max_tokens: maxTokens };
    const headers = { 'Content-Type': 'application/json' };
    if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;

    const resp = await fetcher(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        const t = await resp.text().catch(() => '');
        throw new Error(`LLM REST call failed: ${resp.status} ${resp.statusText} ${t}`);
    }

    const contentType = resp.headers.get ? resp.headers.get('content-type') : resp.headers['content-type'];
    if (contentType && contentType.includes('application/json')) {
        const json = await resp.json();
        if (typeof json?.text === 'string') return json.text;
        if (typeof json?.output === 'string') return json.output;
        if (json?.outputs?.[0]?.content) {
            const out = json.outputs[0].content;
            const tItem = out.find((c) => typeof c.text === 'string');
            if (tItem) return tItem.text;
            return JSON.stringify(json);
        }
        return JSON.stringify(json);
    } else {
        return await resp.text();
    }
}

/* Try strict JSON parse; otherwise extract first {...} substring and parse. */
function parseJSONorExtract(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    try { return JSON.parse(trimmed); } catch (e) { }
    const m = trimmed.match(/\{[\s\S]*\}/);
    if (m) {
        try { return JSON.parse(m[0]); } catch (e) { }
    }
    return null;
}

function padSteps(steps) {
    const result = [...steps];
    while (result.length < 3) result.push('Contact HR or consult the benefits portal for next steps.');
    return result.slice(0, 3);
}

/* Classify text into one allowed category. Returns { category, confidence }. */
async function classifyText(text) {
    if (!text || !String(text).trim()) return { category: 'Unknown', confidence: 0.12 };

    const prompt = `
You are a strict classifier. Choose the best single category from:
${ALLOWED.filter((c) => c !== 'Unknown').join(', ')}

Return EXACTLY one JSON object ONLY:
{"category":"<one of the allowed categories>"}

User text:
"""${String(text).trim()}"""

If ambiguous, choose "OPD".
`;

    const callLLM = async () => {
        const raw = await sendToLLM(prompt, { maxTokens: 60, temperature: 0.0 });
        const parsed = parseJSONorExtract(raw);

        if (parsed && typeof parsed.category === 'string') {
            const cat = parsed.category.trim();
            const category = ALLOWED.includes(cat) ? cat : 'OPD';
            const confidence = category === cat ? 0.9 : 0.6;
            return { category, confidence };
        }

        const lower = String(raw || '').toLowerCase();
        for (const c of ALLOWED) {
            if (lower.includes(c.toLowerCase())) return { category: c, confidence: 0.6 };
        }
        return { category: 'OPD', confidence: 0.45 };
    };

    try {
        return await withRetries(callLLM, 2, 600);
    } catch (e) {
        return { category: 'OPD', confidence: 0.45 };
    }
}

/* Generate 3 concise steps for availing the benefit. */
async function generatePlan(category, benefit) {
    const cat = String(category || 'OPD');
    const benefitTitle = String((benefit && benefit.title) || 'the benefit');
    const coverage = String((benefit && benefit.coverage) || 'N/A');
    const description = String((benefit && benefit.description) || 'N/A');

    const prompt = `
You are a benefits assistant. Return EXACTLY one JSON object ONLY:
{"steps":["Step one ...","Step two ...","Step three ..."]}

Rules:
- steps must be exactly 3 concise actionable steps (8-140 chars), each starting with a verb.
- Use Category, Benefit title, Coverage, Description to make steps specific.
- No extra fields or commentary.

Category: ${cat}
Benefit title: ${benefitTitle}
Coverage: ${coverage}
Description: ${description}
`;

    const callLLM = async () => {
        const raw = await sendToLLM(prompt, { maxTokens: 400, temperature: 0.12 });
        const parsed = parseJSONorExtract(raw);

        if (parsed && Array.isArray(parsed.steps)) {
            const steps = parsed.steps
                .map((s) => (typeof s === 'string' ? s.trim() : ''))
                .filter(Boolean)
                .slice(0, 3);
            if (steps.length === 3) return steps;
            if (steps.length > 0) return steps.length >= 3 ? steps.slice(0, 3) : padSteps(steps);
        }

        const lines = (raw || '')
            .split(/\r?\n/)
            .map((l) => l.replace(/^\s*[\-\d\.\)\s]+/, '').trim())
            .filter(Boolean);
        if (lines.length >= 3) return lines.slice(0, 3);

        return [
            `Open the benefits portal and search for "${benefitTitle}".`,
            'Contact HR or the listed provider to confirm coverage and book an appointment.',
            'Submit invoices and required documents through the portal and follow up.',
        ];
    };

    try {
        return await withRetries(callLLM, 2, 600);
    } catch (e) {
        return [
            `Open the benefits portal and search for "${benefitTitle}".`,
            'Contact HR or the listed provider to confirm coverage and book an appointment.',
            'Submit invoices and required documents through the portal and follow up.',
        ];
    }
}

module.exports = { classifyText, generatePlan };
