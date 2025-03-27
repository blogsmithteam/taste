import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Navigation from './Navigation'

describe('Navigation', () => {
  it('renders navigation links', () => {
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    )

    expect(screen.getByText('Taste')).toBeInTheDocument()
    expect(screen.getByText('Tasting Notes')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })
}) 