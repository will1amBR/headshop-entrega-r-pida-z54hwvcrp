import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Clock, DollarSign, Package, ArrowRight, TrendingUp } from 'lucide-react'
import { Order, Product } from '@/types/ecommerce'
import { getOrders } from '@/services/orders'
import { getAllProductsAdmin } from '@/services/products'
import { formatBRL, formatDateTime } from '@/lib/formatters'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRealtime } from '@/hooks/use-realtime'

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load orders & products
  const loadData = async () => {
    try {
      const [allOrders, allProds] = await Promise.all([getOrders(), getAllProductsAdmin()])
      setOrders(allOrders)
      setProducts(allProds)
    } catch (e) {
      console.error('Erro ao carregar dados do dashboard admin', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Real-time subscription to orders and products
  useRealtime('orders', () => {
    getOrders().then(setOrders)
  })

  useRealtime('products', () => {
    getAllProductsAdmin().then(setProducts)
  })

  // Calculate Stat Cards
  const totalOrdersCount = orders.length
  const newOrdersCount = orders.filter((o) => o.status === 'novo').length
  const estimatedRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'cancelado')
      .reduce((sum, o) => sum + (o.total || 0), 0)
  }, [orders])

  const activeProductsCount = products.filter((p) => p.active).length

  // Simple Bar chart of orders in last 7 days
  const last7DaysData = useMemo(() => {
    const days: { label: string; count: number; dateStr: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayLabel = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })

      const count = orders.filter((o) => o.created && o.created.startsWith(dateStr)).length
      days.push({ label: dayLabel, count, dateStr })
    }
    return days
  }, [orders])

  const maxOrderCount = Math.max(...last7DaysData.map((d) => d.count), 1)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
            Visão Geral
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
            Painel de Controle
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs">
            <Link to="/admin/pedidos">Ver Todos os Pedidos</Link>
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Orders */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Pedidos</span>
            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-3xl text-zinc-950">
            {isLoading ? '...' : totalOrdersCount}
          </div>
          <p className="text-xs text-zinc-500">Pedidos registrados no sistema</p>
        </div>

        {/* New Orders */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pedidos Novos</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-3xl text-emerald-600">
            {isLoading ? '...' : newOrdersCount}
          </div>
          <p className="text-xs text-zinc-500">Aguardando contato ou confirmação</p>
        </div>

        {/* Estimated Revenue */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Receita Estimada</span>
            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl sm:text-3xl text-zinc-950 truncate">
            {isLoading ? '...' : formatBRL(estimatedRevenue)}
          </div>
          <p className="text-xs text-zinc-500">Total somado (exceto cancelados)</p>
        </div>

        {/* Active Products */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Produtos Ativos</span>
            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-3xl text-zinc-950">
            {isLoading ? '...' : `${activeProductsCount} / ${products.length}`}
          </div>
          <p className="text-xs text-zinc-500">Itens visíveis na vitrine</p>
        </div>
      </div>

      {/* Chart Section: Pedidos nos últimos 7 dias */}
      <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-zinc-950">
              Pedidos nos Últimos 7 Dias
            </h2>
            <p className="text-xs text-zinc-500">
              Volume de novos pedidos enviados via WhatsApp por dia.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Atualização em tempo real</span>
          </div>
        </div>

        {/* Bar chart */}
        <div className="pt-4 flex items-end gap-3 sm:gap-6 h-48 border-b border-zinc-200 pb-2">
          {last7DaysData.map((day) => {
            const heightPercent = maxOrderCount > 0 ? (day.count / maxOrderCount) * 100 : 0
            return (
              <div
                key={day.dateStr}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
              >
                <span className="text-xs font-mono font-bold text-zinc-700 group-hover:text-black">
                  {day.count}
                </span>
                <div
                  style={{ height: `${Math.max(12, heightPercent)}%` }}
                  className={`w-full max-w-[48px] rounded-t transition-all duration-300 ${
                    day.count > 0 ? 'bg-[#0A0A0A] group-hover:bg-zinc-700' : 'bg-zinc-200'
                  }`}
                />
                <span className="text-[11px] font-mono text-zinc-500 capitalize">{day.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-zinc-950">
            Últimos Pedidos Recebidos
          </h2>
          <Link
            to="/admin/pedidos"
            className="text-xs font-semibold text-zinc-700 hover:text-black flex items-center gap-1"
          >
            Ver todos ({orders.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="text-xs text-zinc-500 py-6 text-center">Nenhum pedido registrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 text-zinc-600 font-mono uppercase border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Região</th>
                  <th className="py-3 px-4">Itens</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-zinc-500 whitespace-nowrap">
                      {formatDateTime(order.created)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-900">{order.customer_name}</td>
                    <td className="py-3 px-4 text-zinc-600">{order.region}</td>
                    <td className="py-3 px-4 font-mono text-zinc-600">
                      {order.items?.length || 0} un.
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-zinc-950">
                      {formatBRL(order.total)}
                    </td>
                    <td className="py-3 px-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] px-2.5"
                      >
                        <Link to={`/admin/pedidos?id=${order.id}`}>Ver Detalhes</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export function OrderStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'novo':
      return (
        <Badge className="bg-blue-600 text-white hover:bg-blue-600 text-[10px] uppercase font-mono font-bold">
          Novo
        </Badge>
      )
    case 'em preparo':
      return (
        <Badge className="bg-amber-600 text-white hover:bg-amber-600 text-[10px] uppercase font-mono font-bold">
          Em Preparo
        </Badge>
      )
    case 'enviado':
      return (
        <Badge className="bg-purple-600 text-white hover:bg-purple-600 text-[10px] uppercase font-mono font-bold">
          Enviado
        </Badge>
      )
    case 'entregue':
      return (
        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-[10px] uppercase font-mono font-bold">
          Entregue
        </Badge>
      )
    case 'cancelado':
      return (
        <Badge variant="destructive" className="text-[10px] uppercase font-mono font-bold">
          Cancelado
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}
