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
      <h2>Classifying…</h2>
      <p className="muted">We analyzed: <strong>{text}</strong></p>

      {loading && <div className="loader">Loading AI…</div>}

      {!loading && detected && (
        <div style={{ marginTop: 12 }}>
          <div style={{ padding: 12, borderRadius: 8, border: '1px solid #eef2ff', background: '#fff' }}>
            <h3 style={{ margin: 0 }}>{detected.category}</h3>
            <p className="muted" style={{ marginTop: 6 }}>
              Confidence: {(detected.confidence ?? 0).toFixed(2)}
            </p>
          </div>

          <div className="actions" style={{ marginTop: 12 }}>
            <button className="btn" onClick={onProceed}>See recommended benefits</button>
            <button className="btn ghost" onClick={runClassify}>Regenerate</button>
            <button className="btn ghost" onClick={onEdit}>Edit input</button>
          </div>
        </div>
      )}

      {!loading && !detected && !error && (
        <div className="muted" style={{ marginTop: 12 }}>
          If nothing appears, click Try again.
          <div className="actions" style={{ marginTop: 8 }}>
            <button className="btn" onClick={runClassify}>Try again</button>
            <button className="btn ghost" onClick={onEdit}>Edit input</button>
          </div>
        </div>
      )}

      {error && (
        <div className="error" style={{ marginTop: 12 }}>
          <p>{error}</p>
          <div className="actions">
            <button className="btn" onClick={runClassify}>Try again</button>
            <button className="btn ghost" onClick={onEdit}>Edit input</button>
          </div>
        </div>
      )}
    </div>
  )
}
