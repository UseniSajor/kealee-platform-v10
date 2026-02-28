import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 })
    }

    if (!body.customer?.email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kealee.com'

    // Use the concept-checkout endpoint for one-time payments
    const backendResponse = await fetch(`${API_BASE_URL}/billing/stripe/concept-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') ? { Authorization: request.headers.get('authorization')! } : {}),
      },
      body: JSON.stringify({
        items: body.items.map((item: any) => ({
          name: item.name,
          amount: Math.round(item.price * 100), // convert to cents
          quantity: item.quantity || 1,
        })),
        customerEmail: body.customer.email,
        customerName: body.customer.name || '',
        customerPhone: body.customer.phone || '',
        funnelSessionId: body.funnelSessionId || '',
        packageTier: body.packageTier || '',
        successUrl: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${appUrl}/checkout`,
      }),
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return NextResponse.json({ success: true, url: data.url, sessionId: data.id })
    }

    // If Stripe fails, return the actual error — do NOT silently succeed
    const errorData = await backendResponse.json().catch(() => ({ error: 'Payment service unavailable' }))
    return NextResponse.json(
      { success: false, error: errorData.error || 'Failed to create checkout session' },
      { status: 502 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Checkout failed' },
      { status: 500 }
    )
  }
}
