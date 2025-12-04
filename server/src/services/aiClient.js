const { withRetries } = require('../utils/retry');

const ALLOWED = ['Dental', 'OPD', 'Vision', 'Mental Health', 'Unknown'];

async function classifyText(text) {
    const s = (text || '').toLowerCase();
    if (!s.trim()) return { category: 'Unknown', confidence: 0.12 };

    if (/tooth|teeth|gum|dental|toothache|tooth pain/i.test(s)) return { category: 'Dental', confidence: 0.95 };
    if (/eye|vision|blur|glasses|contact/i.test(s)) return { category: 'Vision', confidence: 0.9 };
    if (/anx|depress|therapy|counsel|panic|stress|mental/i.test(s)) return { category: 'Mental Health', confidence: 0.92 };
    if (/fever|cold|ache|headache|clinic|doctor|pain|stomach|cough/i.test(s)) return { category: 'OPD', confidence: 0.85 };

    // TODO: call Gemini or other LLM here. Wrapped with retries for robustness.
    const callLLM = async () => {
        // TODO: integrate Gemini SDK/REST here and parse the response strictly.
        // For now fallback:
        return { category: 'OPD', confidence: 0.45 };
    };

    try {
        return await withRetries(callLLM, 2, 500);
    } catch (e) {
        return { category: 'OPD', confidence: 0.45 };
    }
}

async function generatePlan(category, benefit) {
    // Simple canned plans for dev
    if (category === 'Dental') {
        return [
            `Book appointment with a dentist; mention the "${benefit.title}" benefit.`,
            'Attend checkup and obtain invoice / treatment estimate from clinic.',
            'Upload invoice and treatment notes to the benefits portal for claim.',
        ];
    }
    if (category === 'Vision') {
        return [
            'Schedule an eye exam with an in-network optometrist.',
            'Get prescription and collect eyewear invoice if applicable.',
            'Submit invoice + prescription to benefits portal for reimbursement.',
        ];
    }
    if (category === 'Mental Health') {
        return [
            'Find a counsellor through the benefits directory and book a session.',
            'Attend session and ask for invoice or session code.',
            'Submit invoice / code to portal and follow HR guidance for approval.',
        ];
    }
    if (category === 'OPD') {
        return [
            'Book a visit with an in-network GP or specialist.',
            'Attend consultation and request an itemized invoice.',
            'Submit invoice to benefits portal / HR for reimbursement.',
        ];
    }

    // LLM placeholder TODO
    const callLLM = async () => {
        // Compose strict prompt and call Gemini here, parse JSON like {"steps":[...]}
        return [
            'Open benefits portal and search for the relevant benefit.',
            'Contact HR or the listed provider to confirm coverage and book.',
            'Submit invoices and required documents through the portal and follow up.',
        ];
    };

    try {
        return await withRetries(callLLM, 2, 600);
    } catch (e) {
        return [
            'Open benefits portal and search for the relevant benefit.',
            'Contact HR or the listed provider to confirm coverage and book.',
            'Submit invoices and required documents through the portal and follow up.',
        ];
    }
}

module.exports = { classifyText, generatePlan };
