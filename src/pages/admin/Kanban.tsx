import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  List,
  RefreshCw,
  Search,
  MessageCircle,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  MoveRight,
} from 'lucide-react'
import { Order, OrderStatus } from '@/types/ecommerce'
import { getOrders, updateOrderStatus } from '@/services/orders'
import { formatBRL, formatDateTime } from '@/lib/formatters'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OrderStatusBadge } from './Dashboard'
import { useRealtime } from '@/hooks/use-realtime'

interface ColumnDef {
  key: OrderStatus
  title: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  badgeClass: string
}

const COLUMNS: ColumnDef[] = [
  {
    key: 'novo',
    title: 'Novo',
    icon: Clock,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50/50',
    borderColor: 'border-blue-200',
    badgeClass: 'bg-blue-600 text-white',
  },
  {
    key: 'em preparo',
    title: 'Em Preparo',
    icon: PackageCheck,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50/50',
    borderColor: 'border-amber-200',
    badgeClass: 'bg-amber-600 text-white',
  },
  {
    key: 'enviado',
    title: 'Enviado',
    icon: Truck,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50/50',
    borderColor: 'border-purple-200',
    badgeClass: 'bg-purple-600 text-white',
  },
  {
    key: 'entregue',
    title: 'Entregue',
    icon: CheckCircle2,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50/50',
    borderColor: 'border-emerald-200',
    badgeClass: 'bg-emerald-600 text-white',
  },
  {
    key: 'cancelado',
    title: 'Cancelado',
    icon: XCircle,
    color: 'text-rose-700',
    bgColor: 'bg-rose-50/50',
    borderColor: 'border-rose-200',
    badgeClass: 'bg-rose-600 text-white',
  },
]

export default function AdminKanban() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<OrderStatus | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getOrders()
      setOrders(data)
    } catch (e) {
      console.error('Erro ao buscar pedidos para kanban', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Atualização em tempo real via PocketBase
  useRealtime('orders', () => {
    getOrders().then((updated) => {
      setOrders(updated)
      if (selectedOrder) {
        const fresh = updated.find((o) => o.id === selectedOrder.id)
        if (fresh) setSelectedOrder(fresh)
      }
    })
  })

  // Filtro de busca simples por texto
  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders
    const term = search.toLowerCase()
    return orders.filter(
      (o) =>
        o.customer_name?.toLowerCase().includes(term) ||
        o.phone?.includes(term) ||
        o.id?.toLowerCase().includes(term) ||
        o.city?.toLowerCase().includes(term),
    )
  }, [orders, search])

  // Agrupamento por coluna com soma de valores e quantidade
  const columnsData = useMemo(() => {
    const map: Record<OrderStatus, { orders: Order[]; totalAmount: number }> = {
      novo: { orders: [], totalAmount: 0 },
      'em preparo': { orders: [], totalAmount: 0 },
      enviado: { orders: [], totalAmount: 0 },
      entregue: { orders: [], totalAmount: 0 },
      cancelado: { orders: [], totalAmount: 0 },
    }

    filteredOrders.forEach((o) => {
      const key = (o.status as OrderStatus) || 'novo'
      if (map[key]) {
        map[key].orders.push(o)
        map[key].totalAmount += o.total || 0
      }
    })

    return map
  }, [filteredOrders])

  // Manipulação de Drag & Drop nativo HTML5
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    setDraggedOrderId(orderId)
    e.dataTransfer.setData('text/plain', orderId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, colKey: OrderStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverColumn !== colKey) {
      setDragOverColumn(colKey)
    }
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: OrderStatus) => {
    e.preventDefault()
    setDragOverColumn(null)
    const orderId = e.dataTransfer.getData('text/plain') || draggedOrderId
    if (!orderId) return

    const orderToMove = orders.find((o) => o.id === orderId)
    if (!orderToMove || orderToMove.status === targetStatus) {
      setDraggedOrderId(null)
      return
    }

    // Atualização otimista imediata na UI
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: targetStatus } : o)))
    setDraggedOrderId(null)

    try {
      await updateOrderStatus(orderId, targetStatus)
    } catch (err) {
      console.error('Falha ao mover pedido no kanban:', err)
      // Reverter em caso de falha
      loadData()
    }
  }

  const handleStatusChangeDialog = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return
    setIsUpdatingStatus(true)
    try {
      const updated = await updateOrderStatus(selectedOrder.id, newStatus)
      setSelectedOrder(updated)
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    } catch (err) {
      console.error('Erro ao atualizar status do pedido', err)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Fluxo de Pedidos em Tempo Real
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
            Kanban de Pedidos
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Arraste os cards entre as colunas para atualizar o status instantaneamente no banco.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Alternância para modo Lista */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-zinc-300 hover:border-black text-xs gap-1.5 h-9"
          >
            <Link to="/admin/pedidos">
              <List className="w-4 h-4" />
              <span>Ver em Lista / Tabela</span>
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-zinc-300 gap-1.5 text-xs h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Buscar por cliente, WhatsApp ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm bg-zinc-50 border-zinc-200 h-9"
          />
        </div>

        <div className="text-xs font-mono text-zinc-500 flex items-center gap-2">
          <span>Total filtrado:</span>
          <strong className="text-zinc-900 font-bold">{filteredOrders.length} pedidos</strong>
        </div>
      </div>

      {/* Kanban Board (5 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colData = columnsData[col.key] || { orders: [], totalAmount: 0 }
          const isOver = dragOverColumn === col.key
          const Icon = col.icon

          return (
            <div
              key={col.key}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.key)}
              className={`flex flex-col rounded-xl border transition-all duration-200 min-h-[560px] ${
                isOver
                  ? 'border-black ring-2 ring-black/10 bg-zinc-100/80 shadow-md scale-[1.01]'
                  : 'border-zinc-200 bg-zinc-50/70 shadow-xs'
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-zinc-200 bg-white rounded-t-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-md ${col.bgColor} ${col.color}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <h3 className="font-display font-bold text-sm text-zinc-900">{col.title}</h3>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs font-bold px-2 py-0.5">
                    {colData.orders.length}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-1 border-t border-zinc-100">
                  <span>Subtotal da coluna:</span>
                  <span className="font-bold text-zinc-900">{formatBRL(colData.totalAmount)}</span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto max-h-[70vh]">
                {colData.orders.length === 0 ? (
                  <div className="h-36 rounded-lg border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-center p-3 text-zinc-400 text-xs">
                    <span>Nenhum pedido aqui</span>
                    <span className="text-[10px] text-zinc-400 mt-1">
                      Arraste um card para esta etapa
                    </span>
                  </div>
                ) : (
                  colData.orders.map((order) => {
                    const isBeingDragged = draggedOrderId === order.id
                    return (
                      <div
                        key={order.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, order.id)}
                        onClick={() => setSelectedOrder(order)}
                        className={`bg-white border rounded-xl p-3.5 shadow-xs cursor-grab active:cursor-grabbing hover:shadow-md hover:border-zinc-400 transition-all space-y-2.5 ${
                          isBeingDragged
                            ? 'opacity-40 scale-95 border-dashed border-black'
                            : 'border-zinc-200'
                        }`}
                      >
                        {/* Card top: Order ID & Time */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded text-[11px]">
                            #{order.id.slice(-6).toUpperCase()}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {formatDateTime(order.created).split(' ')[0]}
                          </span>
                        </div>

                        {/* Customer name & City */}
                        <div>
                          <div className="font-semibold text-sm text-zinc-950 truncate">
                            {order.customer_name}
                          </div>
                          <div className="text-[11px] text-zinc-500 truncate">
                            {order.city} - {order.state} ({order.region})
                          </div>
                        </div>

                        {/* Items preview snippet */}
                        <div className="text-[11px] bg-zinc-50 border border-zinc-100 rounded-md p-2 text-zinc-600 line-clamp-2">
                          {order.items?.length || 0} item(s):{' '}
                          {order.items?.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                        </div>

                        {/* Price & Action */}
                        <div className="flex items-center justify-between pt-1 border-t border-zinc-100 text-xs">
                          <span className="font-mono font-extrabold text-sm text-zinc-950">
                            {formatBRL(order.total)}
                          </span>

                          <div
                            className="flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* WhatsApp direct chat link */}
                            <a
                              href={buildWhatsAppUrl(
                                order.phone,
                                `Olá ${order.customer_name}! Atualização do seu pedido #${order.id} (Status: ${order.status.toUpperCase()}) na HeadShop Entrega Rápida.`,
                              )}
                              target="_blank"
                              rel="noreferrer"
                              title="Conversar no WhatsApp"
                              className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-current" />
                            </a>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                              className="h-7 px-2 text-[11px]"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Ver
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="font-display font-bold text-xl">
                    Pedido #{selectedOrder.id}
                  </DialogTitle>
                  <OrderStatusBadge status={selectedOrder.status} />
                </div>
                <DialogDescription className="text-xs font-mono text-zinc-500">
                  Registrado em: {formatDateTime(selectedOrder.created)}
                </DialogDescription>
              </DialogHeader>

              {/* Status Move Controls inside modal */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                <label className="text-xs font-semibold text-zinc-700 block">
                  Mover Etapa / Alterar Status:
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={selectedOrder.status}
                    disabled={isUpdatingStatus}
                    onValueChange={(val) => handleStatusChangeDialog(val as OrderStatus)}
                  >
                    <SelectTrigger className="w-56 bg-white border-zinc-300">
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

                  <a
                    href={buildWhatsAppUrl(
                      selectedOrder.phone,
                      `Olá ${selectedOrder.customer_name}! Estou entrando em contato sobre seu pedido #${selectedOrder.id} na HeadShop Entrega Rápida.`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md font-semibold text-xs bg-[#25D366] hover:bg-[#1EBE5A] text-white transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    Chamar Cliente no WhatsApp
                  </a>
                </div>
              </div>

              {/* Customer info */}
              <div className="border border-zinc-200 rounded-xl p-4 space-y-3">
                <h4 className="font-display font-bold text-sm text-zinc-950">Dados do Cliente</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Nome:</span>
                    <strong className="text-zinc-900">{selectedOrder.customer_name}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">WhatsApp:</span>
                    <strong className="text-zinc-900 font-mono">{selectedOrder.phone}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Endereço:</span>
                    <strong className="text-zinc-900">{selectedOrder.address}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Cidade / UF / CEP:</span>
                    <strong className="text-zinc-900">
                      {selectedOrder.city} - {selectedOrder.state}{' '}
                      {selectedOrder.cep ? `(${selectedOrder.cep})` : ''}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Região:</span>
                    <strong className="text-zinc-900">{selectedOrder.region}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">E-mail:</span>
                    <strong className="text-zinc-900">
                      {selectedOrder.email || 'Não informado'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-zinc-200 rounded-xl p-4 space-y-3">
                <h4 className="font-display font-bold text-sm text-zinc-950">Itens do Pedido</h4>
                <div className="divide-y divide-zinc-100 text-xs">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-zinc-900">{item.name}</span>
                        <span className="text-zinc-500 font-mono ml-2">
                          ({item.quantity}x {formatBRL(item.unit_price)})
                        </span>
                      </div>
                      <span className="font-mono font-bold text-zinc-950">
                        {formatBRL(item.quantity * item.unit_price)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-zinc-200 space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatBRL(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Frete:</span>
                    <span className="font-mono">
                      {selectedOrder.shipping === 0 ? 'Grátis' : formatBRL(selectedOrder.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-200 font-bold text-sm text-zinc-950">
                    <span>Total:</span>
                    <span className="font-mono">{formatBRL(selectedOrder.total)}</span>
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
