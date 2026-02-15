'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, CreditCard, Lock, ShoppingCart } from 'lucide-react'
import { Header } from '@/components/Header'
import { useCart, formatPrice } from '@/lib/cart-context'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCart()
  const [processing, setProcessing] = useState(false)
  const [form, setForm] = useState({ email: '', name: '', company: '', phone: '' })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return
    setProcessing(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity, appSource: i.appSource })),
          customer: form,
          subtotal,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.url) { window.location.href = data.url; return }
      }

      clearCart()
      router.push('/checkout/success')
    } catch {
      clearCart()
      router.push('/checkout/success')
    } finally {
      setProcessing(false)
    }
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
            <Link href="/pricing" className="text-sky-600 font-semibold hover:underline">Browse pricing</Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-sky-600 transition mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Cart
          </Link>
          <h1 className="text-3xl font-black text-gray-900 mb-8">Checkout</h1>

          <form onSubmit={handleCheckout}>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                      <input type="text" required value={form.name} onChange={e => update('name', e.target.value)} placeholder="John Doe" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                      <input type="email" required value={form.email} onChange={e => update('email', e.target.value)} placeholder="john@example.com" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Company</label>
                      <input type="text" value={form.company} onChange={e => update('company', e.target.value)} placeholder="Your Company" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone *</label>
                      <input type="tel" required value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(555) 555-5555" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none" />
                    </div>
                  </div>
                </div>

                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6 flex items-start gap-4">
                  <CreditCard className="h-6 w-6 text-sky-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sky-900 mb-1">Secure Payment</h3>
                    <p className="text-sm text-sky-700">You will be redirected to our secure Stripe payment page. Your payment information is encrypted and never stored on our servers.</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-24 bg-white border-2 border-gray-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
                  <div className="space-y-3 mb-4">
                    {items.map(item => (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate mr-2">{item.name} {item.quantity > 1 ? `(×${item.quantity})` : ''}</span>
                        <span className="font-medium text-gray-900 flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-base font-medium text-gray-700">Total</span>
                      <span className="text-2xl font-black text-gray-900">{formatPrice(subtotal)}</span>
                    </div>
                  </div>
                  <button type="submit" disabled={processing} className="flex items-center justify-center gap-2 w-full py-3.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white rounded-xl font-bold text-sm transition">
                    {processing ? 'Processing...' : <><Lock className="h-4 w-4" /> Pay {formatPrice(subtotal)}</>}
                  </button>
                  <div className="mt-4 space-y-2">
                    {['256-bit SSL encryption', 'Money-back guarantee', 'PCI compliant'].map(t => (
                      <div key={t} className="flex items-center gap-2 text-xs text-gray-500">
                        <CheckCircle className="h-3.5 w-3.5 text-sky-500" /> <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
