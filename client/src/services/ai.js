// minimal client calls to backend /api endpoints
export async function classify(text, signal) {
  const res = await fetch('/api/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal
  })
  if (!res.ok) throw new Error(`classify failed: ${res.status}`)
  return res.json() // expects { category, confidence } (we removed raw at route layer)
}

export async function generatePlan(category, benefit, signal) {
  const res = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, benefit }),
    signal
  })
  if (!res.ok) throw new Error(`plan failed: ${res.status}`)
  return res.json() // expects { steps: [...] }
}
