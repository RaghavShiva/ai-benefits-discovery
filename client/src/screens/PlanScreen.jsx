import React, { useEffect, useState, useRef } from 'react'
import { useBenefit } from '../context/BenefitContext'
import { generatePlan } from '../services/ai'
import { useNavigate } from 'react-router-dom'

export default function PlanScreen() {
    const { category, selectedBenefit, plan, setPlan } = useBenefit()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const abortRef = useRef(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (!selectedBenefit || !category) {
            navigate('/')
            return
        }

        async function run() {
            setLoading(true)
            abortRef.current = new AbortController()
            try {
                const res = await generatePlan(category, selectedBenefit, abortRef.current.signal)
                setPlan(res.steps || [])
                setLoading(false)
            } catch (e) {
                if (e?.name === 'AbortError') return
                setError(e.message || 'Failed to generate plan')
                setLoading(false)
            }
        }

        if (!plan) run()
        // eslint-disable-next-line
    }, [])

    function onRegenerate() {
        setPlan(null)
        setError(null)
            ; (async () => {
                setLoading(true)
                try {
                    const res = await generatePlan(category, selectedBenefit)
                    setPlan(res.steps || [])
                    setLoading(false)
                } catch (e) {
                    setError(e.message || 'Failed to generate plan')
                    setLoading(false)
                }
            })()
    }

    return (
        <div className="card fade-in">
            <div style={{ marginBottom: '20px' }}>
                <h2 style={{ marginBottom: '8px' }}>How to use: {selectedBenefit?.title}</h2>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="muted" style={{
                        padding: '4px 12px',
                        background: 'var(--accent-light)',
                        borderRadius: 'var(--radius)',
                        fontWeight: '500'
                    }}>
                        {selectedBenefit?.coverage}
                    </span>
                    <span className="muted">•</span>
                    <span className="muted" style={{ fontWeight: '500' }}>{category}</span>
                </div>
            </div>

            {loading && (
                <div className="loader">
                    <div className="loader-spinner"></div>
                    <span>Generating personalized plan…</span>
                </div>
            )}
            {error && (
                <div className="error fade-in">
                    <p style={{ margin: 0 }}><strong>Unable to generate plan</strong></p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.875rem' }}>
                        We encountered an issue generating your action plan. This might be due to a temporary service issue.
                        Please try regenerating the plan.
                    </p>
                    <div className="actions" style={{ marginTop: '16px' }}>
                        <button className="btn" onClick={onRegenerate}>Regenerate plan</button>
                        <button className="btn ghost" onClick={() => navigate('/benefits')}>
                            Back to benefits
                        </button>
                    </div>
                </div>
            )}

            {!loading && !error && plan && plan.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '1.125rem', color: 'var(--text)' }}>
                        Step-by-step guide:
                    </h3>
                    <ol className="steps">
                        {plan.map((s, i) => (
                            <li key={i} className="fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                                {s}
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {!loading && !error && plan && plan.length === 0 && (
                <div className="fade-in" style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: 'var(--muted)'
                }}>
                    <p style={{ marginBottom: '16px', fontSize: '1.125rem' }}>No plan steps generated</p>
                    <p style={{ marginBottom: '20px' }}>
                        We couldn't generate a step-by-step plan for this benefit.
                        This might be due to incomplete information or a processing issue.
                    </p>
                    <div className="actions" style={{ justifyContent: 'center' }}>
                        <button className="btn" onClick={onRegenerate}>Regenerate plan</button>
                    </div>
                </div>
            )}

            <div className="actions" style={{ marginTop: '32px' }}>
                <button className="btn ghost" onClick={() => navigate('/benefits')}>
                    ← Back to benefits
                </button>
                {!loading && (
                    <button className="btn" onClick={onRegenerate} disabled={loading}>
                        Regenerate plan
                    </button>
                )}
            </div>
        </div>
    )
}
