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
            <div className="card fade-in">
                <h3>No category detected</h3>
                <p className="muted" style={{ marginBottom: '20px' }}>
                    We couldn't classify your health need into a benefit category. This might happen if:
                </p>
                <ul style={{
                    marginLeft: '20px',
                    marginBottom: '20px',
                    color: 'var(--text-light)',
                    lineHeight: '1.8'
                }}>
                    <li>The input was too vague or unclear</li>
                    <li>The health need doesn't match available categories</li>
                    <li>There was a processing error</li>
                </ul>
                <p className="muted" style={{ marginBottom: '20px' }}>
                    Please try rephrasing your health need or go back to edit your input.
                </p>
                <div className="actions">
                    <button className="btn" onClick={() => navigate('/classify')}>Try classification again</button>
                    <button className="btn ghost" onClick={() => navigate('/')}>Edit input</button>
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

    // Show 2-4 benefits based on availability (requirements: 2-4 cards)
    const availableCount = ranked.length
    let maxToShow = availableCount
    if (availableCount < 2) {
        maxToShow = Math.min(availableCount, 2) // Show what's available if less than 2
    } else {
        maxToShow = Math.min(availableCount, 4) // Show up to 4, but at least 2
    }
    const shown = ranked.slice(0, maxToShow)

    useEffect(() => {
        const n = shown.length
        toast.push(n ? `Showing ${n} relevant benefit${n > 1 ? 's' : ''}` : 'No direct matches — showing defaults', { duration: 2200 })
    }, [JSON.stringify(shown)])

    return (
        <div className="card fade-in">
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '8px'
            }}>
                <div>
                    <h2 style={{ marginBottom: '4px' }}>Recommended benefits</h2>
                    <p className="muted" style={{ margin: 0 }}>
                        Category: <strong style={{ color: 'var(--accent)' }}>{category}</strong>
                    </p>
                </div>
                <button
                    className="btn ghost"
                    onClick={() => { setCategory(null); navigate('/classify') }}
                    style={{ flexShrink: 0 }}
                >
                    Change category
                </button>
            </div>

            {shown.length === 0 ? (
                <div className="fade-in" style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: 'var(--muted)'
                }}>
                    <p style={{ marginBottom: '16px', fontSize: '1.125rem' }}>No benefits available</p>
                    <p style={{ marginBottom: '20px' }}>
                        We couldn't find any benefits for the "{category}" category.
                        This might be a new category or there may be an issue with the data.
                    </p>
                    <div className="actions" style={{ justifyContent: 'center' }}>
                        <button className="btn ghost" onClick={() => { setCategory(null); navigate('/classify') }}>
                            Change category
                        </button>
                        <button className="btn ghost" onClick={() => navigate('/')}>
                            Start over
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid">
                    {shown.map((b, index) => (
                        <article
                            key={b.id}
                            className="benefit fade-in"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div>
                                <h3>{b.title}</h3>
                                <p className="muted" style={{
                                    fontWeight: '600',
                                    marginBottom: '12px',
                                    fontSize: '0.9375rem'
                                }}>
                                    {b.coverage}
                                </p>
                                <p style={{
                                    margin: 0,
                                    color: 'var(--text-light)',
                                    lineHeight: '1.6'
                                }}>
                                    {b.description}
                                </p>
                            </div>
                            <div className="actions" style={{ marginTop: 'auto', paddingTop: '16px' }}>
                                <button
                                    className="btn"
                                    onClick={() => {
                                        setSelectedBenefit(b)
                                        navigate('/plan')
                                    }}
                                    style={{ width: '100%' }}
                                >
                                    View plan →
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            <div className="actions" style={{ marginTop: '32px' }}>
                <button className="btn ghost" onClick={() => navigate('/')}>← Back to Home</button>
            </div>
        </div>
    )
}
