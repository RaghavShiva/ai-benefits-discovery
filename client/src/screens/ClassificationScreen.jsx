import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBenefit } from '../context/BenefitContext'
import { classify, askClarifyingQuestion } from '../services/ai'
import { useToast } from '../context/ToastContext'

export default function ClassificationScreen() {
  const { text, setCategory, setClassificationMeta } = useBenefit()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [detected, setDetected] = useState(null)
  const [clarifyingData, setClarifyingData] = useState(null)
  const [askingClarification, setAskingClarification] = useState(false)
  const abortRef = useRef(null)
  const mountedRef = useRef(true)
  const navigate = useNavigate()
  const toast = useToast()

  const confidence = detected?.confidence ?? 0
  const isHighConfidence = confidence >= 0.6
  const isLowConfidence = confidence >= 0.4 && confidence < 0.6
  const isVeryLowConfidence = confidence < 0.4

  async function runClassify() {
    setError(null)
    setClarifyingData(null)
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
      abortRef.current = null
    } catch (e) {
      if (e?.name === 'AbortError') return
      setLoading(false)
      setError(e?.message || 'classification failed')
      toast.push('Classification failed', { duration: 3000 })
    }
  }

  async function handleAskClarification() {
    setAskingClarification(true)
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await askClarifyingQuestion(text, controller.signal)
      if (!mountedRef.current) return
      setClarifyingData(res)
      // Re-classify with the clarified understanding
      if (res.category && res.confidence >= 0.4) {
        setCategory(res.category)
        setClassificationMeta({ confidence: res.confidence })
        setDetected({ category: res.category, confidence: res.confidence })
      }
      setAskingClarification(false)
      abortRef.current = null
    } catch (e) {
      if (e?.name === 'AbortError') return
      setAskingClarification(false)
      toast.push('Failed to get clarification', { duration: 3000 })
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
          {/* High Confidence (>= 0.6) - Normal Flow */}
          {isHighConfidence && (
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
                  {Math.round(confidence * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* Low Confidence (0.4 - 0.6) - Show with warning */}
          {isLowConfidence && (
            <div style={{
              padding: 20,
              borderRadius: 'var(--radius-lg)',
              border: '2px solid var(--warning)',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '1.125rem'
                }}>
                  ⚠
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text)' }}>{detected.category}</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                    Low confidence detection
                  </p>
                </div>
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
                <span style={{ color: 'var(--warning)', fontWeight: '600' }}>
                  {Math.round(confidence * 100)}%
                </span>
              </div>

              {/* Clarifying Question Section */}
              {!clarifyingData && (
                <div style={{ marginTop: '16px', padding: '16px', background: '#fff', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.9375rem', fontWeight: '500', color: 'var(--text)' }}>
                    Need clarification?
                  </p>
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                    We detected your category with lower confidence. Would you like to help us understand better?
                  </p>
                  <div className="actions" style={{ marginTop: '12px' }}>
                    <button className="btn" onClick={handleAskClarification} disabled={askingClarification}>
                      {askingClarification ? (
                        <>
                          <div className="loader-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                          Asking...
                        </>
                      ) : (
                        'Ask AI a clarifying question'
                      )}
                    </button>
                    <button className="btn ghost" onClick={onEdit}>Edit my input</button>
                  </div>
                </div>
              )}

              {clarifyingData && (
                <div style={{ marginTop: '16px', padding: '16px', background: '#fff', borderRadius: 'var(--radius)', border: '1px solid var(--accent)' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--accent)' }}>
                    Clarifying question:
                  </p>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.9375rem', color: 'var(--text)' }}>
                    {clarifyingData.question}
                  </p>
                  {clarifyingData.category && (
                    <p style={{ margin: '0', fontSize: '0.875rem', color: 'var(--muted)' }}>
                      Updated category: <strong style={{ color: 'var(--accent)' }}>{clarifyingData.category}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Very Low Confidence (< 0.4) - Show OPD fallback */}
          {isVeryLowConfidence && (
            <div style={{
              padding: 20,
              borderRadius: 'var(--radius-lg)',
              border: '2px solid var(--error)',
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--error)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '1.125rem'
                }}>
                  ?
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text)' }}>OPD (General)</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                    Very low confidence - needs clarification
                  </p>
                </div>
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: '#fff',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '16px'
              }}>
                <span style={{ color: 'var(--muted)' }}>Confidence:</span>
                <span style={{ color: 'var(--error)', fontWeight: '600' }}>
                  {Math.round(confidence * 100)}%
                </span>
              </div>

              <div style={{ padding: '16px', background: '#fff', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.9375rem', fontWeight: '500', color: 'var(--text)' }}>
                  We need more information to help you better.
                </p>
                <div className="actions" style={{ marginTop: '12px' }}>
                  <button className="btn" onClick={handleAskClarification} disabled={askingClarification}>
                    {askingClarification ? (
                      <>
                        <div className="loader-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                        Asking...
                      </>
                    ) : (
                      'Ask AI a clarifying question'
                    )}
                  </button>
                  <button className="btn ghost" onClick={onEdit}>Edit my input</button>
                </div>
              </div>

              {clarifyingData && (
                <div style={{ marginTop: '16px', padding: '16px', background: '#fff', borderRadius: 'var(--radius)', border: '1px solid var(--accent)' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--accent)' }}>
                    Clarifying question:
                  </p>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.9375rem', color: 'var(--text)' }}>
                    {clarifyingData.question}
                  </p>
                  {clarifyingData.category && (
                    <p style={{ margin: '0', fontSize: '0.875rem', color: 'var(--muted)' }}>
                      Suggested category: <strong style={{ color: 'var(--accent)' }}>{clarifyingData.category}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action buttons - only show proceed if high confidence or after clarification */}
          <div className="actions" style={{ marginTop: 20 }}>
            {(isHighConfidence || (clarifyingData && clarifyingData.confidence >= 0.4)) && (
              <button className="btn" onClick={onProceed}>See recommended benefits</button>
            )}
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
