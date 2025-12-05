import React from 'react'
import { useNavigate } from 'react-router-dom'
import BENEFITS from '../data/benefits'
import { useBenefit } from '../context/BenefitContext'

export default function BenefitsList() {
  const { category, setSelectedBenefit, setCategory } = useBenefit()
  const navigate = useNavigate()

  if (!category) {
    return (
      <div className="card">
        <h3>No category found</h3>
        <p className="muted">Please go back and enter your need.</p>
        <div className="actions">
          <button className="btn" onClick={() => navigate('/')}>Home</button>
        </div>
      </div>
    )
  }

  const list = BENEFITS[category] || BENEFITS.OPD || []

  return (
    <div className="card fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Recommended benefits — {category}</h2>
        <div>
          <button className="btn ghost" onClick={() => { setCategory(null); navigate('/classify') }}>Change category</button>
          <button className="btn ghost" onClick={() => navigate('/all-benefits')} style={{ marginLeft: 8 }}>See all benefits</button>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 12 }}>
        {list.slice(0, 4).map(b => (
          <article key={b.id} className="benefit">
            <h3>{b.title}</h3>
            <p className="muted">{b.coverage}</p>
            <p>{b.description}</p>
            <div className="actions">
              <button
                className="btn"
                onClick={() => {
                  setSelectedBenefit(b)
                  navigate('/plan')
                }}
              >
                View plan
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="actions" style={{ marginTop: 20 }}>
        <button className="btn ghost" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    </div>
  )
}
