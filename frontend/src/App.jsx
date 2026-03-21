import { useEffect, useState } from 'react'

function App() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/inventory')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch inventory')
        return res.json()
      })
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-dojo-black text-white">
      {/* Hero */}
      <header className="border-b-2 border-dojo-red bg-dojo-ink py-16 px-6 text-center">
        <h1 className="font-serif text-4xl font-bold tracking-wide md:text-5xl">
          Yin & Yang Solutions
        </h1>
        <p className="mt-3 text-gray-300">
          Enterprise karate supplies and dojo services
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {loading && (
          <p className="text-center text-gray-400">Loading inventory…</p>
        )}
        {error && (
          <p className="text-center text-dojo-crimson">Error: {error}</p>
        )}
        {!loading && !error && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className={`rounded-lg border-2 p-6 transition hover:shadow-lg ${
                  item.kind === 'product'
                    ? 'border-white/20 bg-dojo-ink'
                    : 'border-dojo-red/50 bg-dojo-ink'
                }`}
              >
                <span
                  className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                    item.kind === 'product'
                      ? 'bg-white/10 text-gray-300'
                      : 'bg-dojo-red/30 text-dojo-crimson'
                  }`}
                >
                  {item.kind}
                </span>
                <h2 className="mt-3 font-serif text-xl font-semibold">
                  {item.name}
                </h2>
                <p className="mt-2 text-sm text-gray-400">{item.description}</p>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-16 border-t border-white/10 py-8 text-center text-sm text-gray-500">
        Yin & Yang Solutions — Capstone Project
      </footer>
    </div>
  )
}

export default App
