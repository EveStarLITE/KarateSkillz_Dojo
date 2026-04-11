import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import Layout from './components/Layout'
import PrivateLessonPicker from './components/PrivateLessonPicker'
import { apiFetch } from './api'
import { useAuth } from './contexts/AuthContext'
import { useCart } from './contexts/CartContext'

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const location = useLocation()
  if (loading) return <p>Loading...</p>
  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}`
    return <Navigate to="/login" replace state={{ from }} />
  }
  if (adminOnly && !isAdmin) return <Navigate to="/not-authorized" replace />
  return children
}

function StaticPage({ title, body }) {
  useEffect(() => {
    document.title = `${title} | Karate Skillz Dojo`
  }, [title])
  return (
    <section>
      <h1 className="mb-3 font-serif text-3xl">{title}</h1>
      <p className="text-gray-300">{body}</p>
    </section>
  )
}

function sanitizeOrderItems(items) {
  return items.map((item) => ({
    id: item.id,
    name: String(item.name ?? ''),
    type: item.type === 'service' ? 'service' : 'product',
    quantity: (() => {
      const n = Number(item.quantity)
      return Number.isFinite(n) && n > 0 ? Math.max(1, Math.floor(n)) : 1
    })(),
    price: Math.max(0, Number(item.price) || 0),
    ...(item.options != null ? { options: item.options } : {}),
  }))
}

function countDigits(phone) {
  return String(phone || '').replace(/\D/g, '').length
}

function formatPhoneDigits(input) {
  const digits = String(input || '').replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function formatExpiry(input) {
  const digits = String(input || '').replace(/\D/g, '').slice(0, 4)
  if (digits.length < 3) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

const HOME_TICKER_ITEMS = [
  { label: 'Tournament', text: 'Spring Open Kata & Kumite — registration opens April 15. Early-bird pricing for members.' },
  { label: 'Belt testing', text: 'Next grading window: May 2–4. Confirm eligibility with your instructor.' },
  { label: 'Seminar', text: 'Guest instructor weekend — footwork & counter-timing. Limited spots; ask at the desk.' },
  { label: 'Youth camp', text: 'Summer discipline & leadership week — enrollment opens June 1.' },
]

function HomeNewsTickerSegment({ ariaHidden }) {
  return (
    <div
      className="flex shrink-0 items-center gap-x-6 gap-y-2 whitespace-nowrap px-8 py-3 text-sm md:gap-x-10 md:text-base"
      aria-hidden={ariaHidden || undefined}
    >
      {HOME_TICKER_ITEMS.map((item, i) => (
        <span key={`${ariaHidden ? 'd' : 's'}-${item.label}`} className="inline-flex items-center gap-2">
          <span className="font-semibold uppercase tracking-wide text-dojo-crimson">{item.label}</span>
          <span className="text-gray-200">{item.text}</span>
          {i < HOME_TICKER_ITEMS.length - 1 && (
            <span className="select-none px-2 text-dojo-red/50" aria-hidden>
              ✦
            </span>
          )}
        </span>
      ))}
    </div>
  )
}

function HomePage() {
  useEffect(() => {
    document.title = 'Karate Skillz Dojo'
  }, [])
  return (
    <section className="home-page space-y-14 md:space-y-20">
      <div className="flex w-full flex-col items-center">
        <div className="home-hero-visual relative mx-auto flex w-full max-w-5xl items-center justify-center px-4 py-8 md:py-12">
          <img
            key="karate-skillz-dojo-gif-v5"
            src="/assets/KarateSkillzDojo.gif?v=5"
            alt="Karate Skillz Dojo — animated logo"
            className="home-hero-gif relative z-10 w-full max-w-[min(100%,640px)] object-contain"
            width={900}
            height={360}
            decoding="async"
            fetchPriority="high"
          />
        </div>

        <div
          className="home-marquee-wrap mt-2 border-y border-dojo-red/50 bg-dojo-ink/95 shadow-inner"
          role="region"
          aria-label="News and upcoming events"
        >
          <p className="sr-only">
            News: {HOME_TICKER_ITEMS.map((i) => `${i.label}: ${i.text}`).join('. ')}.
          </p>
          <div className="home-marquee-inner">
            <HomeNewsTickerSegment />
            <HomeNewsTickerSegment ariaHidden />
          </div>
        </div>
      </div>

      <div className="rounded border border-white/15 bg-dojo-ink/70 p-6 md:p-8">
        <h2 className="font-serif text-3xl font-semibold md:text-4xl">About the dojo</h2>
        <p className="mt-4 text-lg leading-relaxed text-gray-300">
          Karate Skillz Dojo began as a small neighborhood training hall focused on discipline, confidence, and practical
          self-defense. Over the years, it evolved into a full-service dojo with competitive athletes, youth development
          tracks, and a digital storefront for members and families.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-gray-300">
          Our philosophy blends traditional etiquette with modern coaching methods: clear progression paths, measurable
          milestones, and supportive feedback. We welcome beginners, returning students, and tournament-focused
          practitioners.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 md:gap-8">
        <article className="rounded border border-white/15 bg-dojo-ink/70 p-6">
          <h3 className="font-serif text-2xl font-semibold">Tournament highlights</h3>
          <ul className="mt-4 space-y-2 text-gray-300">
            <li>2022 Regional Open: 1st place — Team Kata (Adults)</li>
            <li>2023 Midwest Invitational: 2nd place — Kumite (U18)</li>
            <li>2024 State Martial Arts Classic: 1st place — Women&apos;s Kata</li>
            <li>2025 Tri-City Cup: 3rd place — Men&apos;s Kumite Heavyweight</li>
            <li>2025 Dojo League Finals: Top 5 overall team ranking</li>
          </ul>
        </article>

        <article className="rounded border border-white/15 bg-dojo-ink/70 p-6">
          <h3 className="font-serif text-2xl font-semibold">Weekly class schedule</h3>
          <ul className="mt-4 space-y-2 text-gray-300">
            <li>Monday: Youth Fundamentals (5:30 PM), Adult Basics (7:00 PM)</li>
            <li>Tuesday: Private Coaching Blocks (4:00 PM – 8:00 PM)</li>
            <li>Wednesday: Intermediate Skills (6:00 PM), Sparring Lab (7:30 PM)</li>
            <li>Thursday: Group Conditioning + Kata (6:30 PM)</li>
            <li>Friday: Open Mat / Belt Prep (6:00 PM)</li>
            <li>Saturday: Family Class (10:00 AM), Competition Team (12:00 PM)</li>
          </ul>
        </article>
      </div>

      <div className="rounded border border-white/15 bg-dojo-ink/70 p-6 md:p-8">
        <h3 className="font-serif text-2xl font-semibold">Community and development</h3>
        <p className="mt-4 text-lg leading-relaxed text-gray-300">
          Beyond classes, we run mentoring events, anti-bullying workshops, and seasonal camps that combine fitness with
          leadership training. Members can train, shop gear, manage services, and contact support through one unified
          experience.
        </p>
      </div>
    </section>
  )
}

function useCatalog() {
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])
  useEffect(() => {
    apiFetch('/products').then(setProducts).catch(() => {})
    apiFetch('/services').then(setServices).catch(() => {})
  }, [])
  return { products, services }
}

function ShopPage() {
  const { products, services } = useCatalog()
  const navigate = useNavigate()
  return (
    <section>
      <h1 className="mb-4 font-serif text-3xl">Shop</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {[...products, ...services].map((item) => (
          <article
            key={`${item.kind}-${item.id}`}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/shop/${item.kind === 'product' ? 'products' : 'services'}/${item.id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate(`/shop/${item.kind === 'product' ? 'products' : 'services'}/${item.id}`)
              }
            }}
            className="cursor-pointer rounded border border-white/20 bg-dojo-ink p-4 transition hover:border-dojo-crimson/60 hover:bg-dojo-black/40"
          >
            {item.imageUrl && (
              <div className="mb-3 aspect-square w-full overflow-hidden rounded border border-white/10 bg-dojo-black/40">
                <img className="h-full w-full object-contain" src={item.imageUrl} alt={item.name} loading="lazy" />
              </div>
            )}
            <h2 className="text-xl">{item.name}</h2>
            <p className="text-sm text-gray-300">{item.description}</p>
            <p className="my-2 font-semibold">${Number(item.price || 0).toFixed(2)}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function DetailPage({ type }) {
  const { id } = useParams()
  const { addToCart } = useCart()
  const [item, setItem] = useState(null)
  const [error, setError] = useState('')
  const [options, setOptions] = useState({ preferredDate: '', preferredTime: '', session: '', consent: false })
  const [quantity, setQuantity] = useState(1)
  const [addedMessage, setAddedMessage] = useState('')
  const [groupStudents, setGroupStudents] = useState([{ name: '', level: 'Beginner Evening Session', months: 1 }])
  const [sizes, setSizes] = useState(['M'])

  useEffect(() => {
    apiFetch(`/${type}/${id}`).then(setItem).catch((err) => setError(err.message))
  }, [id, type])

  if (error) return <p>{error}</p>
  if (!item) return <p>Loading...</p>

  function handleAdd() {
    if (item.name.toLowerCase().includes('private') && (!options.preferredDate || !options.preferredTime)) return
    if (item.name.toLowerCase().includes('life') && !options.consent) return

    if (String(item.id) === '5') {
      const validRows = groupStudents
        .map((s) => ({
          name: s.name.trim(),
          level: s.level,
          months: Math.max(1, Number(s.months) || 1),
        }))
        .filter((s) => s.name)
      const totalMonths = validRows.reduce((sum, s) => sum + s.months, 0)
      if (!totalMonths) {
        setAddedMessage('Add at least one student.')
        return
      }
      for (let i = 0; i < totalMonths; i += 1) {
        addToCart({
          id: item.id,
          name: item.name,
          type: item.kind,
          price: Number(item.price || 0),
          options: { ...options, students: validRows },
          ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
        })
      }
      setAddedMessage('The item has been added to cart.')
      window.setTimeout(() => setAddedMessage(''), 2500)
      return
    }

    const n = Number(quantity)
    const safeQty = Number.isFinite(n) && n > 0 ? Math.max(1, Math.floor(n)) : 1
    const itemOptions = String(item.id) === '1'
      ? { ...options, sizes: sizes.slice(0, safeQty) }
      : options
    for (let i = 0; i < safeQty; i += 1) {
      addToCart({
        id: item.id,
        name: item.name,
        type: item.kind,
        price: Number(item.price || 0),
        options: itemOptions,
        ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
      })
    }
    setAddedMessage('The item has been added to cart.')
    window.setTimeout(() => setAddedMessage(''), 2500)
  }

  return (
    <section className="space-y-3">
      <h1 className="font-serif text-3xl">{item.name}</h1>
      {item.imageUrl && (
        <div className="aspect-square w-full max-w-xl overflow-hidden rounded border border-white/10 bg-dojo-black/40">
          <img className="h-full w-full object-contain" src={item.imageUrl} alt={item.name} loading="lazy" />
        </div>
      )}
      <p>{String(item.id) === '3' ? 'Flaming Knucks OF DOOM is a premium impact-training weapon simulator with reinforced grip and heat-themed styling for advanced drill sessions. Designed for controlled dojo training and display - not for unsupervised combat use.' : item.description}</p>
      <p className="font-semibold">${Number(item.price || 0).toFixed(2)}</p>
      {item.name.toLowerCase().includes('private') && (
        <div className="space-y-2">
          <PrivateLessonPicker
            preferredDate={options.preferredDate}
            preferredTime={options.preferredTime}
            onChange={(next) => setOptions((o) => ({ ...o, ...next }))}
          />
        </div>
      )}
      {String(item.id) === '5' && (
        <div className="space-y-3 rounded border border-white/20 bg-dojo-ink/50 p-3">
          <p className="text-sm text-gray-300">Add student names and session level. Quantity is auto-calculated as total months across all students.</p>
          {groupStudents.map((student, idx) => (
            <div key={`student-${idx}`} className="grid gap-2 md:grid-cols-3">
              <input
                className="rounded bg-dojo-ink p-2"
                placeholder={`Student ${idx + 1} name`}
                value={student.name}
                onChange={(e) => setGroupStudents((prev) => prev.map((s, i) => (i === idx ? { ...s, name: e.target.value } : s)))}
              />
              <select
                className="rounded bg-dojo-ink p-2"
                value={student.level}
                onChange={(e) => setGroupStudents((prev) => prev.map((s, i) => (i === idx ? { ...s, level: e.target.value } : s)))}
              >
                <option>Beginner Evening Session</option>
                <option>Intermediate Weekend Session</option>
                <option>Advanced Sparring Camp</option>
              </select>
              <input
                className="rounded bg-dojo-ink p-2"
                type="number"
                min="1"
                placeholder="Months"
                value={student.months}
                onChange={(e) => setGroupStudents((prev) => prev.map((s, i) => (i === idx ? { ...s, months: Math.max(1, Number(e.target.value) || 1) } : s)))}
              />
            </div>
          ))}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded border border-white/30 px-3 py-1 text-sm"
              onClick={() => setGroupStudents((prev) => [...prev, { name: '', level: 'Beginner Evening Session', months: 1 }])}
            >
              Add Student
            </button>
            <span className="text-sm text-gray-300">
              Quantity total: {groupStudents.reduce((sum, s) => sum + (s.name.trim() ? Math.max(1, Number(s.months) || 1) : 0), 0)}
            </span>
          </div>
        </div>
      )}

      {item.name.toLowerCase().includes('group') && String(item.id) !== '5' && (
        <select className="w-full rounded bg-dojo-ink p-2" onChange={(e) => setOptions((o) => ({ ...o, session: e.target.value }))}>
          <option value="">Select a session</option>
          <option>Beginner Evening Session</option>
          <option>Intermediate Weekend Session</option>
          <option>Advanced Sparring Camp</option>
        </select>
      )}
      {item.name.toLowerCase().includes('life') && (
        <label className="block">
          <input type="checkbox" onChange={(e) => setOptions((o) => ({ ...o, consent: e.target.checked }))} /> I acknowledge lifetime membership terms
        </label>
      )}

      {String(item.id) !== '5' && (
        <label className="block text-sm text-gray-300">
          Quantity
          <input
            className="mt-1 w-28 rounded bg-dojo-ink p-2"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => {
              const nextQty = e.target.value
              setQuantity(nextQty)
              if (String(item.id) === '1') {
                const n = Math.max(1, Number(nextQty) || 1)
                setSizes((prev) => Array.from({ length: n }, (_, i) => prev[i] || 'M'))
              }
            }}
          />
        </label>
      )}

      {String(item.id) === '1' && (
        <div className="space-y-2 rounded border border-white/20 bg-dojo-ink/50 p-3">
          <p className="text-sm text-gray-300">Select Gi size for each quantity:</p>
          {Array.from({ length: Math.max(1, Number(quantity) || 1) }).map((_, idx) => (
            <label key={`size-${idx}`} className="flex items-center gap-2 text-sm">
              <span>Item {idx + 1}</span>
              <select
                className="rounded bg-dojo-ink p-2"
                value={sizes[idx] || 'M'}
                onChange={(e) =>
                  setSizes((prev) => {
                    const copy = [...prev]
                    copy[idx] = e.target.value
                    return copy
                  })
                }
              >
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
            </label>
          ))}
        </div>
      )}

      {addedMessage && <p className="text-base font-semibold text-green-400">{addedMessage}</p>}

      <div className="flex flex-wrap gap-3">
        <button className="rounded bg-dojo-red px-4 py-2" type="button" onClick={handleAdd}>
          Add to Cart
        </button>
        <Link className="rounded bg-dojo-red px-4 py-2" to="/shop">
          Keep shopping
        </Link>
      </div>
    </section>
  )
}

function cartLineDescription(item) {
  const o = item.options
  if (!o || typeof o !== 'object') return null
  const parts = []
  if (o.preferredDate) parts.push(`Date: ${o.preferredDate}`)
  if (o.preferredTime) parts.push(`Time: ${o.preferredTime}`)
  if (o.session) parts.push(`Session: ${o.session}`)
  if (Array.isArray(o.sizes) && o.sizes.length) parts.push(`Sizes: ${o.sizes.join(', ')}`)
  return parts.length ? parts.join(' · ') : null
}

function CartPage() {
  const { items, subtotal, removeFromCart, updateQuantity } = useCart()
  const { isAuthenticated } = useAuth()
  const lineTotal = (item) => (Number(item.price) || 0) * (Number(item.quantity) || 0)

  return (
    <section>
      <h1 className="mb-8 font-serif text-4xl font-bold tracking-tight">Cart</h1>
      {items.length === 0 ? (
        <p className="text-lg text-gray-300">Your cart is empty.</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
          <div className="space-y-4">
            {items.map((item) => {
              const desc = cartLineDescription(item)
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex gap-4 rounded border border-white/20 bg-dojo-ink/40 p-4"
                >
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded border border-white/10 bg-dojo-black/50">
                    {item.imageUrl ? (
                      <img className="h-full w-full object-contain" src={item.imageUrl} alt="" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">No image</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="text-sm text-gray-400 capitalize">{item.type}</p>
                        {desc && <p className="mt-1 text-sm text-gray-300">{desc}</p>}
                      </div>
                      <button
                        type="button"
                        className="shrink-0 text-sm text-dojo-crimson underline hover:text-white"
                        onClick={() => removeFromCart(item.id, item.type)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        Qty
                        <input
                          className="w-20 rounded bg-dojo-ink p-2"
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, item.type, Number(e.target.value))}
                        />
                      </label>
                      <p className="text-sm text-gray-400">
                        ${Number(item.price).toFixed(2)} each
                      </p>
                      <p className="ml-auto font-semibold text-white">${lineTotal(item).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="lg:sticky lg:top-24">
            <div className="rounded border border-white/20 bg-dojo-ink/80 p-6 shadow-lg">
              <h2 className="font-serif text-xl font-semibold">Order summary</h2>
              <div className="mt-4 space-y-2 border-b border-white/10 pb-4 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500">Taxes and shipping calculated at checkout.</p>
              </div>
              <p className="mt-4 flex justify-between text-lg font-bold text-white">
                <span>Total</span>
                <span>${subtotal.toFixed(2)}</span>
              </p>
              {isAuthenticated ? (
                <Link
                  className="mt-6 block w-full rounded bg-dojo-red py-3 text-center text-base font-semibold transition hover:bg-red-700"
                  to="/checkout"
                >
                  Checkout
                </Link>
              ) : (
                <Link
                  className="mt-6 block w-full rounded bg-dojo-red py-3 text-center text-base font-semibold transition hover:bg-red-700"
                  to="/login"
                  state={{ from: '/checkout' }}
                >
                  Sign in to checkout
                </Link>
              )}
              <Link className="mt-3 block text-center text-sm text-dojo-crimson underline hover:text-white" to="/shop">
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [billing, setBilling] = useState({ fullName: '', email: '', phone: '' })
  const [paymentMethod, setPaymentMethod] = useState('paypal')
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' })
  const [error, setError] = useState('')

  async function submit() {
    setError('')
    try {
      const fullName = billing.fullName.trim()
      const email = billing.email.trim()
      const phone = billing.phone.trim()
      if (fullName.length < 2) throw new Error('Please enter your full name.')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email address.')
      if (countDigits(phone) < 7) throw new Error('Please enter a phone number with at least 7 digits.')

      if (paymentMethod === 'card' && !/^4\d{15}$/.test(card.number.replace(/\s/g, ''))) {
        throw new Error('Use a test Visa number starting with 4 and 16 digits (e.g. 4111111111111111).')
      }
      if (paymentMethod === 'card' && !/^\d{2}\/\d{2}$/.test(card.expiry.trim())) {
        throw new Error('Enter expiration in XX/XX format.')
      }
      if (paymentMethod === 'card' && !/^\d{3}$/.test(card.cvv.trim())) {
        throw new Error('CVV must be exactly 3 digits.')
      }

      const payloadItems = sanitizeOrderItems(items)
      const order = await apiFetch('/orders', {
        method: 'POST',
        token,
        body: JSON.stringify({
          items: payloadItems,
          billing: { fullName, email, phone },
          paymentMethod,
          paymentPayload:
            paymentMethod === 'card'
              ? { ...card, number: `****${String(card.number).replace(/\s/g, '').slice(-4)}` }
              : { paymentId: `PAY-${Date.now()}`, payerId: `PAYER-${Date.now()}` },
        }),
      })
      clearCart()
      const q = new URLSearchParams({
        order: order.orderNumber,
        ref: order.paymentReference,
      })
      navigate(`/order-confirmation?${q.toString()}`, {
        state: {
          order: {
            ...order,
            subtotal: order.subtotal ?? subtotal,
            paymentMethod,
            billingEmail: email,
          },
        },
      })
    } catch (err) {
      setError(err.message)
    }
  }

  if (!items.length) {
    return (
      <section className="space-y-3">
        <h1 className="font-serif text-3xl">Checkout</h1>
        <p className="text-gray-300">Your cart is empty.</p>
        <Link className="inline-block rounded bg-dojo-red px-4 py-2" to="/shop">
          Continue shopping
        </Link>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <h1 className="font-serif text-3xl">Checkout</h1>
      <input
        className="w-full rounded bg-dojo-ink p-2"
        placeholder="Full name"
        value={billing.fullName}
        onChange={(e) => setBilling((b) => ({ ...b, fullName: e.target.value }))}
      />
      <input
        className="w-full rounded bg-dojo-ink p-2"
        placeholder="Email"
        type="email"
        value={billing.email}
        onChange={(e) => setBilling((b) => ({ ...b, email: e.target.value }))}
      />
      <input
        className="w-full rounded bg-dojo-ink p-2"
        placeholder="Phone (at least 7 digits)"
        value={billing.phone}
        onChange={(e) => setBilling((b) => ({ ...b, phone: e.target.value }))}
      />
      <p>Order total: ${subtotal.toFixed(2)}</p>
      <div className="flex flex-wrap gap-4">
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="paymentMethod"
            checked={paymentMethod === 'paypal'}
            onChange={() => setPaymentMethod('paypal')}
          />
          PayPal (simulated)
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="paymentMethod"
            checked={paymentMethod === 'card'}
            onChange={() => setPaymentMethod('card')}
          />
          Mock Credit Card
        </label>
      </div>
      {paymentMethod === 'card' && (
        <div className="space-y-2">
          <input
            className="w-full rounded bg-dojo-ink p-2"
            placeholder="Card number (test: 4111111111111111)"
            value={card.number}
            maxLength={19}
            onChange={(e) => setCard((c) => ({ ...c, number: e.target.value.replace(/[^\d\s]/g, '') }))}
          />
          <input
            className="w-full rounded bg-dojo-ink p-2"
            placeholder="XX/XX"
            value={card.expiry}
            maxLength={5}
            onChange={(e) => setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
          />
          <input
            className="w-full rounded bg-dojo-ink p-2"
            placeholder="XXX"
            value={card.cvv}
            maxLength={3}
            onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '') }))}
          />
          <input
            className="w-full rounded bg-dojo-ink p-2"
            placeholder="Name on card"
            value={card.name}
            onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
          />
        </div>
      )}
      {paymentMethod === 'paypal' && (
        <p className="text-sm text-gray-300">Simulated sandbox redirect flow applies when you place order.</p>
      )}
      {error && <p className="text-dojo-crimson">{error}</p>}
      <button className="rounded bg-dojo-red px-4 py-2" type="button" onClick={submit}>
        Place Order
      </button>
    </section>
  )
}

function OrderConfirmationPage() {
  const location = useLocation()
  const query = useMemo(() => new URLSearchParams(window.location.search), [])
  const order = location.state?.order
  const orderNumber = order?.orderNumber ?? query.get('order')
  const paymentRef = order?.paymentReference ?? query.get('ref')
  const subtotal = order?.subtotal
  const method = order?.paymentMethod
  const email = order?.billingEmail

  useEffect(() => {
    document.title = `Thank you | Karate Skillz Dojo`
  }, [])

  return (
    <section className="space-y-4">
      <h1 className="font-serif text-3xl">Thank you</h1>
      <p className="text-lg text-gray-200">Your order was placed successfully.</p>
      <div className="rounded border border-white/20 bg-dojo-ink p-4 text-sm text-gray-200">
        <p>
          <span className="text-gray-400">Order number:</span> {orderNumber || '—'}
        </p>
        <p>
          <span className="text-gray-400">Transaction / payment reference:</span> {paymentRef || '—'}
        </p>
        {subtotal != null && (
          <p>
            <span className="text-gray-400">Order total:</span> ${Number(subtotal).toFixed(2)}
          </p>
        )}
        {method && (
          <p>
            <span className="text-gray-400">Payment method:</span> {method === 'paypal' ? 'PayPal (simulated)' : 'Card (mock)'}
          </p>
        )}
        {email && (
          <p>
            <span className="text-gray-400">Confirmation sent to:</span> {email}
          </p>
        )}
      </div>
      <p className="text-gray-300">
        A confirmation email has been sent with these details. Keep your order number and payment reference for your records.
      </p>
      <Link className="inline-block rounded bg-dojo-red px-4 py-2" to="/shop">
        Continue shopping
      </Link>
    </section>
  )
}

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    try {
      await login(email.trim(), password)
      navigate(location.state?.from || '/account')
    } catch (err) {
      setError(err.message)
    }
  }
  return (
    <form className="space-y-3" onSubmit={submit}>
      <h1 className="font-serif text-3xl">Login</h1>
      {location.state?.from === '/checkout' && (
        <p className="text-sm text-gray-400">Sign in to continue to checkout. Your cart is saved in this browser.</p>
      )}
      <input className="w-full rounded bg-dojo-ink p-2" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full rounded bg-dojo-ink p-2" type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-dojo-crimson">{error}</p>}
      <button className="rounded bg-dojo-red px-4 py-2" type="submit">Login</button>
      <div className="space-x-3 text-sm"><Link to="/register">Register</Link><Link to="/forgot-password">Forgot Password</Link></div>
    </form>
  )
}

function RegisterPage() {
  const { register } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [registered, setRegistered] = useState(false)
  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      await register(form)
      setMessage('Registered. Thank you!')
      setRegistered(true)
    } catch (err) {
      setError(err.message || 'Registration failed')
    }
  }
  return (
    <form className="space-y-3" onSubmit={submit}>
      <h1 className="font-serif text-3xl">Register</h1>
      {['firstName', 'lastName', 'email', 'password'].map((field) => (
        <input key={field} className="w-full rounded bg-dojo-ink p-2" type={field === 'password' ? 'password' : 'text'} placeholder={field} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} />
      ))}
      {error && <p className="text-dojo-crimson">{error}</p>}
      <button className="rounded bg-dojo-red px-4 py-2" type="submit">Create Account</button>
      {message && <p className="text-green-400">{message}</p>}
      {registered && (
        <Link className="inline-block rounded border border-white/30 px-4 py-2 text-center hover:bg-white/10" to="/">
          Return to home
        </Link>
      )}
    </form>
  )
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  async function submit(event) {
    event.preventDefault()
    const data = await apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
    setMessage(data.message)
  }
  return (
    <form className="space-y-3" onSubmit={submit}>
      <h1 className="font-serif text-3xl">Forgot Password</h1>
      <input className="w-full rounded bg-dojo-ink p-2" placeholder="Email address" onChange={(e) => setEmail(e.target.value)} />
      <p className="text-sm text-gray-400">Enter the email address used on your account.</p>
      <button className="rounded bg-dojo-red px-4 py-2" type="submit">Send reset link</button>
      <p>{message}</p>
    </form>
  )
}

function ResetPasswordPage() {
  const query = new URLSearchParams(window.location.search)
  const token = query.get('token') || ''
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  async function submit(event) {
    event.preventDefault()
    const data = await apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) })
    setMessage(data.message)
  }
  return <form className="space-y-3" onSubmit={submit}><h1 className="font-serif text-3xl">Reset Password</h1><input className="w-full rounded bg-dojo-ink p-2" type="password" onChange={(e) => setPassword(e.target.value)} /><button className="rounded bg-dojo-red px-4 py-2" type="submit">Reset</button><p>{message}</p></form>
}

function AccountPage() {
  const { user, token, refreshMe } = useAuth()
  const [profile, setProfile] = useState(user?.profile || { firstName: '', lastName: '', phone: '' })
  const [message, setMessage] = useState('')
  async function save() {
    const data = await apiFetch('/users/me', { method: 'PATCH', token, body: JSON.stringify(profile) })
    setMessage(data.message)
    refreshMe()
  }
  return (
    <section className="space-y-2">
      <h1 className="font-serif text-3xl">Customer Account</h1>
      <p>{user?.email}</p>
      {['firstName', 'lastName', 'phone'].map((field) => <input key={field} className="w-full rounded bg-dojo-ink p-2" value={profile[field] || ''} onChange={(e) => setProfile((p) => ({ ...p, [field]: e.target.value }))} />)}
      <button className="rounded bg-dojo-red px-4 py-2" onClick={save}>Save profile</button>
      <Link className="block underline" to="/account/orders">View order history</Link>
      <p>{message}</p>
    </section>
  )
}

function OrderHistoryPage() {
  const { token } = useAuth()
  const [orders, setOrders] = useState([])
  useEffect(() => { apiFetch('/orders', { token }).then(setOrders).catch(() => {}) }, [token])
  return <section><h1 className="font-serif text-3xl">Customer Order History</h1>{orders.map((order) => <p key={order.id}>{order.orderNumber} - {order.status}</p>)}</section>
}

function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [phoneDigits, setPhoneDigits] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    setError('')
    const email = form.email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (phoneDigits.length !== 10) {
      setError('Please enter phone number in (XXX) XXX-XXXX format.')
      return
    }
    const data = await apiFetch('/contact', { method: 'POST', body: JSON.stringify({ ...form, email }) })
    setStatus(data.message)
  }
  return (
    <form className="space-y-4" onSubmit={submit}>
      <h1 className="font-serif text-3xl">Contact</h1>
      <p className="text-sm text-gray-300">
        Please provide your contact information and reason for inquiry. Include confirmation numbers or other trackable details in the message when available.
        The more relevant non-confidential information you share, the faster your request can be routed to the right person or department.
      </p>
      <input className="w-full rounded bg-dojo-ink p-2" placeholder="Name" onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      <input className="w-full rounded bg-dojo-ink p-2" placeholder="Email" onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
      <input
        className="w-full rounded bg-dojo-ink p-2"
        placeholder="Phone (XXX) XXX-XXXX"
        value={formatPhoneDigits(phoneDigits)}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
          setPhoneDigits(digits)
          setForm((f) => ({ ...f, phone: digits }))
        }}
      />
      <textarea className="w-full rounded bg-dojo-ink p-2" placeholder="Message" onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
      <button className="rounded bg-dojo-red px-4 py-2" type="submit">Send</button>
      {error && <p className="text-dojo-crimson">{error}</p>}
      {status && (
        <div className="rounded border-2 border-green-400/70 bg-green-900/25 p-4 shadow-md">
          <p className="text-lg font-bold text-green-300">Message sent successfully.</p>
          <p className="mt-1 text-sm text-green-200">{status}</p>
        </div>
      )}
    </form>
  )
}

function formatResolutionMs(ms) {
  if (ms == null) return 'Open'
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d ${h % 24}h`
  if (h > 0) return `${h}h ${m % 60}m`
  if (m > 0) return `${m}m ${s % 60}s`
  return `${s}s`
}

function HelpDeskPage() {
  const { token } = useAuth()
  const [tickets, setTickets] = useState([])
  const [form, setForm] = useState({ subject: '', description: '', category: 'general' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const list = await apiFetch('/tickets', { token })
    setTickets(Array.isArray(list) ? list : [])
  }

  useEffect(() => {
    load().catch(() => {})
  }, [token])

  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      await apiFetch('/tickets', {
        method: 'POST',
        token,
        body: JSON.stringify({
          subject: form.subject,
          description: form.description,
          category: form.category,
        }),
      })
      setMessage('Ticket submitted successfully.')
      setForm({ subject: '', description: '', category: 'general' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    document.title = 'Help Desk | Karate Skillz Dojo'
  }, [])

  return (
    <section className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl">Help Desk</h1>
        <p className="mt-2 text-gray-300">Submit a support request and track status and resolution time.</p>
      </div>
      <form className="space-y-3 rounded border border-white/20 bg-dojo-ink p-4" onSubmit={submit}>
        <h2 className="text-lg font-semibold">New ticket</h2>
        <input
          className="w-full rounded bg-dojo-black p-2"
          placeholder="Subject"
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          required
        />
        <textarea
          className="w-full rounded bg-dojo-black p-2"
          placeholder="Describe your issue (min 10 characters)"
          rows={4}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          required
        />
        <label className="block text-sm text-gray-400">
          Category
          <select
            className="mt-1 w-full rounded bg-dojo-black p-2"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            <option value="general">General</option>
            <option value="billing">Billing</option>
            <option value="account">Account</option>
            <option value="order">Order</option>
          </select>
        </label>
        {error && <p className="text-dojo-crimson">{error}</p>}
        {message && <p className="text-green-400">{message}</p>}
        <button className="rounded bg-dojo-red px-4 py-2" type="submit">Submit ticket</button>
      </form>
      <div>
        <h2 className="mb-3 text-lg font-semibold">Your tickets</h2>
        {tickets.length === 0 ? (
          <p className="text-gray-400">No tickets yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="p-2">ID</th>
                  <th className="p-2">Subject</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Created</th>
                  <th className="p-2">Resolution time</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-white/10">
                    <td className="p-2 font-mono text-xs">{t.id}</td>
                    <td className="p-2">{t.subject}</td>
                    <td className="p-2 capitalize">{t.status.replace('_', ' ')}</td>
                    <td className="p-2 text-gray-400">{new Date(t.createdAt).toLocaleString()}</td>
                    <td className="p-2">{formatResolutionMs(t.resolutionTimeMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

function AdminTicketsPage() {
  const { token } = useAuth()
  const [tickets, setTickets] = useState([])
  const [filter, setFilter] = useState('all')

  async function load() {
    const list = await apiFetch('/tickets', { token })
    setTickets(Array.isArray(list) ? list : [])
  }

  useEffect(() => {
    load().catch(() => {})
  }, [token])

  async function updateStatus(id, status) {
    await apiFetch(`/tickets/${id}`, { method: 'PATCH', token, body: JSON.stringify({ status }) })
    await load()
  }

  useEffect(() => {
    document.title = 'Admin Tickets | Karate Skillz Dojo'
  }, [])

  const filtered =
    filter === 'all' ? tickets : tickets.filter((t) => t.status === filter)

  return (
    <section className="space-y-4">
      <h1 className="font-serif text-3xl">Support tickets</h1>
      <p className="text-sm text-gray-400">Manage customer requests and update status to track resolution.</p>
      <div className="flex flex-wrap gap-2">
        {['all', 'open', 'in_progress', 'resolved', 'closed'].map((f) => (
          <button
            key={f}
            type="button"
            className={`rounded px-3 py-1 text-sm ${filter === f ? 'bg-dojo-red' : 'bg-dojo-ink'}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/20">
              <th className="p-2">ID</th>
              <th className="p-2">User</th>
              <th className="p-2">Subject</th>
              <th className="p-2">Status</th>
              <th className="p-2">Resolution time</th>
              <th className="p-2">Update</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-white/10">
                <td className="p-2 font-mono text-xs">{t.id}</td>
                <td className="p-2 font-mono text-xs">{t.userId}</td>
                <td className="p-2">{t.subject}</td>
                <td className="p-2 capitalize">{t.status.replace('_', ' ')}</td>
                <td className="p-2">{formatResolutionMs(t.resolutionTimeMs)}</td>
                <td className="p-2">
                  <select
                    className="rounded bg-dojo-ink p-1 text-xs"
                    value={t.status}
                    onChange={(e) => updateStatus(t.id, e.target.value)}
                  >
                    <option value="open">open</option>
                    <option value="in_progress">in progress</option>
                    <option value="resolved">resolved</option>
                    <option value="closed">closed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <p className="text-gray-400">No tickets in this filter.</p>}
    </section>
  )
}

function AdminPage({ endpoint, title }) {
  const { token } = useAuth()
  const [rows, setRows] = useState([])
  useEffect(() => { apiFetch(endpoint, { token }).then(setRows).catch(() => {}) }, [endpoint, token])
  return <section><h1 className="font-serif text-3xl">{title}</h1><pre className="overflow-auto rounded bg-dojo-ink p-3 text-xs">{JSON.stringify(rows, null, 2)}</pre></section>
}

const PRODUCTS_PAGE_SECTIONS = [
  {
    id: '1',
    title: 'Gi — Traditional karate uniform',
    body: (
      <>
        <p className="mt-2 text-gray-300">
          Lightweight cotton-poly blend jacket and pants with reinforced stitching for stances and striking. Includes white belt; colored belts available separately.
          Ideal for class, grading, and light competition. Machine wash cold; air dry to preserve fit.
        </p>
        <p className="mt-2 text-sm text-gray-400">Shop price from catalog · Sizes: child through adult XL</p>
      </>
    ),
    shopTo: '/shop/products/1',
  },
  {
    id: '2',
    title: 'Combat Gear — Sparring protection',
    body: (
      <>
        <p className="mt-2 text-gray-300">
          Mouthguard-compatible headgear, chest guard, shin guards, and gloves designed for controlled kumite. Ventilated padding and adjustable straps for a secure fit during drills and sparring rounds.
        </p>
        <p className="mt-2 text-sm text-gray-400">WFT-approved style options · Youth and adult kits</p>
      </>
    ),
    shopTo: '/shop/products/2',
  },
  {
    id: '3',
    title: 'Flaming Knucks OF DOOM™ — Training gloves',
    body: (
      <>
        <p className="mt-2 text-gray-300">
          Premium padded gloves for bag work and partner drills (not for full-contact sparring without approved headgear). Wrist wrap support and breathable palm mesh.
          Trademark name is for fun; training safety and respect for partners always come first.
        </p>
        <p className="mt-2 text-sm text-gray-400">Sizes S–XL · Pair</p>
      </>
    ),
    shopTo: '/shop/products/3',
  },
]

function ProductsPage() {
  const { products } = useCatalog()
  useEffect(() => {
    document.title = 'Products | Karate Skillz Dojo'
  }, [])
  const byId = useMemo(() => {
    const m = {}
    for (const p of products) m[String(p.id)] = p
    return m
  }, [products])

  return (
    <section className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl">Products</h1>
        <p className="mt-2 text-gray-300">
          Official training gear and equipment curated for kata, kumite, and everyday dojo practice. Browse the shop to add items to your cart.
        </p>
      </div>
      <div className="space-y-8">
        {PRODUCTS_PAGE_SECTIONS.map((section) => {
          const item = byId[section.id]
          return (
            <article
              key={section.id}
              className="grid gap-6 rounded border border-white/20 bg-dojo-ink p-5 md:grid-cols-[minmax(0,280px)_1fr] md:items-start"
            >
              <div className="mx-auto mb-3 aspect-square w-full max-w-[280px] overflow-hidden rounded border border-white/10 bg-dojo-black/40 md:mx-0 md:mb-0">
                {item?.imageUrl ? (
                  <img
                    className="h-full w-full object-contain"
                    src={item.imageUrl}
                    alt={item.name || section.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full min-h-[200px] items-center justify-center px-2 text-center text-sm text-gray-500">
                    Loading catalog…
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-serif text-2xl">{section.title}</h2>
                {section.body}
                <Link className="mt-3 inline-block text-dojo-crimson underline" to={section.shopTo}>
                  View in shop
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

const CLASSES_PAGE_SECTIONS = [
  {
    id: '4',
    title: 'Private lessons',
    body: (
      <>
        <p className="mt-2 text-gray-300">
          One-on-one sessions focused on your goals: kata refinement, tournament prep, fitness, or belt syllabus. Schedule preferred date and time at checkout when you add this service to your cart.
        </p>
        <ul className="mt-2 list-inside list-disc text-sm text-gray-400">
          <li>55-minute blocks · Instructor match by style and availability</li>
          <li>Great for accelerated progress or catching up after time away</li>
        </ul>
      </>
    ),
    shopTo: '/shop/services/4',
    linkLabel: 'Book via shop',
  },
  {
    id: '5',
    title: 'Group sessions',
    body: (
      <>
        <p className="mt-2 text-gray-300">
          Train with peers in structured classes: basics, combinations, and partner work. Choose a session tier (beginner evening, intermediate weekend, or advanced sparring camp) when you add to cart.
        </p>
        <ul className="mt-2 list-inside list-disc text-sm text-gray-400">
          <li>Consistent curriculum aligned with dojo values</li>
          <li>Opportunities for leadership and teamwork</li>
        </ul>
      </>
    ),
    shopTo: '/shop/services/5',
    linkLabel: 'Book via shop',
  },
  {
    id: '6',
    title: 'Lifetime membership',
    body: (
      <>
        <p className="mt-2 text-gray-300">
          Long-term access to facility hours, group classes, and member events (subject to dojo rules and conduct). Requires acknowledgment of membership terms at checkout.
        </p>
        <ul className="mt-2 list-inside list-disc text-sm text-gray-400">
          <li>Best value for families and committed students</li>
          <li>Includes priority registration for seminars when offered</li>
        </ul>
      </>
    ),
    shopTo: '/shop/services/6',
    linkLabel: 'View in shop',
  },
]

function ClassesServicesPage() {
  const { services } = useCatalog()
  useEffect(() => {
    document.title = 'Classes / Services | Karate Skillz Dojo'
  }, [])
  const byId = useMemo(() => {
    const m = {}
    for (const s of services) m[String(s.id)] = s
    return m
  }, [services])

  return (
    <section className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl">Classes &amp; Services</h1>
        <p className="mt-2 text-gray-300">
          From private coaching to group energy and long-term membership, we help every student progress with clear curriculum and supportive instructors.
        </p>
      </div>
      <div className="space-y-8">
        {CLASSES_PAGE_SECTIONS.map((section) => {
          const item = byId[section.id]
          return (
            <article
              key={section.id}
              className="grid gap-6 rounded border border-white/20 bg-dojo-ink p-5 md:grid-cols-[minmax(0,280px)_1fr] md:items-start"
            >
              <div className="mx-auto mb-3 aspect-square w-full max-w-[280px] overflow-hidden rounded border border-white/10 bg-dojo-black/40 md:mx-0 md:mb-0">
                {item?.imageUrl ? (
                  <img
                    className="h-full w-full object-contain"
                    src={item.imageUrl}
                    alt={item.name || section.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full min-h-[200px] items-center justify-center px-2 text-center text-sm text-gray-500">
                    Loading catalog…
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-serif text-2xl">{section.title}</h2>
                {section.body}
                <Link className="mt-3 inline-block text-dojo-crimson underline" to={section.shopTo}>
                  {section.linkLabel}
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

const FAQ_ITEMS = [
  { q: 'What ages do you accept?', a: 'We welcome youth and adults. Minors need a parent or guardian to create the account and approve membership or class purchases.' },
  { q: 'How do I choose the right gi size?', a: 'Use height and weight on our size chart at checkout notes, or ask staff after class. When in doubt, size up for growing students.' },
  { q: 'Can I try a group class before committing?', a: 'Contact us for guest pass options where available. Group session purchases in the shop can be scheduled after you complete checkout.' },
  { q: 'What payment methods does the site accept?', a: 'Checkout supports simulated PayPal and a mock Visa card for demonstrations (e.g. 4111111111111111). Real payment integration can be added for production.' },
  { q: 'How do I track my order?', a: 'After placing an order, save your order number and payment reference from the confirmation screen. Signed-in customers can also check order history under Account.' },
  { q: 'Do you ship equipment internationally?', a: 'Shipping zones and rates are configured per deployment. Use the contact form for international orders so we can quote customs and delivery time.' },
  { q: 'What is your return policy for gear?', a: 'Unworn items in original packaging may be returned within 30 days with proof of purchase. Mouthguards and opened protective gear are non-returnable for hygiene reasons.' },
  { q: 'How do private lessons get scheduled?', a: 'After purchase, our team uses the preferred date and time you entered on the product detail page to confirm or propose an alternative by email.' },
  { q: 'What should I bring to my first class?', a: 'Comfortable athletic clothing, water, and a willingness to learn. If you have your own gi or gear, bring it; otherwise we can advise on rentals or purchases.' },
  { q: 'Is sparring mandatory?', a: 'No. Sparring is introduced when instructors agree you are ready and have required protective equipment. Safety and consent come first.' },
  { q: 'How do I reset my password?', a: 'Use Forgot Password on the login page. You will receive reset instructions to the email on file (simulated in this demo environment).' },
  { q: 'Who can use the Help Desk?', a: 'Signed-in students and members can open tickets for billing, account, or order questions. Admins can update ticket status from the admin area.' },
  { q: 'Are lifetime memberships transferable?', a: 'No. Memberships are tied to the registered individual and cannot be sold or transferred without written approval from dojo management.' },
  { q: 'Do you offer family discounts?', a: 'Promotions vary by season. Ask at the front desk or via contact for current family and sibling pricing.' },
  { q: 'How is my data protected?', a: 'We follow security best practices for authentication and HTTPS in production. Read the Privacy Policy for details on what we collect and why.' },
]

function FAQPage() {
  useEffect(() => {
    document.title = 'FAQ | Karate Skillz Dojo'
  }, [])
  return (
    <section className="space-y-6">
      <h1 className="font-serif text-3xl">Frequently asked questions</h1>
      <p className="text-gray-300">Answers about training, gear, orders, and your account.</p>
      <dl className="space-y-6">
        {FAQ_ITEMS.map(({ q, a }) => (
          <div key={q} className="rounded border border-white/20 bg-dojo-ink/90 p-5 shadow-md transition hover:border-dojo-crimson/60">
            <dt className="text-lg font-semibold text-white">{q}</dt>
            <dd className="mt-2 leading-relaxed text-gray-300">{a}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function NotAuthorized() {
  return <StaticPage title="Not Authorized" body="You do not have permission to access this page." />
}

function NotFoundPage() {
  return <StaticPage title="404" body="The page you requested was not found." />
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<Navigate to="/" replace />} />
        <Route path="/classes-services" element={<ClassesServicesPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/sales" element={<Navigate to="/shop" replace />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/products/:id" element={<DetailPage type="products" />} />
        <Route path="/shop/services/:id" element={<DetailPage type="services" />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/privacy" element={<StaticPage title="Privacy Policy" body="Privacy and data usage terms for Karate Skillz Dojo." />} />
        <Route path="/terms" element={<StaticPage title="Terms" body="Terms and conditions for classes, products, and memberships." />} />
        <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/account/orders" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
        <Route path="/help-desk" element={<ProtectedRoute><HelpDeskPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage endpoint="/admin/summary" title="Admin Dashboard" /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute adminOnly><AdminPage endpoint="/admin/products" title="Admin Products" /></ProtectedRoute>} />
        <Route path="/admin/services" element={<ProtectedRoute adminOnly><AdminPage endpoint="/admin/services" title="Admin Services" /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute adminOnly><AdminPage endpoint="/admin/orders" title="Admin Orders" /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminPage endpoint="/admin/users" title="Admin Users" /></ProtectedRoute>} />
        <Route path="/admin/tickets" element={<ProtectedRoute adminOnly><AdminTicketsPage /></ProtectedRoute>} />
        <Route path="/not-authorized" element={<NotAuthorized />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  )
}
