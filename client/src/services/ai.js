// minimal client calls to backend /api endpoints
const API_BASE = import.meta.env.VITE_API_BASE;
export async function classify(text, signal) {
  const res = await fetch(`${API_BASE}/api/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal
  })
  if (!res.ok) throw new Error(`classify failed: ${res.status}`)
  return res.json() // expects { category, confidence } (we removed raw at route layer)
}

export async function generatePlan(category, benefit, signal) {
  const res = await fetch(`${API_BASE}/api/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, benefit }),
    signal
  })
  if (!res.ok) throw new Error(`plan failed: ${res.status}`)
  return res.json() // expects { steps: [...] }
}

export async function askClarifyingQuestion(originalText, signal) {
  const res = await fetch(`${API_BASE}/api/clarify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: originalText }),
    signal
  })
  if (!res.ok) throw new Error(`clarify failed: ${res.status}`)
  return res.json() // expects { question: "...", category: "...", confidence: ... }
}
