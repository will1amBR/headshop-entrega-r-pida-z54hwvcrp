import React, { useState } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  KanbanSquare,
  ShoppingBag,
  Truck,
  LineChart,
  Users,
  Megaphone,
  Package,
  Layers,
  LogOut,
  ExternalLink,
  Menu,
  X,
  User,
  CreditCard,
  Boxes,
  RotateCcw,
  Building2,
  Sliders,
  DollarSign,
  TrendingDown,
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

  // Grupos reorganizados conforme requisitos:
  // Vendas, Financeiro, Operação, Inteligência, Catálogo, Sistema
  const navGroups = [
    {
      group: 'Geral',
      items: [{ label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true }],
    },
    {
      group: 'Vendas',
      items: [
        { label: 'Pedidos (Lista)', path: '/admin/pedidos', icon: ShoppingBag },
        { label: 'Kanban Pedidos', path: '/admin/kanban', icon: KanbanSquare },
      ],
    },
    {
      group: 'Financeiro',
      items: [{ label: 'Financeiro & Cobranças', path: '/admin/financeiro', icon: DollarSign }],
    },
    {
      group: 'Operação & Estoque',
      items: [
        { label: 'Expedição & NF-e', path: '/admin/expedicao', icon: Truck },
        { label: 'Gestão de Estoque', path: '/admin/estoque', icon: Boxes },
        { label: 'Recompras Automáticas', path: '/admin/recompras', icon: RotateCcw },
        { label: 'Fornecedores', path: '/admin/fornecedores', icon: Building2 },
      ],
    },
    {
      group: 'Inteligência',
      items: [
        { label: 'Área Comercial', path: '/admin/comercial', icon: LineChart },
        { label: 'CRM Clientes', path: '/admin/crm', icon: Users },
        { label: 'Marketing & Campanhas', path: '/admin/marketing', icon: Megaphone },
      ],
    },
    {
      group: 'Catálogo',
      items: [
        { label: 'Produtos', path: '/admin/produtos', icon: Package },
        { label: 'Categorias', path: '/admin/categorias', icon: Layers },
      ],
    },
    {
      group: 'Sistema',
      items: [{ label: 'Integrações (Bling & MP)', path: '/admin/integracoes', icon: Sliders }],
    },
  ]

  const isCurrent = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-zinc-50/70 flex flex-col md:flex-row text-zinc-900 font-sans antialiased">
      {/* Sidebar for Desktop (260px fixed dark) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0A0A0A] text-zinc-300 border-r border-zinc-800 shrink-0 select-none shadow-xl">
        {/* Brand */}
        <div className="h-20 px-6 border-b border-zinc-800/80 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-white text-black font-extrabold flex items-center justify-center text-base shadow-sm group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-white text-base tracking-tight leading-none">
                HEADSHOP
              </span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Painel Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {navGroups.map((grp) => (
            <div key={grp.group} className="space-y-1">
              <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                {grp.group}
              </div>
              {grp.items.map((item) => {
                const Icon = item.icon
                const active = isCurrent(item.path, item.exact)
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? 'bg-zinc-800 text-white font-semibold shadow-inner border border-zinc-700/60'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-zinc-400'}`}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Bottom User & Logout */}
        <div className="p-4 border-t border-zinc-800/80 space-y-3 bg-zinc-950/60">
          <div className="flex items-center gap-2.5 px-2 py-1 text-xs text-zinc-300 bg-zinc-900/60 border border-zinc-800 rounded-lg">
            <User className="w-4 h-4 text-zinc-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-white">
                {user?.name || 'Administrador'}
              </div>
              <div className="truncate text-[10px] text-zinc-400 font-mono">
                {user?.email || 'william@korenambiental.com'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/30 hover:text-red-300 border border-transparent hover:border-red-900/40 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 sm:h-20 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden p-2 text-zinc-700 hover:bg-zinc-100 rounded-lg border border-zinc-200"
              aria-label="Abrir menu"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-zinc-950 tracking-tight leading-tight">
                Gestão da HeadShop
              </h2>
              <p className="text-[11px] text-zinc-500 font-mono hidden sm:block">
                Controle de Catálogo, NCMs & Pedidos via WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block pr-2">
              <span className="text-[10px] text-zinc-400 font-mono uppercase block">
                Sessão Ativa
              </span>
              <span className="text-xs font-mono font-bold text-zinc-800">
                {user?.email || 'william@korenambiental.com'}
              </span>
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-zinc-300 hover:border-black text-xs font-medium gap-1.5 h-9"
            >
              <Link to="/" target="_blank" rel="noreferrer">
                <span>Ver vitrine</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="md:hidden bg-[#0A0A0A] text-zinc-300 px-5 py-4 border-b border-zinc-800 space-y-4 max-h-[80vh] overflow-y-auto animate-fade-in">
            <nav className="space-y-4">
              {navGroups.map((grp) => (
                <div key={grp.group} className="space-y-1">
                  <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                    {grp.group}
                  </div>
                  {grp.items.map((item) => {
                    const Icon = item.icon
                    const active = isCurrent(item.path, item.exact)
                    return (
                      <Link
                        key={item.label}
                        to={item.path}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
                          active ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              ))}
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
