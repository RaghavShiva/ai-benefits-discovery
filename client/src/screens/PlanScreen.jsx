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
                // res expected { steps: [...] }
                setPlan(res.steps || [])
                setLoading(false)
            } catch (e) {
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
            // call effect again by generating directly
            (async () => {
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
        <div className="card">
            <h2>How to use: {selectedBenefit?.title}</h2>
            <p className="muted">{selectedBenefit?.coverage} • {category}</p>

            {loading && <div className="loader">Generating plan…</div>}
            {error && (
                <div className="error">
                    <p>{error}</p>
                    <div className="actions">
                        <button className="btn" onClick={onRegenerate}>Regenerate</button>
                    </div>
                </div>
            )}

            {!loading && !error && plan && (
                <ol className="steps">
                    {plan.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
            )}

            <div className="actions">
                <button className="btn ghost" onClick={() => navigate('/benefits')}>Back to benefits</button>
                <button className="btn" onClick={onRegenerate}>Regenerate</button>
            </div>
        </div>
    )
}
