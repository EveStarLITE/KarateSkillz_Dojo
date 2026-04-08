import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

const navItemClass = ({ isActive }) =>
  `text-sm transition-colors ${isActive ? 'text-dojo-crimson' : 'text-white hover:text-dojo-crimson'}`

export default function Layout({ children }) {
  const { user, isAdmin, logout } = useAuth()
  const { items } = useCart()
  const cartCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

  return (
    <div className="min-h-screen bg-dojo-black text-white">
      <header className="border-b border-dojo-red/40 bg-dojo-ink">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link className="font-serif text-2xl font-bold" to="/">
            Karate Skillz Dojo
          </Link>
          <nav className="flex flex-wrap items-center gap-4">
            <NavLink className={navItemClass} to="/about">About</NavLink>

            <div className="group relative">
              <NavLink className={navItemClass} to="/shop">Shop</NavLink>
              <div className="pointer-events-none absolute left-0 top-full z-10 w-64 pt-2 opacity-0 transition-opacity duration-150 ease-out delay-[180ms] group-hover:pointer-events-auto group-hover:opacity-100 group-hover:delay-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:delay-0">
                <div className="rounded border border-white/15 bg-dojo-ink p-2 shadow-lg">
                  <NavLink
                    className="block rounded border border-white/10 bg-dojo-black/30 p-3 text-sm text-gray-200 hover:border-dojo-crimson/60 hover:bg-dojo-black/50 hover:text-white"
                    to="/classes-services"
                  >
                    <div className="font-semibold">Classes / Services</div>
                    <div className="mt-1 text-xs text-gray-400">Private lessons, group sessions, memberships</div>
                  </NavLink>
                  <NavLink
                    className="mt-2 block rounded border border-white/10 bg-dojo-black/30 p-3 text-sm text-gray-200 hover:border-dojo-crimson/60 hover:bg-dojo-black/50 hover:text-white"
                    to="/products"
                  >
                    <div className="font-semibold">Products</div>
                    <div className="mt-1 text-xs text-gray-400">Uniforms, sparring gear, training gloves</div>
                  </NavLink>
                </div>
              </div>
            </div>

            <NavLink className={navItemClass} to="/faq">FAQ</NavLink>

            <NavLink className={navItemClass} to="/cart">Cart ({cartCount})</NavLink>
            <NavLink className={navItemClass} to="/contact">Contact</NavLink>
            {user && <NavLink className={navItemClass} to="/help-desk">Help Desk</NavLink>}
            {user ? (
              <details className="relative">
                <summary className="cursor-pointer list-none text-sm text-gray-200 hover:text-white">
                  {user.email}
                </summary>
                <div className="absolute right-0 z-10 mt-2 w-56 rounded border border-white/15 bg-dojo-ink p-2 shadow-lg">
                  <NavLink className={navItemClass} to="/account">Account</NavLink>
                  {isAdmin && (
                    <>
                      <NavLink className={navItemClass} to="/admin">Admin</NavLink>
                      <NavLink className={navItemClass} to="/admin/tickets">Tickets</NavLink>
                    </>
                  )}
                  <div className="my-2 border-t border-white/10" />
                  <button className="w-full text-left text-sm text-gray-200 hover:text-white" onClick={logout}>
                    Logout
                  </button>
                </div>
              </details>
            ) : (
              <NavLink className={navItemClass} to="/login">Login</NavLink>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-gray-400">
        Karate Skillz Dojo - Enterprise-style capstone web application.
      </footer>
    </div>
  )
}
