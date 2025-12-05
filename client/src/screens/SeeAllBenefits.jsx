import React, { useState } from 'react'
import BENEFITS from '../data/benefits'
import { useBenefit } from '../context/BenefitContext'
import { useNavigate } from 'react-router-dom'

export default function SeeAllBenefits() {
  const categories = Object.keys(BENEFITS)
  const [filter, setFilter] = useState('')
  const { setSelectedBenefit } = useBenefit()
  const navigate = useNavigate()

  const all = Object.values(BENEFITS).flat()

  const list = filter ? all.filter(b => b.title.toLowerCase().includes(filter.toLowerCase())) : all

  return (
    <div className="card">
      <h2>All Benefits</h2>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input className="input" placeholder="Search benefits" value={filter} onChange={e => setFilter(e.target.value)} />
        <select className="input" onChange={e => setFilter(e.target.value)} defaultValue="">
          <option value="">Filter by category</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid" style={{ marginTop: 12 }}>
        {list.map(b => (
          <article key={b.id} className="benefit fade-in">
            <h3>{b.title}</h3>
            <p className="muted">{b.coverage}</p>
            <p>{b.description}</p>
            <div className="actions">
              <button className="btn" onClick={() => { setSelectedBenefit(b); navigate('/plan') }}>View plan</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
