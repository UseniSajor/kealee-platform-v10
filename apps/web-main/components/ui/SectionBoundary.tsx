'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Named in the console/Sentry breadcrumb so a failing section is identifiable. */
  name: string
  /** Rendered in place of the section. Defaults to rendering nothing. */
  fallback?: ReactNode
}

interface State {
  failed: boolean
}

/**
 * Isolates a non-essential page section.
 *
 * A marketing page must never return a 500 because one supporting section
 * (a gallery, a pricing pathway, a media hero) threw. The commercially
 * important content — the product cards and their buy buttons — keeps
 * rendering, and the failure is still reported.
 */
export class SectionBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[section:${this.props.name}] render failed`, error, info.componentStack)
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}
