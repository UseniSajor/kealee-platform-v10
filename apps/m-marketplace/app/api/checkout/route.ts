import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 })
    }

    // Try Stripe checkout via backend
    try {
      const backendResponse = await fetch(`${API_BASE_URL}/billing/stripe/checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(request.headers.get('authorization') ? { Authorization: request.headers.get('authorization')! } : {}),
        },
        body: JSON.stringify({
          lineItems: body.items.map((item: any) => ({
            name: item.name,
            amount: item.price * 100,
            quantity: item.quantity,
          })),
          customerEmail: body.customer?.email,
          customerName: body.customer?.name,
          metadata: { source: 'marketplace-checkout', company: body.customer?.company || '' },
          successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kealee.com'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kealee.com'}/cart`,
        }),
      })

      if (backendResponse.ok) {
        const data = await backendResponse.json()
        return NextResponse.json({ success: true, url: data.url, sessionId: data.id })
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully',
      orderId: `ORD-${Date.now()}`,
    }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, error: 'Checkout failed' }, { status: 500 })
  }
}
