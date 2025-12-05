import React, { useEffect, useState, useRef } from 'react'
import { useBenefit } from '../context/BenefitContext'
import { generatePlan } from '../services/ai'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

export default function PlanScreen() {
    const { category, selectedBenefit, plan, setPlan } = useBenefit()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const abortRef = useRef(null)
    const navigate = useNavigate()
    const toast = useToast()

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
                toast.push('Plan generated', { duration: 2200 })
            } catch (e) {
                if (e?.name === 'AbortError') return
                setError(e.message || 'Failed to generate plan')
                setLoading(false)
                toast.push('Plan generation failed', { duration: 3000 })
            }
        }

        if (!plan) run()
        // eslint-disable-next-line
    }, [])

    function onRegenerate() {
        setPlan(null)
        setError(null)
        toast.push('Regenerating plan…', { duration: 1500, sticky: true })
            ; (async () => {
                setLoading(true)
                try {
                    const res = await generatePlan(category, selectedBenefit)
                    setPlan(res.steps || [])
                    setLoading(false)
                    toast.push('Plan regenerated', { duration: 2200 })
                } catch (e) {
                    setError(e.message || 'Failed to generate plan')
                    setLoading(false)
                    toast.push('Plan generation failed', { duration: 3000 })
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
