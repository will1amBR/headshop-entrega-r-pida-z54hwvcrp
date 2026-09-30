import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag,
  Clock,
  DollarSign,
  Package,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  QrCode,
  Truck,
  Calendar,
  Percent,
  CheckCircle2,
  Boxes,
  MessageCircle,
  FileText,
  Sparkles,
} from 'lucide-react'
import { Order, Product, Shipment, Payment } from '@/types/ecommerce'
import { getOrders } from '@/services/orders'
import { getAllProductsAdmin } from '@/services/products'
import { getPayments } from '@/services/payments'
import { getShipments } from '@/services/shipments'
import { calculateRecompraSuggestions } from '@/services/suppliers'
import { formatBRL, formatDateTime } from '@/lib/formatters'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRealtime } from '@/hooks/use-realtime'

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [lowStockCount, setLowStockCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Load orders & products & payments & shipments
  const loadData = async () => {
    try {
      const [allOrders, allProds, allPayments, allShipments] = await Promise.all([
        getOrders(),
        getAllProductsAdmin(),
        getPayments(),
        getShipments(),
      ])
      setOrders(allOrders)
      setProducts(allProds)
      setPayments(allPayments)
      setShipments(allShipments)

      const suggestions = calculateRecompraSuggestions(allProds)
      setLowStockCount(suggestions.length)
    } catch (e) {
      console.error('Erro ao carregar dados do dashboard admin', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Inscrições em tempo real
  useRealtime('orders', () => {
    getOrders().then(setOrders)
  })
  useRealtime('products', () => {
    getAllProductsAdmin().then(setProducts)
  })
  useRealtime('shipments', () => {
    getShipments().then(setShipments)
  })
  useRealtime('payments', () => {
    getPayments().then(setPayments)
  })

  // 1. Métricas de Hoje vs. Ontem
  const metricsToday = useMemo(() => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const ordersToday = orders.filter((o) => o.created && o.created.startsWith(todayStr))
    const ordersYesterday = orders.filter((o) => o.created && o.created.startsWith(yesterdayStr))

    const revenueToday = ordersToday
      .filter((o) => o.status !== 'cancelado')
      .reduce((acc, o) => acc + (o.total || 0), 0)

    const revenueYesterday = ordersYesterday
      .filter((o) => o.status !== 'cancelado')
      .reduce((acc, o) => acc + (o.total || 0), 0)

    const revenueDiff = revenueToday - revenueYesterday
    const revenuePct =
      revenueYesterday > 0
        ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100
        : revenueToday > 0
          ? 100
          : 0

    return {
      ordersTodayCount: ordersToday.length,
      ordersYesterdayCount: ordersYesterday.length,
      revenueToday,
      revenueYesterday,
      revenueDiff,
      revenuePct,
    }
  }, [orders])

  // 2. Ticket Médio e Taxa de Conversão Estimada
  const overallMetrics = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'cancelado')
    const totalRev = validOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    const ticketMedio = validOrders.length > 0 ? totalRev / validOrders.length : 0

    // Taxa de conversão: Pedidos pagos/concluídos sobre o total de pedidos iniciados
    const concludedOrders = validOrders.filter((o) =>
      ['enviado', 'entregue'].includes(o.status),
    ).length
    const conversionRate = validOrders.length > 0 ? (concludedOrders / validOrders.length) * 100 : 0

    return {
      totalRevenue: totalRev,
      ticketMedio,
      conversionRate,
      concludedOrders,
    }
  }, [orders])

  // 3. Resumo de Expedição & Logística
  const logisticsSummary = useMemo(() => {
    const aguardandoSeparacao = orders.filter((o) => {
      if (o.status === 'cancelado' || o.status === 'entregue') return false
      const ship = shipments.find((s) => s.order === o.id)
      return (
        !ship ||
        ship.shipping_status === 'separacao' ||
        o.status === 'novo' ||
        o.status === 'em preparo'
      )
    }).length

    const emTransito = shipments.filter(
      (s) => s.shipping_status === 'enviado' || s.shipping_status === 'em_transito',
    ).length

    const devolucoesAbertas = shipments.filter(
      (s) => s.shipping_status === 'devolvido' || s.shipping_status === 'devolucao_recebida',
    ).length

    return {
      aguardandoSeparacao,
      emTransito,
      devolucoesAbertas,
    }
  }, [orders, shipments])

  // 4. Top Produtos da Semana (Baseado nos itens dos pedidos dos últimos 7 dias)
  const topProducts = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    const sevenDaysAgo = d.toISOString()

    const recentOrders = orders.filter((o) => o.created >= sevenDaysAgo && o.status !== 'cancelado')

    const productSalesMap = new Map<
      string,
      { name: string; quantity: number; totalRevenue: number }
    >()

    recentOrders.forEach((ord) => {
      ord.items?.forEach((item) => {
        const current = productSalesMap.get(item.name) || {
          name: item.name,
          quantity: 0,
          totalRevenue: 0,
        }
        current.quantity += item.quantity || 1
        current.totalRevenue += (item.quantity || 1) * (item.unit_price || 0)
        productSalesMap.set(item.name, current)
      })
    })

    return Array.from(productSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }, [orders])

  // 5. Gráfico de 7 Dias
  const last7DaysData = useMemo(() => {
    const days: { label: string; count: number; revenue: number; dateStr: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayLabel = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })

      const dayOrders = orders.filter((o) => o.created && o.created.startsWith(dateStr))
      const count = dayOrders.length
      const revenue = dayOrders
        .filter((o) => o.status !== 'cancelado')
        .reduce((sum, o) => sum + (o.total || 0), 0)

      days.push({ label: dayLabel, count, revenue, dateStr })
    }
    return days
  }, [orders])

  const maxOrderCount = Math.max(...last7DaysData.map((d) => d.count), 1)

  // 6. Produtos Próximos a Vencer Estoque / Recompras Pendentes
  const recompraSuggestionsList = useMemo(() => {
    return calculateRecompraSuggestions(products).slice(0, 4)
  }, [products])

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Visão Geral em Tempo Real
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
            Painel de Controle
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Acompanhe vendas de hoje, expedição, ticket médio, alertas de estoque e catálogo ativo.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild variant="outline" size="sm" className="border-zinc-300 text-xs">
            <Link to="/admin/financeiro">Financeiro</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-zinc-300 text-xs">
            <Link to="/admin/expedicao">Expedição & NF-e</Link>
          </Button>
          <Button asChild size="sm" className="bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs">
            <Link to="/admin/pedidos">Gerenciar Pedidos</Link>
          </Button>
        </div>
      </div>

      {/* Alerta Visual de Baixa de Estoque / Recompra Pendente */}
      {lowStockCount > 0 && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-red-950 text-sm">
                Atenção de Estoque: {lowStockCount} produto(s) abaixo do estoque mínimo!
              </h3>
              <p className="text-xs text-red-800">
                Itens com saldo crítico detectados. A recompra automática agrupada por fornecedor já
                está calculada.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold gap-1.5 shadow-sm"
            >
              <Link to="/admin/recompras">
                <RotateCcw className="w-3.5 h-3.5" />
                Gerar Recompra
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-red-300 text-red-900 bg-white hover:bg-red-100 text-xs"
            >
              <Link to="/admin/estoque">Ver no Estoque</Link>
            </Button>
          </div>
        </div>
      )}

      {/* LINHA 1 DE KPIS: Pedidos de Hoje, Receita Hoje vs Ontem, Ticket Médio, Taxa de Conversão */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Pedidos de Hoje */}
        <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pedidos de Hoje</span>
            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono font-bold text-3xl text-zinc-950">
              {isLoading ? '...' : metricsToday.ordersTodayCount}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              (ontem: {metricsToday.ordersYesterdayCount})
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">
            {metricsToday.ordersTodayCount >= metricsToday.ordersYesterdayCount
              ? '↑ Volume igual ou superior a ontem'
              : '↓ Menor que o fechamento de ontem'}
          </p>
        </div>

        {/* Receita Hoje vs Ontem */}
        <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Receita Hoje vs Ontem
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl sm:text-3xl text-zinc-950 truncate">
            {isLoading ? '...' : formatBRL(metricsToday.revenueToday)}
          </div>
          <div className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
            <span>Ontem: {formatBRL(metricsToday.revenueYesterday)}</span>
            <span
              className={`font-bold ml-1 ${
                metricsToday.revenueDiff >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {metricsToday.revenueDiff >= 0 ? '+' : ''}
              {metricsToday.revenuePct.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Ticket Médio</span>
            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl sm:text-3xl text-zinc-950 truncate">
            {isLoading ? '...' : formatBRL(overallMetrics.ticketMedio)}
          </div>
          <p className="text-[11px] text-zinc-500">Valor médio gasto por pedido válido</p>
        </div>

        {/* Taxa de Conversão / Conclusão */}
        <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Taxa de Conclusão
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-3xl text-blue-600">
            {isLoading ? '...' : `${overallMetrics.conversionRate.toFixed(1)}%`}
          </div>
          <p className="text-[11px] text-zinc-500">
            {overallMetrics.concludedOrders} pedidos despachados/entregues
          </p>
        </div>
      </div>

      {/* LINHA 2: RESUMO DE EXPEDIÇÃO & LOGÍSTICA (Aguardando Separação / Em Trânsito / Devoluções) */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-zinc-800" />
            <h2 className="font-display font-bold text-base text-zinc-950">
              Resumo Operacional de Expedição
            </h2>
          </div>
          <Link
            to="/admin/expedicao"
            className="text-xs font-semibold text-zinc-700 hover:text-black flex items-center gap-1"
          >
            Abrir Central de Fulfillment <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-900 rounded-lg">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-zinc-800 block">Aguardando Separação</span>
                <span className="text-[11px] text-zinc-500">Pedidos novos / em preparo</span>
              </div>
            </div>
            <span className="font-mono font-extrabold text-2xl text-amber-900">
              {logisticsSummary.aguardandoSeparacao}
            </span>
          </div>

          <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-900 rounded-lg">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-zinc-800 block">Em Trânsito / Enviados</span>
                <span className="text-[11px] text-zinc-500">Rastreamento ativo Correios/Loggi</span>
              </div>
            </div>
            <span className="font-mono font-extrabold text-2xl text-purple-900">
              {logisticsSummary.emTransito}
            </span>
          </div>

          <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 text-rose-900 rounded-lg">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-zinc-800 block">Devoluções Abertas</span>
                <span className="text-[11px] text-zinc-500">Logística reversa em análise</span>
              </div>
            </div>
            <span className="font-mono font-extrabold text-2xl text-rose-900">
              {logisticsSummary.devolucoesAbertas}
            </span>
          </div>
        </div>
      </div>

      {/* LINHA 3: 2 COLUNAS — GRÁFICO 7 DIAS + TOP PRODUTOS DA SEMANA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Gráfico 7 Dias (7 colunas) */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
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
              <span>Atualização real-time</span>
            </div>
          </div>

          {/* Barras */}
          <div className="pt-6 flex items-end gap-3 sm:gap-6 h-48 border-b border-zinc-200 pb-2">
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
                    className={`w-full max-w-[44px] rounded-t transition-all duration-300 ${
                      day.count > 0 ? 'bg-[#0A0A0A] group-hover:bg-zinc-700' : 'bg-zinc-200'
                    }`}
                  />
                  <span className="text-[11px] font-mono text-zinc-500 capitalize">
                    {day.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Produtos da Semana (5 colunas) */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-zinc-950">
                Top Produtos da Semana
              </h2>
              <p className="text-xs text-zinc-500">Itens com maior saída nos últimos 7 dias</p>
            </div>
            <span className="text-xs font-mono text-zinc-400">Ranking</span>
          </div>

          {topProducts.length === 0 ? (
            <p className="text-xs text-zinc-500 py-8 text-center">
              Nenhuma venda registrada nos últimos 7 dias.
            </p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 text-xs gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-zinc-200 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-zinc-900 truncate">{p.name}</span>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <span className="font-bold text-zinc-950 block">{p.quantity} un.</span>
                    <span className="text-[10px] text-zinc-500">{formatBRL(p.totalRevenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* LINHA 4: ÚLTIMOS PEDIDOS RECEBIDOS COM AÇÃO RÁPIDA DE WHATSAPP */}
      <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-zinc-950">
              Últimos Pedidos Recebidos
            </h2>
            <p className="text-xs text-zinc-500">
              Atendimento ágil direto no WhatsApp e histórico com status em tempo real.
            </p>
          </div>
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
                  <th className="py-3 px-4">Data/Hora</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">Região / UF</th>
                  <th className="py-3 px-4">Itens</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {orders.slice(0, 6).map((order) => {
                  const directWaUrl = order.phone
                    ? buildWhatsAppUrl(
                        order.phone,
                        `Olá ${order.customer_name}! Estou em contato sobre seu pedido #${order.id} na HeadShop Entrega Rápida.`,
                      )
                    : null

                  return (
                    <tr key={order.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-zinc-500 whitespace-nowrap">
                        {formatDateTime(order.created)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-900">
                        {order.customer_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-600">{order.phone}</td>
                      <td className="py-3 px-4 text-zinc-600">
                        {order.region} ({order.state})
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-600">
                        {order.items?.length || 0} produtos
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-zinc-950">
                        {formatBRL(order.total)}
                      </td>
                      <td className="py-3 px-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {directWaUrl && (
                            <a
                              href={directWaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 h-7 px-2 rounded text-[11px] font-semibold bg-[#25D366] text-white hover:bg-[#1EBE5A] transition-colors"
                              title="Chamar cliente no WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-current" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] px-2.5 border-zinc-300"
                          >
                            <Link to={`/admin/pedidos?id=${order.id}`}>Ver Detalhes</Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LINHA 5: ALERTA DE RECOMPRAS PENDENTES / ESTOQUE CRÍTICO */}
      {recompraSuggestionsList.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-red-600" />
              <h3 className="font-display font-bold text-sm text-zinc-950">
                Itens com Sugestão de Recompra Imediata
              </h3>
            </div>
            <Link
              to="/admin/recompras"
              className="text-xs font-semibold text-zinc-700 hover:text-black"
            >
              Ver Central de Recompras →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {recompraSuggestionsList.map((item) => (
              <div
                key={item.product.id}
                className="p-3 rounded-lg border border-red-200 bg-red-50/40 space-y-1"
              >
                <div className="font-semibold text-zinc-900 truncate">{item.product.name}</div>
                <div className="flex justify-between font-mono text-[11px] text-zinc-600">
                  <span>Atual: {item.currentStock} un.</span>
                  <span className="font-bold text-red-700">Mín: {item.minStock} un.</span>
                </div>
                <div className="pt-1 text-[11px] text-zinc-500 font-mono">
                  Sugerido repor: <strong>+{item.suggestedQty} un.</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
