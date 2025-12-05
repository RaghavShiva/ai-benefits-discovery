import React, { createContext, useContext, useState } from 'react'

const BenefitContext = createContext()

export function BenefitProvider({ children }) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState(null)
  const [classificationMeta, setClassificationMeta] = useState(null) // e.g. confidence
  const [selectedBenefit, setSelectedBenefit] = useState(null)
  const [plan, setPlan] = useState(null)

  return (
    <BenefitContext.Provider value={{
      text, setText,
      category, setCategory,
      classificationMeta, setClassificationMeta,
      selectedBenefit, setSelectedBenefit,
      plan, setPlan
    }}>
      {children}
    </BenefitContext.Provider>
  )
}

export const useBenefit = () => useContext(BenefitContext)
