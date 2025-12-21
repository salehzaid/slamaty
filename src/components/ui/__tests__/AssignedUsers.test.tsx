import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import AssignedUsers from '../AssignedUsers'

describe('AssignedUsers', () => {
  test('renders placeholder when no users', () => {
    render(<AssignedUsers users={[]} />)
    expect(screen.getByText(/غير محدد/i)).toBeInTheDocument()
  })

  test('shows +N button and opens modal', () => {
    const users = ['Alice', 'Bob', 'Charlie', 'Dave']
    render(<AssignedUsers users={users} maxVisible={2} />)
    expect(screen.getByText('+2')).toBeInTheDocument()
    fireEvent.click(screen.getByText('+2'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Dave')).toBeInTheDocument()
  })
})

