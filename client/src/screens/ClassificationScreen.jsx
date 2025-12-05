import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBenefit } from '../context/BenefitContext'
import { classify, askClarifyingQuestion } from '../services/ai'
import LottieLoader from '../components/LottieLoader'

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

  const confidence = detected?.confidence ?? 0
  const category = detected?.category

  // Confidence thresholds:
  // - High (>= 0.6): Normal flow with green checkmark
  // - Low (0.2 - 0.6): Warning with yellow badge
  // - Very Low (< 0.2): Red error state - only for extremely vague inputs
  const isHighConfidence = confidence >= 0.6
  const isLowConfidence = confidence >= 0.2 && confidence < 0.6
  const isVeryLowConfidence = confidence < 0.2

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
          <LottieLoader size={60} />
          <span>Analyzing your health need with AI…</span>
        </div>
      )}

      {!loading && detected && (
        <div className="fade-in" style={{ marginTop: 20 }}>
          {/* High Confidence (>= 0.6) - Normal Flow */}
          {isHighConfidence && (
            <div className="confidence-box high">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div className="confidence-badge high">
                  ✓
                </div>
                <h3 style={{ margin: 0, color: 'var(--text)' }}>{detected.category}</h3>
              </div>
              <div className="confidence-label">
                <span style={{ color: 'var(--muted)' }}>Confidence:</span>
                <span style={{ color: 'var(--accent)', fontWeight: '600' }}>
                  {Math.round(confidence * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* Low Confidence (0.4 - 0.6) - Show with warning */}
          {isLowConfidence && (
            <div className="confidence-box low">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div className="confidence-badge low">
                  ⚠
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text)' }}>{detected.category}</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                    Low confidence detection
                  </p>
                </div>
              </div>
              <div className="confidence-label">
                <span style={{ color: 'var(--muted)' }}>Confidence:</span>
                <span style={{ color: 'var(--warning)', fontWeight: '600' }}>
                  {Math.round(confidence * 100)}%
                </span>
              </div>

              {/* Clarifying Question Section */}
              {!clarifyingData && (
                <div className="clarify-box">
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
                          <LottieLoader size={20} />
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
                <div className="clarify-result">
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

          {/* Very Low Confidence (< 0.2 / 20%) - Only for extremely vague inputs */}
          {isVeryLowConfidence && (
            <div className="confidence-box very-low">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div className="confidence-badge very-low">
                  ?
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text)' }}>
                    {category === 'OPD' ? 'OPD (General)' : category || 'OPD (General)'}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                    Very low confidence - your input seems extremely vague. We need more details.
                  </p>
                </div>
              </div>
              <div className="confidence-label" style={{ marginBottom: '16px' }}>
                <span style={{ color: 'var(--muted)' }}>Confidence:</span>
                <span style={{ color: 'var(--error)', fontWeight: '600' }}>
                  {Math.round(confidence * 100)}%
                </span>
              </div>

              <div className="clarify-box">
                <p style={{ margin: '0 0 12px 0', fontSize: '0.9375rem', fontWeight: '500', color: 'var(--text)' }}>
                  Your input is too vague. Please provide specific details about your health concern, such as:
                </p>
                <ul style={{
                  margin: '0 0 16px 20px',
                  padding: 0,
                  fontSize: '0.875rem',
                  color: 'var(--text-light)',
                  lineHeight: '1.6'
                }}>
                  <li>Specific symptoms (fever, pain, cough, etc.)</li>
                  <li>Duration of the problem</li>
                  <li>Location or affected area</li>
                  <li>Any related concerns</li>
                </ul>
                <div className="actions" style={{ marginTop: '12px' }}>
                  <button className="btn" onClick={handleAskClarification} disabled={askingClarification}>
                    {askingClarification ? (
                      <>
                        <LottieLoader size={20} />
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
                <div className="clarify-result">
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

          {/* Action buttons - show proceed for high confidence or low confidence (not very low) */}
          <div className="actions" style={{ marginTop: 20 }}>
            {(isHighConfidence || isLowConfidence || (clarifyingData && clarifyingData.confidence >= 0.2)) && (
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
            background: 'var(--surface-light)',
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
