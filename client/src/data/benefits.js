// Mock benefits per category. Frontend shows 2-4 cards.
// Your assignment expects mock data; server creates plan via AI.
const BENEFITS = {
  Dental: [
    {
      id: 'dental-1',
      title: 'Dental Coverage Plan',
      coverage: 'Up to ₹5,000/year',
      description: 'Covers consultations, cleaning, X-rays and basic procedures.'
    },
    {
      id: 'dental-2',
      title: 'Orthodontics Rider',
      coverage: 'Up to ₹15,000 lifetime',
      description: 'Partial coverage for braces and related consultations.'
    }
  ],
  Vision: [
    {
      id: 'vision-1',
      title: 'Annual Eye Checkup',
      coverage: '₹3,000/year',
      description: 'Covers eye exams and prescription lenses.'
    }
  ],
  'Mental Health': [
    {
      id: 'mental-1',
      title: 'Therapy Session Coverage',
      coverage: '₹4,000/month',
      description: 'Licensed counselling sessions reimbursed.'
    },
    {
      id: 'mental-2',
      title: 'Wellness Coaching',
      coverage: 'Up to 6 sessions/year',
      description: 'Support for stress management and coaching.'
    }
  ],
  OPD: [
    {
      id: 'opd-1',
      title: 'OPD Reimbursement',
      coverage: 'Up to ₹10,000/year',
      description: 'Covers general consultations and basic tests.'
    }
  ],
  Maternity: [
    {
      id: 'mat-1',
      title: 'Maternity Support',
      coverage: 'Hospitalization & checkups',
      description: 'Covers prenatal consultations and delivery.'
    }
  ],
  'Chronic Care': [
    {
      id: 'chronic-1',
      title: 'Chronic Condition Management',
      coverage: 'Ongoing medication support',
      description: 'Support for long-term conditions and meds.'
    }
  ],
  Physiotherapy: [
    {
      id: 'physio-1',
      title: 'Physiotherapy Sessions',
      coverage: 'Up to 10 sessions/year',
      description: 'Covers rehab & physiotherapy consultations.'
    }
  ]
}

export default BENEFITS
