import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBenefit } from '../context/BenefitContext'
import { classify } from '../services/ai'
import { useToast } from '../context/ToastContext'

export default function ClassificationScreen() {
  const { text, setCategory, setClassificationMeta } = useBenefit()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [detected, setDetected] = useState(null)
  const abortRef = useRef(null)
  const mountedRef = useRef(true)
  const navigate = useNavigate()
  const toast = useToast()

  async function runClassify() {
    setError(null)
    if (!text) return navigate('/')
    setLoading(true)
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await classify(text, controller.signal)
      if (!mountedRef.current) return
      setCategory(res.category)
      setClassificationMeta({ confidence: res.confidence })
      setDetected({ category: res.category, confidence: res.confidence })
      setLoading(false)
      toast.push(`Detected ${res.category}`, { duration: 2200 })
      abortRef.current = null
    } catch (e) {
      if (e?.name === 'AbortError') return
      setLoading(false)
      setError(e?.message || 'classification failed')
      toast.push('Classification failed', { duration: 3000 })
    }
  }

  useEffect(() => {
    mountedRef.current = true
    runClassify()
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
    // eslint-disable-next-line
  }, [])

  function onProceed() { navigate('/benefits') }
  function onEdit() { navigate('/') }

  return (
    <div className="card">
      <h2>Analyzing your health need…</h2>
      <p className="muted">We're processing: <strong>"{text}"</strong></p>

      {loading && (
        <div className="loader">
          <div className="loader-spinner"></div>
          <span>Analyzing your health need with AI…</span>
        </div>
      )}

      {!loading && detected && (
        <div className="fade-in" style={{ marginTop: 20 }}>
          <div style={{
            padding: 20,
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--accent)',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: '700',
                fontSize: '1.125rem'
              }}>
                ✓
              </div>
              <h3 style={{ margin: 0, color: 'var(--text)' }}>{detected.category}</h3>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: '#fff',
              borderRadius: 'var(--radius)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              <span style={{ color: 'var(--muted)' }}>Confidence:</span>
              <span style={{ color: 'var(--accent)', fontWeight: '600' }}>
                {Math.round((detected.confidence ?? 0) * 100)}%
              </span>
            </div>
          </div>

          <div className="actions" style={{ marginTop: 12 }}>
            <button className="btn" onClick={onProceed}>See recommended benefits</button>
            <button className="btn ghost" onClick={runClassify}>Regenerate</button>
            <button className="btn ghost" onClick={onEdit}>Edit input</button>
          </div>
        </div>
      )}

      {!loading && !detected && !error && (
        <div className="fade-in" style={{ marginTop: 20 }}>
          <div style={{
            padding: '20px',
            background: '#f9fafb',
            borderRadius: 'var(--radius)',
            border: '2px dashed var(--border)',
            textAlign: 'center'
          }}>
            <p className="muted" style={{ marginBottom: '16px' }}>
              Classification is taking longer than expected. Please try again.
            </p>
            <div className="actions" style={{ justifyContent: 'center' }}>
              <button className="btn" onClick={runClassify}>Try again</button>
              <button className="btn ghost" onClick={onEdit}>Edit input</button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error fade-in" style={{ marginTop: 20 }}>
          <p style={{ margin: 0 }}><strong>Unable to classify your health need</strong></p>
          <p style={{ margin: '8px 0 0 0', fontSize: '0.875rem' }}>
            {error.includes('failed') || error.includes('error')
              ? 'We encountered an issue processing your request. Please try again or rephrase your health need.'
              : error}
          </p>
          <div className="actions" style={{ marginTop: '16px' }}>
            <button className="btn" onClick={runClassify}>Try again</button>
            <button className="btn ghost" onClick={onEdit}>Edit input</button>
          </div>
        </div>
      )}
    </div>
  )
}
