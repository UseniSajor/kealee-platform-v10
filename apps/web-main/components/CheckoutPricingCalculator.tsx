/**
 * Checkout Pricing Calculator Component
 * Displays dynamic pricing based on service details
 * Used in concept, estimation, and permits checkout flows
 */

'use client'

import React, { useState, useEffect } from 'react'

interface PricingInput {
  serviceType: 'concept' | 'estimation' | 'permits'
  tier: string
  jurisdiction?: string
  projectType?: string
  complexityScore?: number
  zoningRisk?: 'LOW' | 'MEDIUM' | 'HIGH'
  submissionMethod?: 'SELF' | 'ASSISTED' | 'KEALEE_MANAGED'
  estimatedValuation?: number
  conceptDeliverables?: {
    mepSystem?: { [key: string]: string }
    billOfMaterials?: Array<{ [key: string]: any }>
    estimatedCost?: number
    description?: string
  }
}

interface PricingResponse {
  finalPrice: number
  basePrice: number
  adjustments: Array<{
    label: string
    amount: number
    percentage: number
    reason: string
  }>
  pricingExplanation: string
  checkoutDisplayLabel: string
}

export default function CheckoutPricingCalculator({ input, onPriceUpdate }: { input: PricingInput; onPriceUpdate?: (price: number) => void }) {
  const [pricing, setPricing] = useState<PricingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showBreakdown, setShowBreakdown] = useState(false)

  useEffect(() => {
    const calculatePrice = async () => {
      if (!input.serviceType || !input.tier) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/v1/checkout/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })

        if (!response.ok) {
          throw new Error('Failed to calculate pricing')
        }

        const data = await response.json()
        const pricingData = data.data

        setPricing(pricingData)
        onPriceUpdate?.(pricingData.finalPrice)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Pricing calculation failed')
      } finally {
        setLoading(false)
      }
    }

    calculatePrice()
  }, [input, onPriceUpdate])

  if (loading) {
    return (
      <div className='pricing-loader'>
        <div className='spinner'>⏳</div>
        <p>Calculating final price...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className='pricing-error'>
        <p>⚠️ {error}</p>
      </div>
    )
  }

  if (!pricing) {
    return null
  }

  return (
    <div className='checkout-pricing'>
      {/* Main Price Display */}
      <div className='pricing-display'>
        <div className='price-header'>
          <h3>{pricing.checkoutDisplayLabel}</h3>
        </div>

        <div className='price-breakdown-section'>
          <div className='base-price'>
            <span>Base Price</span>
            <span className='amount'>${pricing.basePrice.toFixed(2)}</span>
          </div>

          {pricing.adjustments.length > 0 && (
            <div className='adjustments'>
              {pricing.adjustments.map((adj, idx) => (
                <div key={idx} className='adjustment-item'>
                  <span className='label'>{adj.label}</span>
                  <span className={`amount ${adj.amount > 0 ? 'increase' : 'decrease'}`}>
                    {adj.amount > 0 ? '+' : ''} ${Math.abs(adj.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className='final-price'>
            <span>Final Price</span>
            <span className='amount'>${pricing.finalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Explanation */}
        <p className='pricing-explanation'>{pricing.pricingExplanation}</p>

        {/* Toggle Breakdown */}
        {pricing.adjustments.length > 0 && (
          <button className='toggle-breakdown' onClick={() => setShowBreakdown(!showBreakdown)}>
            {showBreakdown ? '▼ Hide' : '▶ Show'} Pricing Details
          </button>
        )}

        {/* Detailed Breakdown */}
        {showBreakdown && (
          <div className='detailed-breakdown'>
            <h4>Pricing Breakdown</h4>
            {pricing.adjustments.map((adj, idx) => (
              <div key={idx} className='breakdown-item'>
                <div>
                  <strong>{adj.label}</strong>
                  <p>{adj.reason}</p>
                </div>
                <div>
                  <span>{adj.percentage.toFixed(1)}%</span>
                  <span>${Math.abs(adj.amount).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CSS */}
      <style jsx>{`
        .checkout-pricing {
          background: #f9f9f9;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 24px;
          margin: 20px 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .pricing-loader,
        .pricing-error {
          padding: 40px;
          text-align: center;
          border-radius: 8px;
          background: #f5f5f5;
        }

        .spinner {
          font-size: 48px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          100% {
            transform: rotate(360deg);
          }
        }

        .pricing-error {
          background: #fff3cd;
          border: 1px solid #ffc107;
          color: #856404;
        }

        .price-header h3 {
          margin: 0;
          color: #333;
          font-size: 18px;
        }

        .price-breakdown-section {
          margin: 20px 0;
          background: white;
          border-radius: 6px;
          padding: 16px;
          border: 1px solid #e8e8e8;
        }

        .base-price,
        .final-price {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          font-weight: 600;
          border-bottom: 2px solid #f0f0f0;
        }

        .final-price {
          border-bottom: none;
          border-top: 2px solid #333;
          font-size: 18px;
          color: #0066cc;
        }

        .amount {
          color: #0066cc;
          font-family: 'Monaco', monospace;
        }

        .adjustments {
          margin: 12px 0;
        }

        .adjustment-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
          color: #666;
        }

        .adjustment-item .amount {
          color: #666;
        }

        .adjustment-item .amount.increase {
          color: #d9534f;
        }

        .adjustment-item .amount.decrease {
          color: #5cb85c;
        }

        .pricing-explanation {
          margin: 16px 0;
          font-size: 14px;
          color: #666;
          font-style: italic;
        }

        .toggle-breakdown {
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
          color: #333;
        }

        .toggle-breakdown:hover {
          background: #e8e8e8;
        }

        .detailed-breakdown {
          margin-top: 16px;
          padding: 16px;
          background: #f9f9f9;
          border-radius: 4px;
          border-left: 4px solid #0066cc;
        }

        .detailed-breakdown h4 {
          margin-top: 0;
          color: #333;
        }

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #e8e8e8;
          font-size: 14px;
        }

        .breakdown-item:last-child {
          border-bottom: none;
        }

        .breakdown-item strong {
          color: #333;
        }

        .breakdown-item p {
          margin: 4px 0 0;
          color: #999;
          font-size: 12px;
        }
      `}</style>
    </div>
  )
}
