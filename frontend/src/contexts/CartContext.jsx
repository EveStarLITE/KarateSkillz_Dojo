import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const storageKey = 'ksd-cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem(storageKey) || '[]'))

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items))
  }, [items])

  const value = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return {
      items,
      subtotal,
      addToCart(item) {
        setItems((prev) => {
          const index = prev.findIndex((line) => line.id === item.id && line.type === item.type)
          if (index < 0) return [...prev, { ...item, quantity: 1 }]
          const copy = [...prev]
          copy[index] = { ...copy[index], quantity: copy[index].quantity + 1 }
          return copy
        })
      },
      removeFromCart(id, type) {
        setItems((prev) => prev.filter((item) => !(item.id === id && item.type === type)))
      },
      updateQuantity(id, type, quantity) {
        const n = Number(quantity)
        const safe = Number.isFinite(n) && n > 0 ? Math.max(1, Math.floor(n)) : 1
        setItems((prev) =>
          prev.map((item) => (item.id === id && item.type === type ? { ...item, quantity: safe } : item))
        )
      },
      clearCart() {
        setItems([])
      },
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
