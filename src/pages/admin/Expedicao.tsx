import React, { useEffect, useState, useMemo } from 'react'
import {
  Boxes,
  Truck,
  RotateCcw,
  CheckCircle2,
  Clock,
  Package,
  Search,
  RefreshCw,
  Send,
  MessageCircle,
  ExternalLink,
  AlertCircle,
  FileText,
  BadgeCheck,
  ArrowRight,
  ShieldAlert,
  ClipboardList,
} from 'lucide-react'
import { Order, Shipment, ShippingStatus } from '@/types/ecommerce'
import { getOrders, updateOrderStatus } from '@/services/orders'
import {
  getShipments,
  createShipment,
  updateShipment,
  syncOrderShipment,
} from '@/services/shipments'
import { formatBRL, formatDateTime } from '@/lib/formatters'
import { buildWhatsAppUrl, buildDispatchNotificationMessage } from '@/lib/whatsapp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRealtime } from '@/hooks/use-realtime'

export default function AdminExpedicao() {
  const [activeTab, setActiveTab] = useState<'separacao' | 'enviados' | 'devolucoes'>('separacao')
  const [orders, setOrders] = useState<Order[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modais de ação
  const [dispatchModalOrder, setDispatchModalOrder] = useState<Order | null>(null)
  const [dispatchTracking, setDispatchTracking] = useState('')
  const [dispatchCarrier, setDispatchCarrier] = useState('Sedex Express / Correios')
  const [dispatchNotes, setDispatchNotes] = useState('')
  const [dispatchStatus, setDispatchStatus] = useState<'pronto_envio' | 'enviado'>('enviado')
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false)

  // Modal para registrar devolução
  const [returnModalTarget, setReturnModalTarget] = useState<{
    orderId: string
    orderTotal: number
    customerName: string
    existingShipmentId?: string
  } | null>(null)
  const [returnReason, setReturnReason] = useState('')
  const [returnRefundAmount, setReturnRefundAmount] = useState<string>('')
  const [returnStatus, setReturnStatus] = useState<'devolvido' | 'devolucao_recebida'>('devolvido')
  const [returnNotes, setReturnNotes] = useState('')
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false)

  // Modal de Detalhes / Leitura da Devolução
  const [readingShipment, setReadingShipment] = useState<Shipment | null>(null)
  const [isUpdatingReturnStatus, setIsUpdatingReturnStatus] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [ordersData, shipmentsData] = await Promise.all([getOrders(), getShipments()])
      setOrders(ordersData)
      setShipments(shipmentsData)
    } catch (e) {
      console.error('Erro ao carregar dados de expedição:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Inscrição em tempo real para ambas as coleções
  useRealtime('orders', () => {
    getOrders().then(setOrders)
  })
  useRealtime('shipments', () => {
    getShipments().then(setShipments)
  })

  // Mapear shipments por orderId para acesso rápido
  const shipmentsByOrderId = useMemo(() => {
    const map = new Map<string, Shipment>()
    shipments.forEach((s) => {
      if (s.order) {
        map.set(s.order, s)
      }
    })
    return map
  }, [shipments])

  // Map de pedidos por ID
  const ordersById = useMemo(() => {
    const map = new Map<string, Order>()
    orders.forEach((o) => map.set(o.id, o))
    return map
  }, [orders])

  // KPIs
  const kpis = useMemo(() => {
    // 1. Aguardando separação: pedidos com status 'novo' ou 'em preparo' que ainda não estão como 'pronto_envio' ou 'enviado'
    const aguardandoSeparacao = orders.filter((o) => {
      if (o.status === 'cancelado') return false
      const ship = shipmentsByOrderId.get(o.id)
      if (ship) {
        return ship.shipping_status === 'separacao'
      }
      return o.status === 'novo' || o.status === 'em preparo'
    }).length

    // 2. Prontos para envio
    const prontosParaEnvio = shipments.filter((s) => s.shipping_status === 'pronto_envio').length

    // 3. Em trânsito / Enviados (ativos)
    const emTransito = shipments.filter(
      (s) => s.shipping_status === 'enviado' || s.shipping_status === 'em_transito',
    ).length

    // 4. Devoluções abertas (devolvido em análise ou recebido)
    const devolucoesAbertas = shipments.filter(
      (s) => s.shipping_status === 'devolvido' || s.shipping_status === 'devolucao_recebida',
    ).length

    return {
      aguardandoSeparacao,
      prontosParaEnvio,
      emTransito,
      devolucoesAbertas,
    }
  }, [orders, shipments, shipmentsByOrderId])

  // 1. FILA DE SEPARAÇÃO (Pedidos novo / em preparo)
  const separacaoList = useMemo(() => {
    const term = search.toLowerCase()
    return orders
      .filter((o) => {
        // Excluir cancelados e entregues
        if (o.status === 'cancelado' || o.status === 'entregue') return false

        const ship = shipmentsByOrderId.get(o.id)
        // Se já tiver shipment com status devolvido ou entregue, não entra na separação
        if (
          ship &&
          ['entregue', 'devolvido', 'devolucao_recebida'].includes(ship.shipping_status)
        ) {
          return false
        }

        // Se o pedido for novo ou em preparo, ou o shipment for separacao / pronto_envio
        const isSeparacaoStatus =
          o.status === 'novo' ||
          o.status === 'em preparo' ||
          ship?.shipping_status === 'separacao' ||
          ship?.shipping_status === 'pronto_envio'

        if (!isSeparacaoStatus) return false

        if (!term) return true
        return (
          o.customer_name?.toLowerCase().includes(term) ||
          o.phone?.includes(term) ||
          o.id?.toLowerCase().includes(term) ||
          o.city?.toLowerCase().includes(term) ||
          o.region?.toLowerCase().includes(term)
        )
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
  }, [orders, shipmentsByOrderId, search])

  // 2. LISTA DE ENVIADOS (shipments enviado, em_transito, entregue)
  const enviadosList = useMemo(() => {
    const term = search.toLowerCase()
    return shipments
      .filter((s) => ['enviado', 'em_transito', 'entregue'].includes(s.shipping_status))
      .filter((s) => {
        if (!term) return true
        const ord = s.expand?.order || ordersById.get(s.order)
        return (
          s.tracking_code?.toLowerCase().includes(term) ||
          s.carrier?.toLowerCase().includes(term) ||
          ord?.customer_name?.toLowerCase().includes(term) ||
          ord?.phone?.includes(term) ||
          s.order?.toLowerCase().includes(term) ||
          ord?.city?.toLowerCase().includes(term)
        )
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
  }, [shipments, ordersById, search])

  // 3. LISTA DE DEVOLUÇÕES (shipments devolvido, devolucao_recebida)
  const devolucoesList = useMemo(() => {
    const term = search.toLowerCase()
    return shipments
      .filter((s) => ['devolvido', 'devolucao_recebida'].includes(s.shipping_status))
      .filter((s) => {
        if (!term) return true
        const ord = s.expand?.order || ordersById.get(s.order)
        return (
          s.tracking_code?.toLowerCase().includes(term) ||
          s.carrier?.toLowerCase().includes(term) ||
          s.return_reason?.toLowerCase().includes(term) ||
          ord?.customer_name?.toLowerCase().includes(term) ||
          ord?.phone?.includes(term) ||
          s.order?.toLowerCase().includes(term)
        )
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
  }, [shipments, ordersById, search])

  // Abertura do modal de despacho
  const handleOpenDispatch = (order: Order) => {
    const existing = shipmentsByOrderId.get(order.id)
    setDispatchModalOrder(order)
    setDispatchTracking(existing?.tracking_code || '')
    setDispatchCarrier(existing?.carrier || 'Sedex Express / Correios')
    setDispatchNotes(existing?.notes || '')
    setDispatchStatus(existing?.shipping_status === 'pronto_envio' ? 'pronto_envio' : 'enviado')
  }

  // Submissão do modal de despacho
  const handleSubmitDispatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dispatchModalOrder) return

    setIsSubmittingDispatch(true)
    try {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

      // 1. Atualizar ou criar o shipment
      await syncOrderShipment(dispatchModalOrder.id, dispatchStatus, {
        tracking_code: dispatchTracking.trim(),
        carrier: dispatchCarrier.trim(),
        notes: dispatchNotes.trim(),
        shipped_at: dispatchStatus === 'enviado' ? now : undefined,
      })

      // 2. Se status for "enviado", refletir no status do pedido principal também
      if (dispatchStatus === 'enviado') {
        await updateOrderStatus(dispatchModalOrder.id, 'enviado')
      } else if (dispatchStatus === 'pronto_envio') {
        // Pedido segue 'em preparo' se ainda estiver sendo finalizado
        if (dispatchModalOrder.status === 'novo') {
          await updateOrderStatus(dispatchModalOrder.id, 'em preparo')
        }
      }

      await loadData()
      setDispatchModalOrder(null)
    } catch (err) {
      console.error('Erro ao registrar despacho:', err)
      alert('Erro ao registrar envio. Verifique o console.')
    } finally {
      setIsSubmittingDispatch(false)
    }
  }

  // Marcar shipment como Entregue
  const handleMarkAsDelivered = async (shipment: Shipment) => {
    const confirmed = window.confirm(
      'Confirmar que este pedido foi ENTREGUE ao destinatário com sucesso?',
    )
    if (!confirmed) return

    try {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
      await updateShipment(shipment.id, {
        shipping_status: 'entregue',
        delivered_at: now,
      })
      if (shipment.order) {
        await updateOrderStatus(shipment.order, 'entregue')
      }
      await loadData()
    } catch (e) {
      console.error('Erro ao marcar entregue:', e)
    }
  }

  // Abrir modal de devolução
  const handleOpenReturnModal = (params: {
    orderId: string
    orderTotal: number
    customerName: string
    existingShipmentId?: string
  }) => {
    setReturnModalTarget(params)
    setReturnReason('')
    setReturnRefundAmount(params.orderTotal.toString())
    setReturnStatus('devolvido')
    setReturnNotes('')
  }

  // Submeter Devolução
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!returnModalTarget) return

    setIsSubmittingReturn(true)
    try {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
      const refundNum = parseFloat(returnRefundAmount.replace(',', '.')) || 0

      if (returnModalTarget.existingShipmentId) {
        await updateShipment(returnModalTarget.existingShipmentId, {
          shipping_status: returnStatus,
          return_reason: returnReason,
          refund_amount: refundNum,
          returned_at: now,
          notes: returnNotes,
        })
      } else {
        await createShipment({
          order: returnModalTarget.orderId,
          shipping_status: returnStatus,
          return_reason: returnReason,
          refund_amount: refundNum,
          returned_at: now,
          notes: returnNotes,
        })
      }

      await loadData()
      setReturnModalTarget(null)
    } catch (err) {
      console.error('Erro ao registrar devolução:', err)
      alert('Falha ao registrar devolução. Verifique os campos.')
    } finally {
      setIsSubmittingReturn(false)
    }
  }

  // Atualizar status da devolução direto na leitura
  const handleUpdateReturnReadingStatus = async (shipmentId: string, newStatus: ShippingStatus) => {
    setIsUpdatingReturnStatus(true)
    try {
      const updated = await updateShipment(shipmentId, {
        shipping_status: newStatus,
      })
      setReadingShipment(updated)
      await loadData()
    } catch (e) {
      console.error('Erro ao atualizar status da devolução:', e)
    } finally {
      setIsUpdatingReturnStatus(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Central de Logística & Fulfillment
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
            Expedição de Pedidos
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Controle integrado de Separação (Picking), Despacho de Enviados e Leitura de Devoluções.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-zinc-300 gap-1.5 text-xs h-9 bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* 4 KPIs no Topo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Aguardando Separação</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl sm:text-3xl text-zinc-950">
              {kpis.aguardandoSeparacao}
            </span>
            <span className="text-[11px] font-mono text-zinc-500">pedidos</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">Fila de conferência & embalagem</div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Prontos para Envio</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl sm:text-3xl text-zinc-950">
              {kpis.prontosParaEnvio}
            </span>
            <span className="text-[11px] font-mono text-zinc-500">volumes</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">Embalados, aguardando coleta</div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Em Trânsito / Enviados</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl sm:text-3xl text-zinc-950">
              {kpis.emTransito}
            </span>
            <span className="text-[11px] font-mono text-zinc-500">remessas</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">Despachados via Correios/Loggi</div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Devoluções Abertas</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl sm:text-3xl text-zinc-950">
              {kpis.devolucoesAbertas}
            </span>
            <span className="text-[11px] font-mono text-zinc-500">ocorrências</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">Em triagem reversa ou análise</div>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Buscar por cliente, rastreio, transportadora, cidade ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm bg-zinc-50 border-zinc-200 h-9"
          />
        </div>

        <div className="text-xs font-mono text-zinc-500 flex items-center gap-2 self-end sm:self-auto">
          <span>WhatsApp Central:</span>
          <strong className="text-zinc-900 font-bold">+55 48 99246-3428</strong>
        </div>
      </div>

      {/* Tabs Principais: Separação, Enviados, Devoluções */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'separacao' | 'enviados' | 'devolucoes')}
        className="w-full space-y-4"
      >
        <div className="border-b border-zinc-200 pb-1">
          <TabsList className="bg-zinc-100 p-1 border border-zinc-200 rounded-xl">
            <TabsTrigger
              value="separacao"
              className="gap-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-xs font-semibold"
            >
              <Boxes className="w-4 h-4 text-amber-600" />
              <span>1. Separação (Picking)</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                {separacaoList.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="enviados"
              className="gap-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-xs font-semibold"
            >
              <Truck className="w-4 h-4 text-purple-600" />
              <span>2. Enviados & Rastreamento</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                {enviadosList.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="devolucoes"
              className="gap-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-xs font-semibold"
            >
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>3. Devoluções & Reversa</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                {devolucoesList.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* =========================================================================
            ABA 1: SEPARAÇÃO (PICKING)
           ========================================================================= */}
        <TabsContent value="separacao" className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-zinc-950">
                Fila de Separação e Embalagem
              </h2>
              <p className="text-xs text-zinc-500">
                Pedidos confirmados aguardando conferência dos itens, proteção anti-impacto e
                geração de etiqueta.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              {separacaoList.length} pedido(s) pendente(s)
            </span>
          </div>

          {separacaoList.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="font-semibold text-zinc-800 text-sm">Tudo separado por aqui!</div>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Não há pedidos novos ou em preparo aguardando separação neste momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {separacaoList.map((order) => {
                const ship = shipmentsByOrderId.get(order.id)
                const isReady = ship?.shipping_status === 'pronto_envio'

                return (
                  <div
                    key={order.id}
                    className={`bg-white border rounded-xl p-4 shadow-xs flex flex-col justify-between transition-all ${
                      isReady
                        ? 'border-blue-300 ring-2 ring-blue-500/10'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Bar: ID + Status Badge */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold bg-zinc-100 text-zinc-900 px-2.5 py-1 rounded-md">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                        {isReady ? (
                          <Badge className="bg-blue-600 text-white text-[10px] font-mono">
                            Pronto para Envio
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-amber-700 bg-amber-50 border-amber-200 text-[10px] font-mono"
                          >
                            Em Separação
                          </Badge>
                        )}
                      </div>

                      {/* Customer info */}
                      <div>
                        <div className="font-bold text-sm text-zinc-950">{order.customer_name}</div>
                        <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                          <span>
                            {order.city} - {order.state}
                          </span>
                          <span className="text-zinc-300">•</span>
                          <span className="font-mono font-semibold text-zinc-700">
                            {order.region}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400 mt-0.5 truncate">
                          {order.address} {order.cep ? `(CEP: ${order.cep})` : ''}
                        </div>
                      </div>

                      {/* Items checklist */}
                      <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-lg p-2.5 space-y-1.5">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold flex items-center justify-between">
                          <span>Itens a separar ({order.items?.length || 0})</span>
                          <span>Qtd</span>
                        </div>
                        <div className="divide-y divide-zinc-200/60 max-h-36 overflow-y-auto pr-1">
                          {order.items?.map((it, idx) => (
                            <div
                              key={idx}
                              className="py-1.5 flex items-center justify-between text-xs text-zinc-800"
                            >
                              <span className="truncate pr-2 font-medium">{it.name}</span>
                              <span className="font-mono font-bold text-zinc-950 shrink-0 bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-[11px]">
                                {it.quantity}x
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ship details if exists */}
                      {ship && (
                        <div className="text-xs bg-blue-50/60 border border-blue-100 rounded-lg p-2 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-500">Transp:</span>
                            <span className="font-semibold text-zinc-900">
                              {ship.carrier || 'Express'}
                            </span>
                          </div>
                          {ship.tracking_code && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-zinc-500">Rastreio:</span>
                              <span className="font-mono font-bold text-blue-700">
                                {ship.tracking_code}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 mt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <div className="text-xs">
                        <span className="text-zinc-400 block text-[10px]">Total:</span>
                        <span className="font-mono font-bold text-zinc-950 text-sm">
                          {formatBRL(order.total)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDispatch(order)}
                          className="h-8 text-xs gap-1 border-zinc-300 hover:border-black font-semibold"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>{isReady ? 'Editar Envio' : 'Despachar / Etiquetar'}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* =========================================================================
            ABA 2: ENVIADOS (DESPACHADOS / EM TRÂNSITO / ENTREGUES)
           ========================================================================= */}
        <TabsContent value="enviados" className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-zinc-950">
                Remessas Enviadas e Rastreamento
              </h2>
              <p className="text-xs text-zinc-500">
                Acompanhe o trajeto dos pedidos despachados, notifique clientes pelo WhatsApp e
                confirme a entrega.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              {enviadosList.length} registro(s)
            </span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 text-zinc-600 font-mono uppercase border-b border-zinc-200">
                  <tr>
                    <th className="py-3.5 px-4">Pedido / Cliente</th>
                    <th className="py-3.5 px-4">Transportadora</th>
                    <th className="py-3.5 px-4">Código de Rastreio</th>
                    <th className="py-3.5 px-4">Data Envio</th>
                    <th className="py-3.5 px-4">Valor</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Notificar WhatsApp</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {enviadosList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-zinc-500">
                        Nenhum envio registrado no momento.
                      </td>
                    </tr>
                  ) : (
                    enviadosList.map((shipment) => {
                      const order = shipment.expand?.order || ordersById.get(shipment.order)
                      const isDelivered = shipment.shipping_status === 'entregue'
                      const isTransit =
                        shipment.shipping_status === 'em_transito' ||
                        shipment.shipping_status === 'enviado'

                      // Mensagem customizada de despacho para o cliente
                      const whatsAppMsg = buildDispatchNotificationMessage({
                        customerName: order?.customer_name || 'Cliente',
                        orderId: shipment.order,
                        carrier: shipment.carrier,
                        trackingCode: shipment.tracking_code,
                      })
                      const whatsAppUrl = order?.phone
                        ? buildWhatsAppUrl(order.phone, whatsAppMsg)
                        : '#'

                      return (
                        <tr key={shipment.id} className="hover:bg-zinc-50/80 transition-colors">
                          {/* Pedido / Cliente */}
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-zinc-900">
                              #{shipment.order.slice(-6).toUpperCase()}
                            </div>
                            <div className="font-semibold text-zinc-900 mt-0.5">
                              {order?.customer_name || 'Cliente'}
                            </div>
                            <div className="text-[11px] text-zinc-500">
                              {order?.city} - {order?.state} ({order?.region})
                            </div>
                          </td>

                          {/* Transportadora */}
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-zinc-800">
                              {shipment.carrier || 'Correios / Express'}
                            </span>
                          </td>

                          {/* Código de Rastreio */}
                          <td className="py-3.5 px-4">
                            {shipment.tracking_code ? (
                              <div className="flex items-center gap-1.5 font-mono font-bold text-zinc-950 bg-zinc-100 px-2 py-1 rounded w-fit text-[11px]">
                                <span>{shipment.tracking_code}</span>
                              </div>
                            ) : (
                              <span className="text-zinc-400 italic">Sem rastreio</span>
                            )}
                          </td>

                          {/* Data Envio */}
                          <td className="py-3.5 px-4 font-mono text-zinc-600 whitespace-nowrap">
                            {shipment.shipped_at
                              ? shipment.shipped_at
                              : formatDateTime(shipment.created)}
                          </td>

                          {/* Valor */}
                          <td className="py-3.5 px-4 font-mono font-bold text-zinc-950 whitespace-nowrap">
                            {order ? formatBRL(order.total) : '—'}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {isDelivered ? (
                              <Badge className="bg-emerald-600 text-white font-mono text-[10px]">
                                Entregue
                              </Badge>
                            ) : (
                              <Badge className="bg-purple-600 text-white font-mono text-[10px]">
                                {shipment.shipping_status === 'em_transito'
                                  ? 'Em Trânsito'
                                  : 'Enviado'}
                              </Badge>
                            )}
                          </td>

                          {/* WhatsApp Button */}
                          <td className="py-3.5 px-4 text-center">
                            {order?.phone ? (
                              <a
                                href={whatsAppUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Enviar notificação de despacho com código de rastreio no WhatsApp"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#25D366] hover:bg-[#1EBE5A] text-white shadow-xs transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                                <span>Avisar Cliente</span>
                              </a>
                            ) : (
                              <span className="text-zinc-400 text-[11px]">Sem fone</span>
                            )}
                          </td>

                          {/* Ações */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isTransit && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkAsDelivered(shipment)}
                                  className="h-7 text-[11px] px-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                                >
                                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                                  Marcar Entregue
                                </Button>
                              )}

                              {/* Botão Registrar Devolução */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleOpenReturnModal({
                                    orderId: shipment.order,
                                    orderTotal: order?.total || 0,
                                    customerName: order?.customer_name || '',
                                    existingShipmentId: shipment.id,
                                  })
                                }
                                className="h-7 text-[11px] px-2 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                                title="Registrar devolução para este pedido"
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Devolver
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* =========================================================================
            ABA 3: DEVOLUÇÕES (LEITURA / REVERSA)
           ========================================================================= */}
        <TabsContent value="devolucoes" className="space-y-4 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-lg text-zinc-950">
                Leitura e Acompanhamento de Devoluções
              </h2>
              <p className="text-xs text-zinc-500">
                Fluxo de logística reversa: motivo da devolução, conferência de recebimento físico e
                estorno/troca.
              </p>
            </div>

            {/* Ação manual: Nova devolução a partir de qualquer pedido */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const orderId = window.prompt('Informe o ID do Pedido para registrar devolução:')
                if (!orderId) return
                const ord = orders.find((o) => o.id === orderId.trim())
                handleOpenReturnModal({
                  orderId: ord?.id || orderId.trim(),
                  orderTotal: ord?.total || 0,
                  customerName: ord?.customer_name || 'Cliente',
                })
              }}
              className="border-zinc-300 text-xs h-9 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Registrar Nova Devolução</span>
            </Button>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 text-zinc-600 font-mono uppercase border-b border-zinc-200">
                  <tr>
                    <th className="py-3.5 px-4">ID Pedido / Cliente</th>
                    <th className="py-3.5 px-4">Motivo da Devolução</th>
                    <th className="py-3.5 px-4">Rastreio Reversa</th>
                    <th className="py-3.5 px-4">Data Ocorrência</th>
                    <th className="py-3.5 px-4">Valor a Reembolsar</th>
                    <th className="py-3.5 px-4">Status Reversa</th>
                    <th className="py-3.5 px-4 text-right">Leitura & Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {devolucoesList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-500">
                        Nenhuma devolução pendente ou registrada.
                      </td>
                    </tr>
                  ) : (
                    devolucoesList.map((item) => {
                      const order = item.expand?.order || ordersById.get(item.order)
                      const isReceived = item.shipping_status === 'devolucao_recebida'

                      return (
                        <tr
                          key={item.id}
                          onClick={() => setReadingShipment(item)}
                          className="hover:bg-zinc-50/80 cursor-pointer transition-colors"
                        >
                          {/* ID Pedido / Cliente */}
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-zinc-900">
                              #{item.order.slice(-6).toUpperCase()}
                            </div>
                            <div className="font-semibold text-zinc-900 mt-0.5">
                              {order?.customer_name || 'Cliente'}
                            </div>
                            <div className="text-[11px] font-mono text-zinc-500">
                              {order?.phone || '—'}
                            </div>
                          </td>

                          {/* Motivo */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-medium text-zinc-900 line-clamp-2">
                              {item.return_reason || 'Motivo não informado'}
                            </div>
                            {item.notes && (
                              <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                                Obs: {item.notes}
                              </div>
                            )}
                          </td>

                          {/* Rastreio Reversa */}
                          <td className="py-3.5 px-4 font-mono">
                            {item.tracking_code ? (
                              <span className="bg-zinc-100 px-2 py-0.5 rounded font-bold text-zinc-800 text-[11px]">
                                {item.tracking_code}
                              </span>
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>

                          {/* Data */}
                          <td className="py-3.5 px-4 font-mono text-zinc-600 whitespace-nowrap">
                            {item.returned_at || formatDateTime(item.updated)}
                          </td>

                          {/* Valor a reembolsar */}
                          <td className="py-3.5 px-4 font-mono font-bold text-rose-600 whitespace-nowrap">
                            {formatBRL(item.refund_amount ?? (order?.total || 0))}
                          </td>

                          {/* Status Reversa */}
                          <td className="py-3.5 px-4">
                            {isReceived ? (
                              <Badge className="bg-emerald-600 text-white font-mono text-[10px]">
                                Devolução Recebida
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-600 text-white font-mono text-[10px]">
                                Devolvido (Em Trânsito)
                              </Badge>
                            )}
                          </td>

                          {/* Leitura & Ações */}
                          <td
                            className="py-3.5 px-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReadingShipment(item)}
                              className="h-7 text-[11px] px-2.5"
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              Ficha de Leitura
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* =========================================================================
          MODAL 1: DESPACHO / EXPEDIÇÃO (SEPARAÇÃO -> PRONTO / ENVIADO)
         ========================================================================= */}
      <Dialog
        open={!!dispatchModalOrder}
        onOpenChange={(open) => !open && setDispatchModalOrder(null)}
      >
        <DialogContent className="max-w-lg">
          {dispatchModalOrder && (
            <form onSubmit={handleSubmitDispatch} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="font-display font-bold text-lg">
                  Registrar Expedição e Rastreamento
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Pedido #{dispatchModalOrder.id.slice(-6).toUpperCase()} —{' '}
                  {dispatchModalOrder.customer_name} ({dispatchModalOrder.city} -{' '}
                  {dispatchModalOrder.state})
                </DialogDescription>
              </DialogHeader>

              {/* Informações dos itens */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs space-y-1">
                <span className="font-semibold text-zinc-700 block">Itens deste pedido:</span>
                <div className="text-zinc-600">
                  {dispatchModalOrder.items?.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                </div>
              </div>

              {/* Status de Expedição */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Etapa de Expedição:</label>
                <Select
                  value={dispatchStatus}
                  onValueChange={(val) => setDispatchStatus(val as 'pronto_envio' | 'enviado')}
                >
                  <SelectTrigger className="text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pronto_envio">
                      📦 Pronto para Envio (Volume embalado, aguardando coleta)
                    </SelectItem>
                    <SelectItem value="enviado">
                      🚚 Enviado (Despachado na transportadora / em trânsito)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transportadora */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Transportadora:</label>
                <Input
                  value={dispatchCarrier}
                  onChange={(e) => setDispatchCarrier(e.target.value)}
                  placeholder="Ex: Sedex Express / Correios, Loggi, Jadlog, Motoboy..."
                  className="text-xs bg-white"
                  required
                />
              </div>

              {/* Código de Rastreio */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Código de Rastreio:</label>
                <Input
                  value={dispatchTracking}
                  onChange={(e) => setDispatchTracking(e.target.value)}
                  placeholder="Ex: BR123456789SP ou número da guia"
                  className="text-xs bg-white font-mono"
                />
                <p className="text-[11px] text-zinc-400">
                  Esse código será incluído na mensagem pronta de WhatsApp enviada ao cliente.
                </p>
              </div>

              {/* Observações internas */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">
                  Observações da Expedição:
                </label>
                <Textarea
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  placeholder="Ex: Embalagem discreta com plástico bolha duplo. Fita inviolável..."
                  rows={2}
                  className="text-xs bg-white"
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDispatchModalOrder(null)}
                  disabled={isSubmittingDispatch}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingDispatch}
                  className="text-xs bg-black text-white hover:bg-zinc-800 font-semibold"
                >
                  {isSubmittingDispatch ? 'Salvando...' : 'Salvar e Atualizar'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 2: REGISTRAR DEVOLUÇÃO
         ========================================================================= */}
      <Dialog
        open={!!returnModalTarget}
        onOpenChange={(open) => !open && setReturnModalTarget(null)}
      >
        <DialogContent className="max-w-lg">
          {returnModalTarget && (
            <form onSubmit={handleSubmitReturn} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="font-display font-bold text-lg text-rose-700 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5" />
                  <span>Registrar Devolução / Logística Reversa</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Pedido #{returnModalTarget.orderId.slice(-6).toUpperCase()} —{' '}
                  {returnModalTarget.customerName}
                </DialogDescription>
              </DialogHeader>

              {/* Motivo da devolução */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">
                  Motivo da Devolução (Obrigatório):
                </label>
                <Input
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Ex: Produto avariado, arrependimento 7 dias, tamanho incorreto..."
                  className="text-xs bg-white"
                  required
                />
              </div>

              {/* Status inicial da reversa */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Status da Devolução:</label>
                <Select
                  value={returnStatus}
                  onValueChange={(val) =>
                    setReturnStatus(val as 'devolvido' | 'devolucao_recebida')
                  }
                >
                  <SelectTrigger className="text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="devolvido">
                      🚚 Devolvido (Pacote em trânsito de volta para a loja)
                    </SelectItem>
                    <SelectItem value="devolucao_recebida">
                      ✅ Devolução Recebida (Conferido no estoque físico)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Valor a reembolsar */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">
                  Valor a Reembolsar / Estornar (R$):
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={returnRefundAmount}
                  onChange={(e) => setReturnRefundAmount(e.target.value)}
                  className="text-xs bg-white font-mono"
                  placeholder="0.00"
                />
              </div>

              {/* Observações internas */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Observações Internas:</label>
                <Textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Ex: Cliente postou nos Correios via PAC Reverso. Aguardando conferência do lacre..."
                  rows={2}
                  className="text-xs bg-white"
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReturnModalTarget(null)}
                  disabled={isSubmittingReturn}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  {isSubmittingReturn ? 'Registrando...' : 'Confirmar Devolução'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 3: FICHA DE LEITURA DA DEVOLUÇÃO
         ========================================================================= */}
      <Dialog open={!!readingShipment} onOpenChange={(open) => !open && setReadingShipment(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {readingShipment &&
            (() => {
              const order = readingShipment.expand?.order || ordersById.get(readingShipment.order)
              const isReceived = readingShipment.shipping_status === 'devolucao_recebida'

              return (
                <div className="space-y-5">
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <DialogTitle className="font-display font-bold text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-zinc-800" />
                        <span>Ficha de Leitura da Devolução</span>
                      </DialogTitle>
                      {isReceived ? (
                        <Badge className="bg-emerald-600 text-white font-mono text-[10px]">
                          Devolução Recebida
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-600 text-white font-mono text-[10px]">
                          Em Trânsito Reversa
                        </Badge>
                      )}
                    </div>
                    <DialogDescription className="text-xs font-mono text-zinc-500">
                      Ocorrência #{readingShipment.id} — Pedido #{readingShipment.order}
                    </DialogDescription>
                  </DialogHeader>

                  {/* Status Switcher */}
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                    <span className="text-xs font-semibold text-zinc-800 block">
                      Atualizar Estado da Devolução:
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isReceived ? 'default' : 'outline'}
                        disabled={isUpdatingReturnStatus}
                        onClick={() =>
                          handleUpdateReturnReadingStatus(readingShipment.id, 'devolucao_recebida')
                        }
                        className="text-xs font-semibold h-8"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        Marcar Devolução Recebida
                      </Button>
                      <Button
                        size="sm"
                        variant={!isReceived ? 'default' : 'outline'}
                        disabled={isUpdatingReturnStatus}
                        onClick={() =>
                          handleUpdateReturnReadingStatus(readingShipment.id, 'devolvido')
                        }
                        className="text-xs font-semibold h-8"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        Em Trânsito Reversa
                      </Button>
                    </div>
                  </div>

                  {/* Motivo & Dados Financeiros */}
                  <div className="border border-zinc-200 rounded-xl p-4 space-y-3">
                    <h4 className="font-display font-bold text-sm text-zinc-950">
                      Detalhes do Motivo & Reembolso
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="col-span-2">
                        <span className="text-zinc-500 block">Motivo Informado:</span>
                        <strong className="text-zinc-900 text-sm block mt-0.5">
                          {readingShipment.return_reason || 'Não informado'}
                        </strong>
                      </div>

                      <div>
                        <span className="text-zinc-500 block">Valor a Reembolsar:</span>
                        <strong className="text-rose-600 font-mono text-base font-extrabold">
                          {formatBRL(readingShipment.refund_amount ?? (order?.total || 0))}
                        </strong>
                      </div>

                      <div>
                        <span className="text-zinc-500 block">Data da Ocorrência:</span>
                        <strong className="text-zinc-900 font-mono">
                          {readingShipment.returned_at || formatDateTime(readingShipment.updated)}
                        </strong>
                      </div>

                      <div className="col-span-2">
                        <span className="text-zinc-500 block">Observações da Central:</span>
                        <p className="text-zinc-700 bg-zinc-50 border border-zinc-200 rounded p-2 mt-1">
                          {readingShipment.notes || 'Nenhuma observação interna inserida.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dados do Cliente e Pedido */}
                  {order && (
                    <div className="border border-zinc-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-display font-bold text-sm text-zinc-950">
                          Dados do Cliente Original
                        </h4>
                        {order.phone && (
                          <a
                            href={buildWhatsAppUrl(
                              order.phone,
                              `Olá ${order.customer_name}! Estamos em contato sobre a devolução do seu pedido #${order.id} na HeadShop Entrega Rápida.`,
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-current" />
                            <span>Chamar no WhatsApp</span>
                          </a>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-zinc-500 block">Cliente:</span>
                          <strong className="text-zinc-900">{order.customer_name}</strong>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">WhatsApp:</span>
                          <strong className="text-zinc-900 font-mono">{order.phone}</strong>
                        </div>
                        <div className="col-span-2">
                          <span className="text-zinc-500 block">Cidade / Endereço:</span>
                          <strong className="text-zinc-900">
                            {order.address}, {order.city} - {order.state}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setReadingShipment(null)}
                      className="text-xs"
                    >
                      Fechar
                    </Button>
                  </DialogFooter>
                </div>
              )
            })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
