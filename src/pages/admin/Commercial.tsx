import React, { useEffect, useState, useMemo } from 'react'
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  RefreshCw,
} from 'lucide-react'
import { Order, Product, Category } from '@/types/ecommerce'
import { getOrders } from '@/services/orders'
import { getAllProductsAdmin } from '@/services/products'
import { getCategories } from '@/services/categories'
import { formatBRL } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type PeriodDays = 7 | 30 | 90

export default function AdminCommercial() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [period, setPeriod] = useState<PeriodDays>(30)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [allOrders, allProds, allCats] = await Promise.all([
        getOrders(),
        getAllProductsAdmin(),
        getCategories(),
      ])
      setOrders(allOrders)
      setProducts(allProds)
      setCategories(allCats)
    } catch (e) {
      console.error('Erro ao carregar métricas comerciais:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Divisão entre período atual e período anterior para comparativo
  const { currentOrders, previousOrders } = useMemo(() => {
    const now = new Date().getTime()
    const periodMs = period * 24 * 60 * 60 * 1000
    const startCurrent = now - periodMs
    const startPrevious = now - periodMs * 2

    const current: Order[] = []
    const previous: Order[] = []

    orders.forEach((o) => {
      const t = new Date(o.created).getTime()
      if (t >= startCurrent && t <= now) {
        current.push(o)
      } else if (t >= startPrevious && t < startCurrent) {
        previous.push(o)
      }
    })

    return { currentOrders: current, previousOrders: previous }
  }, [orders, period])

  // Métricas do período atual
  const currentValid = currentOrders.filter((o) => o.status !== 'cancelado')
  const previousValid = previousOrders.filter((o) => o.status !== 'cancelado')

  const currentRevenue = currentValid.reduce((sum, o) => sum + (o.total || 0), 0)
  const previousRevenue = previousValid.reduce((sum, o) => sum + (o.total || 0), 0)
  const revenueGrowth =
    previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : currentRevenue > 0
        ? 100
        : 0

  const currentTicket = currentValid.length > 0 ? currentRevenue / currentValid.length : 0
  const previousTicket = previousValid.length > 0 ? previousRevenue / previousValid.length : 0
  const ticketGrowth =
    previousTicket > 0 ? ((currentTicket - previousTicket) / previousTicket) * 100 : 0

  const totalOrdersCount = currentOrders.length
  const completedOrdersCount = currentOrders.filter((o) => o.status === 'entregue').length

  // Pedidos por Status
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, { count: number; total: number }> = {
      novo: { count: 0, total: 0 },
      'em preparo': { count: 0, total: 0 },
      enviado: { count: 0, total: 0 },
      entregue: { count: 0, total: 0 },
      cancelado: { count: 0, total: 0 },
    }
    currentOrders.forEach((o) => {
      const s = o.status || 'novo'
      if (counts[s]) {
        counts[s].count += 1
        counts[s].total += o.total || 0
      }
    })
    return counts
  }, [currentOrders])

  // Top Produtos mais vendidos (por quantidade e por receita)
  const { topProductsByQty, topProductsByRevenue } = useMemo(() => {
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>()

    currentValid.forEach((order) => {
      order.items?.forEach((item) => {
        const key = item.name.trim()
        const existing = productMap.get(key) || { name: key, quantity: 0, revenue: 0 }
        existing.quantity += item.quantity || 1
        existing.revenue += (item.quantity || 1) * (item.unit_price || 0)
        productMap.set(key, existing)
      })
    })

    const list = Array.from(productMap.values())
    const byQty = [...list].sort((a, b) => b.quantity - a.quantity).slice(0, 5)
    const byRev = [...list].sort((a, b) => b.revenue - a.revenue).slice(0, 5)

    return { topProductsByQty: byQty, topProductsByRevenue: byRev }
  }, [currentValid])

  // Vendas por Categoria estimada mapeando nome do produto
  const categorySales = useMemo(() => {
    const catMap = new Map<string, { name: string; count: number; revenue: number }>()
    categories.forEach((cat) => {
      catMap.set(cat.id, { name: cat.name, count: 0, revenue: 0 })
    })

    currentValid.forEach((order) => {
      order.items?.forEach((item) => {
        // Encontrar produto correspondente para inferir categoria
        const prod = products.find(
          (p) => p.name.trim().toLowerCase() === item.name.trim().toLowerCase(),
        )
        const catId = prod?.category
        if (catId && catMap.has(catId)) {
          const entry = catMap.get(catId)!
          entry.count += item.quantity || 1
          entry.revenue += (item.quantity || 1) * (item.unit_price || 0)
        } else {
          // Fallback por palavra chave
          const nameLower = item.name.toLowerCase()
          let fallbackName = 'Acessórios & Outros'
          if (nameLower.includes('seda')) fallbackName = 'Sedas'
          else if (nameLower.includes('piteira') || nameLower.includes('filtro'))
            fallbackName = 'Piteiras'
          else if (nameLower.includes('dichavador') || nameLower.includes('grinder'))
            fallbackName = 'Dichavadores'
          else if (nameLower.includes('isqueiro') || nameLower.includes('maçarico'))
            fallbackName = 'Isqueiros & Maçaricos'
          else if (nameLower.includes('bong') || nameLower.includes('pipe'))
            fallbackName = 'Bongs & Pipes'

          const fbEntry = catMap.get(fallbackName) || { name: fallbackName, count: 0, revenue: 0 }
          fbEntry.count += item.quantity || 1
          fbEntry.revenue += (item.quantity || 1) * (item.unit_price || 0)
          catMap.set(fallbackName, fbEntry)
        }
      })
    })

    return Array.from(catMap.values())
      .filter((c) => c.revenue > 0 || c.count > 0)
      .sort((a, b) => b.revenue - a.revenue)
  }, [currentValid, categories, products])

  // Curva de vendas diária ao longo do período selecionado
  const salesCurve = useMemo(() => {
    // Dividir período em baldes (buckets)
    const pointsCount = period === 7 ? 7 : period === 30 ? 10 : 12
    const bucketDuration = (period * 24 * 60 * 60 * 1000) / pointsCount
    const now = new Date().getTime()
    const points: { label: string; revenue: number; orders: number }[] = []

    for (let i = pointsCount - 1; i >= 0; i--) {
      const bucketEnd = now - i * bucketDuration
      const bucketStart = bucketEnd - bucketDuration

      const bucketOrders = currentValid.filter((o) => {
        const t = new Date(o.created).getTime()
        return t >= bucketStart && t < bucketEnd
      })

      const bucketRevenue = bucketOrders.reduce((sum, o) => sum + (o.total || 0), 0)
      const d = new Date(bucketEnd)
      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

      points.push({ label, revenue: bucketRevenue, orders: bucketOrders.length })
    }

    return points
  }, [currentValid, period])

  const maxCurveRevenue = Math.max(...salesCurve.map((p) => p.revenue), 1)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-zinc-800" />
            Inteligência de Vendas
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
            Área Comercial
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Métricas de faturamento, ticket médio, curva de receita e performance por produto.
          </p>
        </div>

        {/* Filter buttons 7 / 30 / 90 dias */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-200/80 p-1 rounded-lg text-xs font-semibold">
            {([7, 30, 90] as PeriodDays[]).map((days) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  period === days
                    ? 'bg-white text-black shadow-xs font-bold'
                    : 'text-zinc-600 hover:text-black'
                }`}
              >
                Últimos {days} dias
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-zinc-300 gap-1 text-xs h-8"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 4 Primary KPI Cards with Comparisons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Receita Total */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Receita do Período
            </span>
            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-extrabold text-2xl sm:text-3xl text-zinc-950 truncate">
            {isLoading ? '...' : formatBRL(currentRevenue)}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {revenueGrowth >= 0 ? (
              <span className="text-emerald-700 font-semibold flex items-center font-mono">
                <ArrowUpRight className="w-3.5 h-3.5" />+{revenueGrowth.toFixed(1)}%
              </span>
            ) : (
              <span className="text-rose-600 font-semibold flex items-center font-mono">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {revenueGrowth.toFixed(1)}%
              </span>
            )}
            <span className="text-zinc-400">vs {period}d anteriores</span>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Ticket Médio</span>
            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-extrabold text-2xl sm:text-3xl text-zinc-950 truncate">
            {isLoading ? '...' : formatBRL(currentTicket)}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {ticketGrowth >= 0 ? (
              <span className="text-emerald-700 font-semibold flex items-center font-mono">
                <ArrowUpRight className="w-3.5 h-3.5" />+{ticketGrowth.toFixed(1)}%
              </span>
            ) : (
              <span className="text-rose-600 font-semibold flex items-center font-mono">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {ticketGrowth.toFixed(1)}%
              </span>
            )}
            <span className="text-zinc-400">por pedido ativo</span>
          </div>
        </div>

        {/* Volume de Pedidos */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Pedidos</span>
            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-extrabold text-3xl text-zinc-950">
            {isLoading ? '...' : totalOrdersCount}
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            {completedOrdersCount} pedidos já entregues
          </p>
        </div>

        {/* Taxa de Conversão / Conclusão */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Taxa de Conclusão
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-extrabold text-3xl text-emerald-600">
            {totalOrdersCount > 0
              ? `${(((totalOrdersCount - statusBreakdown.cancelado.count) / totalOrdersCount) * 100).toFixed(0)}%`
              : '100%'}
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            {statusBreakdown.cancelado.count} cancelados no período
          </p>
        </div>
      </div>

      {/* Curva de Vendas Gráfico de Barras / Distribuição Temporal */}
      <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display font-bold text-lg text-zinc-950">
              Curva de Vendas no Período ({period} Dias)
            </h2>
            <p className="text-xs text-zinc-500">
              Evolução da receita bruta faturada ao longo dos blocos de datas.
            </p>
          </div>
          <div className="text-xs font-mono font-bold text-zinc-800 bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200">
            Receita do intervalo: {formatBRL(currentRevenue)}
          </div>
        </div>

        <div className="pt-4 flex items-end gap-2 sm:gap-4 h-56 border-b border-zinc-200 pb-2">
          {salesCurve.map((point, idx) => {
            const heightPercent = maxCurveRevenue > 0 ? (point.revenue / maxCurveRevenue) * 100 : 0
            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
              >
                <span className="text-[10px] font-mono font-bold text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                  {formatBRL(point.revenue)}
                </span>
                <div
                  style={{ height: `${Math.max(8, heightPercent)}%` }}
                  className={`w-full rounded-t transition-all duration-300 ${
                    point.revenue > 0 ? 'bg-zinc-950 group-hover:bg-zinc-700' : 'bg-zinc-200'
                  }`}
                />
                <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap">
                  {point.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 2 Columns: Pedidos por Status & Vendas por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos por Status */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-zinc-950">
              Pedidos por Status no Período
            </h3>
            <span className="text-xs font-mono text-zinc-400">Total: {totalOrdersCount}</span>
          </div>

          <div className="space-y-3 pt-2">
            {(
              [
                { label: 'Novo', key: 'novo', color: 'bg-blue-600', text: 'text-blue-700' },
                {
                  label: 'Em Preparo',
                  key: 'em preparo',
                  color: 'bg-amber-600',
                  text: 'text-amber-700',
                },
                {
                  label: 'Enviado',
                  key: 'enviado',
                  color: 'bg-purple-600',
                  text: 'text-purple-700',
                },
                {
                  label: 'Entregue',
                  key: 'entregue',
                  color: 'bg-emerald-600',
                  text: 'text-emerald-700',
                },
                {
                  label: 'Cancelado',
                  key: 'cancelado',
                  color: 'bg-rose-600',
                  text: 'text-rose-700',
                },
              ] as const
            ).map((st) => {
              const data = statusBreakdown[st.key] || { count: 0, total: 0 }
              const pct = totalOrdersCount > 0 ? (data.count / totalOrdersCount) * 100 : 0
              return (
                <div key={st.key} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-800">{st.label}</span>
                    <span className="font-mono text-zinc-600">
                      {data.count} pedidos ({formatBRL(data.total)})
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full ${st.color} transition-all duration-300 rounded-full`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Vendas por Categoria */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-zinc-950">Vendas por Categoria</h3>
            <Layers className="w-4 h-4 text-zinc-400" />
          </div>

          {categorySales.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">
              Nenhuma venda computada neste intervalo.
            </p>
          ) : (
            <div className="space-y-3.5 pt-2">
              {categorySales.map((cat, idx) => {
                const pct = currentRevenue > 0 ? (cat.revenue / currentRevenue) * 100 : 0
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-900">{cat.name}</span>
                      <div className="font-mono text-zinc-600 flex items-center gap-2">
                        <span>{cat.count} un.</span>
                        <strong className="text-zinc-950 font-bold">
                          {formatBRL(cat.revenue)}
                        </strong>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max(4, pct)}%` }}
                        className="h-full bg-zinc-900 transition-all duration-300 rounded-full"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Produtos: Quantidade vs Receita */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top por Quantidade */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-zinc-950">
              Top 5 Mais Vendidos (em Volume)
            </h3>
            <Package className="w-4 h-4 text-zinc-400" />
          </div>

          {topProductsByQty.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">Nenhum produto no período.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {topProductsByQty.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-800 font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-zinc-900 truncate">{item.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="outline" className="font-mono font-bold text-xs">
                      {item.quantity} unidades
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top por Receita */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-zinc-950">
              Top 5 em Faturamento (Receita)
            </h3>
            <DollarSign className="w-4 h-4 text-zinc-400" />
          </div>

          {topProductsByRevenue.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">Nenhum produto no período.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {topProductsByRevenue.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-950 text-white font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-zinc-900 truncate">{item.name}</span>
                  </div>
                  <div className="font-mono font-extrabold text-sm text-zinc-950 shrink-0">
                    {formatBRL(item.revenue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
