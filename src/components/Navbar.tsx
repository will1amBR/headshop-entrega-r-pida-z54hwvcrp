import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, Settings, Menu, X, Sparkles } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/button'

export const Navbar: React.FC = () => {
  const { totalItemsCount } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const navLinks = [
    { label: 'Início', path: '/' },
    { label: 'Produtos', path: '/produtos' },
    { label: 'Sobre', path: '/#sobre' },
    { label: 'Contato', path: '/#contato' },
  ]

  const isActive = (path: string) => {
    if (path.includes('#')) return false
    return location.pathname === path
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-sm transition-all">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-lg tracking-wider group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-[#0A0A0A] leading-none">
              HEADSHOP
            </span>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-500">
              Entrega Rápida
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`text-sm font-medium transition-colors hover:text-black ${
                isActive(link.path) ? 'text-black font-semibold' : 'text-zinc-600'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Admin link */}
          <Link
            to="/admin"
            title="Painel Administrativo"
            className="p-2 text-zinc-500 hover:text-black transition-colors rounded-full hover:bg-zinc-100"
          >
            <Settings className="w-5 h-5" />
            <span className="sr-only">Painel Admin</span>
          </Link>

          {/* Cart Button */}
          <Link to="/carrinho" className="relative">
            <Button
              variant="outline"
              size="sm"
              className="relative border-zinc-300 hover:border-black hover:bg-zinc-100 font-medium gap-2 px-3 sm:px-4 h-10"
            >
              <ShoppingBag className="w-4 h-4 text-[#0A0A0A]" />
              <span className="hidden sm:inline">Carrinho</span>
              {totalItemsCount > 0 && (
                <span className="animate-pop-badge inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-[#0A0A0A] rounded-full">
                  {totalItemsCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-700 hover:text-black rounded-lg hover:bg-zinc-100"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-zinc-800 hover:text-black hover:bg-zinc-50 rounded px-2"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-sm text-zinc-600 hover:text-black py-2 px-2"
            >
              <Settings className="w-4 h-4" />
              Painel do Lojista
            </Link>
            <div className="text-xs text-zinc-400 font-mono flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Pagamento via WhatsApp
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
