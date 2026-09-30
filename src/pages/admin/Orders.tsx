import React, { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search,
  Filter,
  MessageCircle,
  Eye,
  RefreshCw,
  X,
  FileText,
  Truck,
  CreditCard,
  QrCode,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Package,
  Layers,
  MapPin,
  ExternalLink,
  RotateCcw,
} from 'lucide-react'
import { Order, OrderStatus, Invoice, Shipment, Payment, Product } from '@/types/ecommerce'
import { getOrders, updateOrderStatus } from '@/services/orders'
import { getShipments, syncOrderShipment } from '@/services/shipments'
import { getPayments } from '@/services/payments'
import { emitInvoiceBling, getInvoices } from '@/services/bling'
import { deductOrderStock } from '@/services/stock'
import { getAllProductsAdmin } from '@/services/products'
import { formatBRL, formatDateTime, getFileUrl, getProductFallbackImage } from '@/lib/formatters'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { OrderStatusBadge } from './Dashboard'
import { useRealtime } from '@/hooks/use-realtime'

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [search, setSearch] = useState<string>('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isEmittingNfe, setIsEmittingNfe] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [ordersData, shipmentsData, paymentsData, invoicesData, productsData] =
        await Promise.all([
          getOrders(),
          getShipments(),
          getPayments(),
          getInvoices(),
          getAllProductsAdmin(),
        ])
      setOrders(ordersData)
      setShipments(shipmentsData)
      setPayments(paymentsData)
      setInvoices(invoicesData)
      setProducts(productsData)

      // Se havia um id na URL, abrir automaticamente
      const queryId = searchParams.get('id')
      if (queryId) {
        const found = ordersData.find((o) => o.id === queryId)
        if (found) setSelectedOrder(found)
      }
    } catch (e) {
      console.error('Erro ao buscar dados de pedidos', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Sincronização em tempo real
  useRealtime('orders', () => {
    getOrders().then((updated) => {
      setOrders(updated)
      if (selectedOrder) {
        const fresh = updated.find((o) => o.id === selectedOrder.id)
        if (fresh) setSelectedOrder(fresh)
      }
    })
  })
  useRealtime('shipments', () => {
    getShipments().then(setShipments)
  })
  useRealtime('payments', () => {
    getPayments().then(setPayments)
  })

  // Mapas para cruzamento rápido de dados
  const shipmentsByOrderId = useMemo(() => {
    const map = new Map<string, Shipment>()
    shipments.forEach((s) => {
      if (s.order) map.set(s.order, s)
    })
    return map
  }, [shipments])

  const paymentsByOrderId = useMemo(() => {
    const map = new Map<string, Payment>()
    payments.forEach((p) => {
      if (p.order) map.set(p.order, p)
    })
    return map
  }, [payments])

  const invoicesByOrderId = useMemo(() => {
    const map = new Map<string, Invoice>()
    invoices.forEach((inv) => {
      if (inv.order) map.set(inv.order, inv)
    })
    return map
  }, [invoices])

  const productsByName = useMemo(() => {
    const map = new Map<string, Product>()
    products.forEach((p) => map.set(p.name.toLowerCase().trim(), p))
    return map
  }, [products])

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return
    setIsUpdatingStatus(true)
    try {
      const updated = await updateOrderStatus(selectedOrder.id, newStatus)
      setSelectedOrder(updated)
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))

      // Baixa de estoque se enviado ou entregue
      if (newStatus === 'enviado' || newStatus === 'entregue') {
        if (selectedOrder.items && selectedOrder.items.length > 0) {
          await deductOrderStock(selectedOrder.id, selectedOrder.items)
        }
      }

      // Sincronizar expedição se aplicável
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
      if (newStatus === 'enviado') {
        syncOrderShipment(selectedOrder.id, 'enviado', { shipped_at: now }).catch(() => {})
      } else if (newStatus === 'entregue') {
        syncOrderShipment(selectedOrder.id, 'entregue', { delivered_at: now }).catch(() => {})
      } else if (newStatus === 'em preparo') {
        syncOrderShipment(selectedOrder.id, 'separacao').catch(() => {})
      }
    } catch (err) {
      console.error('Erro ao atualizar status do pedido', err)
      alert('Falha ao atualizar o status do pedido.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleEmitNfe = async (order: Order) => {
    setIsEmittingNfe(order.id)
    try {
      const res = await emitInvoiceBling(order)
      alert(res.message)
      await loadData()
    } catch (err: any) {
      console.error('Erro ao emitir NF-e:', err)
      alert(err.message || 'Falha ao emitir nota fiscal.')
    } finally {
      setIsEmittingNfe(null)
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.phone?.includes(search) ||
        o.id?.toLowerCase().includes(search.toLowerCase()) ||
        o.city?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'todos' ? true : o.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [orders, search, statusFilter])

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order)
    searchParams.set('id', order.id)
    setSearchParams(searchParams)
  }

  const closeOrderDetail = () => {
    setSelectedOrder(null)
    searchParams.delete('id')
    setSearchParams(searchParams)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Visão Geral de Vendas & Pedidos
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
            Gestão Integrada de Pedidos
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Visualize dados do cliente, miniatura dos produtos, status de pagamento, NF-e e
            rastreio.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-zinc-300 hover:border-black text-xs gap-1.5 bg-white"
          >
            <Link to="/admin/expedicao">
              <Truck className="w-3.5 h-3.5" />
              <span>Expedição</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-zinc-300 hover:border-black text-xs gap-1.5 bg-white"
          >
            <Link to="/admin/kanban">
              <Layers className="w-3.5 h-3.5" />
              <span>Quadro Kanban</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-zinc-300 gap-1.5 text-xs bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Toolbar de Filtro e Busca */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Buscar por cliente, WhatsApp, cidade ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm bg-zinc-50 border-zinc-200 h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className="text-xs font-medium text-zinc-600 whitespace-nowrap">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 text-xs bg-zinc-50 border-zinc-200 h-9">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="em preparo">Em Preparo</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="entregue">Entregue</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Pedidos com Colunas Informativas */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 text-zinc-600 font-mono uppercase border-b border-zinc-200">
              <tr>
                <th className="py-3.5 px-4">ID Pedido</th>
                <th className="py-3.5 px-4">Data/Hora</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Região / UF</th>
                <th className="py-3.5 px-4">Pagamento</th>
                <th className="py-3.5 px-4">Logística & NF</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500">
                    Nenhum pedido encontrado com os critérios selecionados.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const ship = shipmentsByOrderId.get(order.id)
                  const pay = paymentsByOrderId.get(order.id)
                  const inv = invoicesByOrderId.get(order.id)

                  return (
                    <tr
                      key={order.id}
                      onClick={() => openOrderDetail(order)}
                      className="hover:bg-zinc-50/90 cursor-pointer transition-colors"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                        #{order.id.slice(-6).toUpperCase()}
                      </td>

                      {/* Data/Hora */}
                      <td className="py-3.5 px-4 font-mono text-zinc-500 whitespace-nowrap">
                        {formatDateTime(order.created)}
                      </td>

                      {/* Cliente + Fone */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-900">{order.customer_name}</div>
                        <div className="font-mono text-[11px] text-zinc-500">{order.phone}</div>
                      </td>

                      {/* Região e Cidade */}
                      <td className="py-3.5 px-4 text-zinc-600">
                        <div className="font-medium text-zinc-900">{order.region}</div>
                        <div className="text-[11px] text-zinc-500">
                          {order.city} - {order.state}
                        </div>
                      </td>

                      {/* Pagamento Status */}
                      <td className="py-3.5 px-4">
                        {pay ? (
                          <div className="space-y-0.5 font-mono text-[11px]">
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold uppercase text-[10px] ${
                                pay.status === 'pago'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-zinc-100 text-zinc-700'
                              }`}
                            >
                              {pay.method.toUpperCase()} • {pay.status}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-500 font-mono text-[11px] bg-zinc-100 px-1.5 py-0.5 rounded">
                            WhatsApp / Direto
                          </span>
                        )}
                      </td>

                      {/* Logística & NF */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 text-[11px] font-mono">
                          {ship?.tracking_code ? (
                            <span className="text-blue-700 font-bold flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              {ship.tracking_code}
                            </span>
                          ) : (
                            <span className="text-zinc-400">Sem rastreio</span>
                          )}

                          {inv ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              NF #{inv.invoice_number}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-950 whitespace-nowrap">
                        {formatBRL(order.total)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <OrderStatusBadge status={order.status} />
                      </td>

                      {/* Ação */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openOrderDetail(order)}
                          className="h-7 text-[11px] px-2.5 border-zinc-300 hover:border-black font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Detalhes
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

      {/* PAINEL DE DETALHES RICO (Modal Dialog Completo sem sair da tela) */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && closeOrderDetail()}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          {selectedOrder && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <DialogTitle className="font-display font-bold text-xl text-zinc-950 flex items-center gap-2">
                      <span>Pedido #{selectedOrder.id}</span>
                      <OrderStatusBadge status={selectedOrder.status} />
                    </DialogTitle>
                    <DialogDescription className="text-xs font-mono text-zinc-500 mt-1">
                      Registrado em: {formatDateTime(selectedOrder.created)}
                    </DialogDescription>
                  </div>

                  <a
                    href={buildWhatsAppUrl(
                      selectedOrder.phone,
                      `Olá ${selectedOrder.customer_name}! Estou entrando em contato sobre seu pedido #${selectedOrder.id} na HeadShop Entrega Rápida.`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg font-semibold text-xs bg-[#25D366] hover:bg-[#1EBE5A] text-white transition-colors self-start sm:self-auto"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    Chamar Cliente no WhatsApp
                  </a>
                </div>
              </DialogHeader>

              {/* Status Switcher & Ações de Fluxo */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-800 block">
                      Status do Pedido:
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <Select
                        value={selectedOrder.status}
                        disabled={isUpdatingStatus}
                        onValueChange={(val) => handleStatusChange(val as OrderStatus)}
                      >
                        <SelectTrigger className="w-52 bg-white border-zinc-300 text-xs h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="novo">Novo</SelectItem>
                          <SelectItem value="em preparo">Em Preparo</SelectItem>
                          <SelectItem value="enviado">Enviado</SelectItem>
                          <SelectItem value="entregue">Entregue</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      {isUpdatingStatus && (
                        <span className="text-xs text-zinc-500 animate-pulse">Atualizando...</span>
                      )}
                    </div>
                  </div>

                  {/* Bling NF-e */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-800 block">
                      Nota Fiscal (Bling ERP):
                    </label>
                    <div className="mt-1">
                      {(() => {
                        const inv = invoicesByOrderId.get(selectedOrder.id)
                        if (inv) {
                          return (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-emerald-700 font-bold font-mono flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                                <FileText className="w-3.5 h-3.5" /> NF-e #{inv.invoice_number}
                              </span>
                              {inv.danfe_url && (
                                <a
                                  href={inv.danfe_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-semibold underline text-zinc-800 hover:text-black flex items-center gap-1"
                                >
                                  Abrir DANFE <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          )
                        }
                        return (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isEmittingNfe === selectedOrder.id}
                            onClick={() => handleEmitNfe(selectedOrder)}
                            className="text-xs h-9 border-emerald-300 text-emerald-800 hover:bg-emerald-50 gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              {isEmittingNfe === selectedOrder.id
                                ? 'Emitindo no Bling...'
                                : 'Emitir Nota Fiscal (Bling)'}
                            </span>
                          </Button>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações de Envio & Rastreamento (Shipment) */}
              {(() => {
                const ship = shipmentsByOrderId.get(selectedOrder.id)
                return (
                  <div className="p-4 border border-zinc-200 rounded-xl bg-blue-50/30 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-zinc-950">
                        <Truck className="w-4 h-4 text-blue-700" />
                        <span>Logística & Despacho</span>
                      </div>
                      {ship && (
                        <Badge
                          variant="secondary"
                          className="font-mono text-[10px] uppercase font-bold"
                        >
                          Status Envio: {ship.shipping_status}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <span className="text-zinc-500 block">Transportadora:</span>
                        <strong className="text-zinc-900 font-medium">
                          {ship?.carrier || 'Não vinculada'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Código de Rastreio:</span>
                        <strong className="text-blue-700 font-mono font-bold">
                          {ship?.tracking_code || 'Pendente de envio'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Data de Despacho:</span>
                        <span className="font-mono text-zinc-800">
                          {ship?.shipped_at || 'Aguardando coleta'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Informações de Pagamento (Gateway Mercado Pago / Pix / Cartão) */}
              {(() => {
                const pay = paymentsByOrderId.get(selectedOrder.id)
                return (
                  <div className="p-4 border border-zinc-200 rounded-xl bg-zinc-50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-zinc-950">
                        <CreditCard className="w-4 h-4 text-zinc-800" />
                        <span>Informações de Pagamento</span>
                      </div>
                      {pay && (
                        <Badge
                          className={
                            pay.status === 'pago'
                              ? 'bg-emerald-600 text-white text-[10px]'
                              : 'bg-zinc-200 text-zinc-800 text-[10px]'
                          }
                        >
                          {pay.status.toUpperCase()}
                        </Badge>
                      )}
                    </div>

                    {pay ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 font-mono">
                        <div>
                          <span className="text-zinc-500 block font-sans">Método:</span>
                          <strong className="text-zinc-900 capitalize">{pay.method}</strong>
                        </div>
                        <div>
                          <span className="text-zinc-500 block font-sans">Identificador TXID:</span>
                          <strong className="text-zinc-700 truncate block">
                            {pay.txid || 'Sem TXID'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-zinc-500 block font-sans">Pago Em:</span>
                          <span className="text-zinc-800">
                            {pay.paid_at || (pay.status === 'pago' ? 'Confirmado' : 'Aguardando')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-zinc-500">
                        Pedido combinado diretamente no WhatsApp ou pagamento balcão/presencial.
                      </p>
                    )}
                  </div>
                )
              })()}

              {/* Dados do Cliente e Endereço */}
              <div className="border border-zinc-200 rounded-xl p-4 space-y-3">
                <h4 className="font-display font-bold text-sm text-zinc-950 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-zinc-700" />
                  <span>Destinatário & Endereço Completo</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Nome do Cliente:</span>
                    <strong className="text-zinc-950">{selectedOrder.customer_name}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">WhatsApp:</span>
                    <strong className="text-zinc-950 font-mono">{selectedOrder.phone}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-zinc-500 block">Endereço de Entrega:</span>
                    <strong className="text-zinc-950 block">
                      {selectedOrder.address}, {selectedOrder.city} - {selectedOrder.state}{' '}
                      {selectedOrder.cep ? `(CEP: ${selectedOrder.cep})` : ''}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Região de Frete:</span>
                    <strong className="text-zinc-900 font-mono">{selectedOrder.region}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">E-mail:</span>
                    <strong className="text-zinc-900 font-mono">
                      {selectedOrder.email || 'Não informado'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Itens com Miniaturas Visíveis */}
              <div className="border border-zinc-200 rounded-xl p-4 space-y-3">
                <h4 className="font-display font-bold text-sm text-zinc-950 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-zinc-700" />
                  <span>Produtos do Pedido ({selectedOrder.items?.length || 0})</span>
                </h4>

                <div className="divide-y divide-zinc-100 text-xs">
                  {selectedOrder.items?.map((item, idx) => {
                    const matchedProd = productsByName.get(item.name.toLowerCase().trim())
                    const imgUrl = matchedProd?.image
                      ? getFileUrl('products', matchedProd.id, matchedProd.image)
                      : getProductFallbackImage(item.name)

                    return (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={imgUrl}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg border border-zinc-200 object-cover shrink-0 bg-zinc-50"
                          />
                          <div className="min-w-0">
                            <span className="font-semibold text-zinc-900 block truncate">
                              {item.name}
                            </span>
                            <span className="text-zinc-500 font-mono text-[11px]">
                              {item.quantity} un. x {formatBRL(item.unit_price)}
                            </span>
                          </div>
                        </div>

                        <span className="font-mono font-bold text-zinc-950 shrink-0">
                          {formatBRL(item.quantity * item.unit_price)}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Discriminação de Totais */}
                <div className="pt-3 border-t border-zinc-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium">
                      {formatBRL(selectedOrder.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Frete ({selectedOrder.region}):</span>
                    <span className="font-mono font-medium">
                      {selectedOrder.shipping === 0 ? 'GRÁTIS' : formatBRL(selectedOrder.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-200 font-bold text-sm text-zinc-950">
                    <span>Total Geral:</span>
                    <span className="font-mono text-base">{formatBRL(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
