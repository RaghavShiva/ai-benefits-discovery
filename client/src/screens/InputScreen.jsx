import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBenefit } from '../context/BenefitContext'

export default function InputScreen() {
  const { setText, setCategory, setClassificationMeta, setSelectedBenefit, setPlan } = useBenefit()
  const [value, setValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  function onSubmit(e) {
    e.preventDefault()
    const t = value.trim()
    if (!t || t.length < 3) return
    setIsSubmitting(true)
    // reset downstream state
    setText(t)
    setCategory(null)
    setClassificationMeta(null)
    setSelectedBenefit(null)
    setPlan(null)
    setTimeout(() => {
      navigate('/classify')
      setIsSubmitting(false)
    }, 100)
  }

  const isValid = value.trim().length >= 3
  const charCount = value.length

  return (
    <div className="card fade-in">
      <h2>What's your health need?</h2>
      <p className="muted" style={{ marginBottom: '20px' }}>
        Describe your health concern or question, and we'll help you discover relevant benefits.
      </p>
      <form onSubmit={onSubmit}>
        <textarea
          placeholder="I have tooth pain, what can I do?"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={5}
          className="input"
          disabled={isSubmitting}
          maxLength={500}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '8px',
          fontSize: '0.875rem',
          color: 'var(--muted)'
        }}>
          <span>
            {charCount > 0 && (
              <span style={{ color: isValid ? 'var(--muted)' : 'var(--error)' }}>
                {charCount} / 500 characters
              </span>
            )}
          </span>
          {!isValid && charCount > 0 && (
            <span style={{ color: 'var(--error)' }}>
              Please enter at least 3 characters
            </span>
          )}
        </div>
        <div className="actions">
          <button
            type="submit"
            className="btn"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="loader-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                Processing...
              </>
            ) : (
              'Discover benefits'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
