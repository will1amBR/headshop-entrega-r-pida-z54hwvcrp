import React, { useState } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  LogOut,
  ExternalLink,
  Menu,
  X,
  User,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Pedidos', path: '/admin/pedidos', icon: ShoppingBag },
    { label: 'Produtos', path: '/admin/produtos', icon: Package },
    { label: 'Categorias', path: '/admin/categorias', icon: Layers },
  ]

  const isCurrent = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col md:flex-row text-zinc-900">
      {/* Sidebar for Desktop (240px fixed dark) */}
      <aside className="hidden md:flex flex-col w-60 bg-[#0A0A0A] text-zinc-300 border-r border-zinc-800 shrink-0 select-none">
        {/* Brand */}
        <div className="h-20 px-6 border-b border-zinc-800 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-white text-black font-bold flex items-center justify-center text-sm">
              ⚡
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-white text-base leading-none">
                HEADSHOP
              </span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                Painel Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isCurrent(item.path, item.exact)
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-zinc-400'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom User & Logout */}
        <div className="p-4 border-t border-zinc-800 space-y-3">
          <div className="flex items-center gap-2.5 px-2 text-xs text-zinc-400">
            <User className="w-4 h-4 text-zinc-500" />
            <span className="truncate">{user?.name || user?.email || 'Administrador'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 sm:h-20 bg-white border-b border-zinc-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden p-2 text-zinc-700 hover:bg-zinc-100 rounded-lg"
              aria-label="Abrir menu"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="font-display font-semibold text-base sm:text-lg text-zinc-900 hidden sm:block">
              Gestão da Headshop
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-zinc-500 block">Conectado como</span>
              <span className="text-xs font-mono font-bold text-zinc-800">
                {user?.email || 'william@korenambiental.com'}
              </span>
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-zinc-300 hover:border-black text-xs gap-1.5"
            >
              <Link to="/" target="_blank" rel="noreferrer">
                <span>Ver loja</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="md:hidden bg-[#0A0A0A] text-zinc-300 px-6 py-6 border-b border-zinc-800 space-y-4 animate-fade-in">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isCurrent(item.path, item.exact)
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                      active ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
              <span className="text-xs text-zinc-500 font-mono">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-red-400 hover:underline flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
