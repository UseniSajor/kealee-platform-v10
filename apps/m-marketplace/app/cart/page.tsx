'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useCart, formatPrice } from '@/lib/cart-context'

const appSourceLabels: Record<string, string> = {
  'ops-services': 'PM Services',
  permits: 'Permits',
  estimation: 'Estimation',
  'finance-trust': 'Finance',
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCart()

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <Link href="/" className="hover:text-sky-600 transition">Home</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Cart</span>
          </nav>

          <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-sky-600" />
            Your Cart
          </h1>

          {items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">Browse our services, packages, and tools to build your project management solution.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-xl font-bold text-sm hover:bg-sky-700 transition">
                  View All Pricing <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/services" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:border-sky-300 transition">
                  Browse Services
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {items.map(item => (
                  <div key={item.productId} className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">{item.unit}</span>
                          <span className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-medium">
                            {appSourceLabels[item.appSource] || item.appSource}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => removeItem(item.productId)} className="p-2 hover:bg-red-50 rounded-xl transition">
                        <Trash2 className="h-5 w-5 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">Qty:</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="font-semibold w-8 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-sky-600">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
                <button onClick={clearCart} className="text-sm text-gray-400 hover:text-red-500 transition mt-2">Clear cart</button>
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
                      <span className="text-base font-medium text-gray-700">Subtotal</span>
                      <span className="text-2xl font-black text-gray-900">{formatPrice(subtotal)}</span>
                    </div>
                  </div>
                  <Link href="/checkout" className="flex items-center justify-center gap-2 w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm transition">
                    Proceed to Checkout <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/pricing" className="flex items-center justify-center gap-2 w-full py-3 mt-3 text-gray-600 hover:text-sky-600 text-sm font-medium transition">
                    <ArrowLeft className="h-4 w-4" /> Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
