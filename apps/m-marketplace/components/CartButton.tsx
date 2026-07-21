'use client'

import { X, ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useCart, formatPrice } from '@/lib/cart-context'

export function CartDropdown() {
  const { items, removeItem, updateQuantity, itemCount, subtotal, isOpen, closeCart } = useCart()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) closeCart()
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, closeCart])

  if (!isOpen) return null

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-sky-600" />
          <span className="text-sm font-bold text-gray-900">Cart ({itemCount})</span>
        </div>
        <button onClick={closeCart} className="p-1 hover:bg-gray-100 rounded-lg transition">
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto p-3">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-10 w-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Your cart is empty</p>
            <p className="text-xs text-gray-400 mt-1">Browse services and packages to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.productId} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-gray-900 truncate">{item.name}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">{item.unit} · {item.appSource}</p>
                  </div>
                  <button onClick={() => removeItem(item.productId)} className="p-0.5 hover:bg-red-50 rounded transition ml-2">
                    <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-medium w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="text-xs font-bold text-sky-600">{formatPrice(item.price * item.quantity)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {items.length > 0 && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Subtotal</span>
            <span className="text-lg font-black text-gray-900">{formatPrice(subtotal)}</span>
          </div>
          <Link href="/cart" onClick={closeCart} className="flex items-center justify-center gap-2 w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm transition">
            View Cart & Checkout <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

export function CartButton() {
  const { itemCount, toggleCart } = useCart()

  return (
    <div className="relative">
      <button onClick={toggleCart} className="relative text-gray-700 hover:text-sky-600 transition" aria-label="Cart">
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-sky-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </button>
      <CartDropdown />
    </div>
  )
}

export function AddToCartButton({ product, variant = 'primary', className = '' }: {
  product: { id: string; name: string; price: number; priceLabel: string; unit: string; category: string; appSource: string }
  variant?: 'primary' | 'secondary' | 'sm'
  className?: string
}) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const variants = {
    primary: 'px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white text-sm rounded-xl',
    secondary: 'px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-xl',
    sm: 'px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs rounded-lg',
  }

  return (
    <button onClick={handleAdd} className={`inline-flex items-center justify-center gap-2 font-bold transition ${variants[variant]} ${className}`}>
      {added ? (<><span className="h-4 w-4">✓</span> Added!</>) : (<><ShoppingCart className="h-4 w-4" /> Add to Cart</>)}
    </button>
  )
}
