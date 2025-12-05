import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { BenefitProvider } from './context/BenefitContext'
import InputScreen from './screens/InputScreen'
import ClassificationScreen from './screens/ClassificationScreen'
import BenefitsList from './screens/BenefitsList'
import PlanScreen from './screens/PlanScreen'
import SeeAllBenefits from './screens/SeeAllBenefits'
import Breadcrumbs from './components/Breadcrumbs'

export default function App() {
  return (
    <BenefitProvider>
      <div className="app">
        <header className="header">
          <Link to="/" className="logo">Benefits AI</Link>
        </header>

        <main className="container">
          <Breadcrumbs />
          <Routes>
            <Route path="/" element={<InputScreen />} />
            <Route path="/classify" element={<ClassificationScreen />} />
            <Route path="/benefits" element={<BenefitsList />} />
            <Route path="/plan" element={<PlanScreen />} />
            <Route path="/all-benefits" element={<SeeAllBenefits />} />
          </Routes>
        </main>

        <footer className="footer">
          <small>AI-Powered Benefits Discovery • Demo</small>
        </footer>
      </div>
    </BenefitProvider>
  )
}
