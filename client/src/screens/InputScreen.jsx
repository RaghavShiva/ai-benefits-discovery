import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBenefit } from '../context/BenefitContext'

export default function InputScreen() {
  const { setText, setCategory, setClassificationMeta, setSelectedBenefit, setPlan } = useBenefit()
  const [value, setValue] = useState('')
  const navigate = useNavigate()

  function onSubmit(e) {
    e.preventDefault()
    const t = value.trim()
    if (!t) return
    // reset downstream state
    setText(t)
    setCategory(null)
    setClassificationMeta(null)
    setSelectedBenefit(null)
    setPlan(null)
    navigate('/classify')
  }

  return (
    <div className="card">
      <h2>What’s your health need?</h2>
      <form onSubmit={onSubmit}>
        <textarea
          placeholder="I have tooth pain, what can I do?"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          className="input"
        />
        <div className="actions">
          <button type="submit" className="btn">Discover benefits</button>
        </div>
      </form>
    </div>
  )
}
