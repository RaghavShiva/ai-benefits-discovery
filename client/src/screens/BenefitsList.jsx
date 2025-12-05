import React, { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import BENEFITS from '../data/benefits'
import { useBenefit } from '../context/BenefitContext'
import { useToast } from '../context/ToastContext'

function scoreBenefit(benefit, text) {
    if (!text) return 0
    const t = text.toLowerCase()
    let score = 0
    const fields = [benefit.title, benefit.description, benefit.coverage].join(' ').toLowerCase()
    t.split(/\s+/).forEach(token => {
        if (token.length < 3) return
        if (fields.includes(token)) score += 1
    })
    return score
}

export default function BenefitsList() {
    const { category, setSelectedBenefit, text, setCategory } = useBenefit()
    const navigate = useNavigate()
    const toast = useToast()

    useEffect(() => {
        if (!category) return
        toast.push(`Detected category: ${category}`, { duration: 2500 })
    }, [category])

    if (!category) {
        return (
            <div className="card">
                <h3>No category found</h3>
                <p className="muted">Please go back and enter your need.</p>
                <div className="actions">
                    <button className="btn" onClick={() => navigate('/')}>Home</button>
                </div>
            </div>
        )
    }

    const pool = BENEFITS[category] || BENEFITS.OPD || []
    const ranked = useMemo(() => {
        if (!text) return pool
        const scored = pool.map(b => ({ b, score: scoreBenefit(b, text) }))
        scored.sort((a, z) => z.score - a.score)
        const positives = scored.filter(x => x.score > 0).map(x => x.b)
        return positives.length > 0 ? positives : pool
    }, [pool, text])

    const shown = ranked.slice(0, 3)

    useEffect(() => {
        const n = shown.length
        toast.push(n ? `Showing ${n} relevant benefit${n > 1 ? 's' : ''}` : 'No direct matches — showing defaults', { duration: 2200 })
    }, [JSON.stringify(shown)])

    return (
        <div className="card fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Recommended benefits — {category}</h2>
                <div>
                    <button className="btn ghost" onClick={() => { setCategory(null); navigate('/classify') }}>Change category</button>
                </div>
            </div>

            <div className="grid" style={{ marginTop: 12 }}>
                {shown.map(b => (
                    <article key={b.id} className="benefit">
                        <h3>{b.title}</h3>
                        <p className="muted">{b.coverage}</p>
                        <p>{b.description}</p>
                        <div className="actions">
                            <button
                                className="btn"
                                onClick={() => {
                                    setSelectedBenefit(b)
                                    navigate('/plan')
                                }}
                            >
                                View plan
                            </button>
                        </div>
                    </article>
                ))}
            </div>

            <div className="actions" style={{ marginTop: 20 }}>
                <button className="btn ghost" onClick={() => navigate('/')}>Back to Home</button>
            </div>
        </div>
    )
}
