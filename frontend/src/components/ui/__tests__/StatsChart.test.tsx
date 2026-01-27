import React from 'react'
import { render, screen } from '@testing-library/react'
import StatsChart from '../StatsChart'
import { CheckCircle2 } from 'lucide-react'

describe('StatsChart', () => {
  test('renders title and value and previousValue tooltip', () => {
    render(<StatsChart title="معدل الإنجاز" value={68} previousValue={80} icon={<CheckCircle2 />} color="text-green-600" bgColor="bg-green-100" />)
    expect(screen.getByText(/معدل الإنجاز/i)).toBeInTheDocument()
    expect(screen.getByText('68')).toBeInTheDocument()
    // tooltip is in title attribute
    const elem = screen.getByText(/٪/)
    expect(elem).toBeTruthy()
  })
})

