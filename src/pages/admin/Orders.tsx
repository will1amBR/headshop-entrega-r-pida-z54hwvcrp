import React, { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Filter, MessageCircle, Eye, RefreshCw, X } from 'lucide-react'
import { Order, OrderStatus } from '@/types/ecommerce'
import { getOrders, updateOrderStatus } from '@/services/orders'
import { formatBRL, formatDateTime } from '@/lib/formatters'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [search, setSearch] = useState<string>('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getOrders()
      setOrders(data)

      const urlId = searchParams.get('id')
      if (urlId) {
        const found = data.find((o) => o.id === urlId)
        if (found) setSelectedOrder(found)
      }
    } catch (e) {
      console.error('Erro ao buscar pedidos', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Real-time synchronization
  useRealtime('orders', () => {
    getOrders().then((updated) => {
      setOrders(updated)
      if (selectedOrder) {
        const fresh = updated.find((o) => o.id === selectedOrder.id)
        if (fresh) setSelectedOrder(fresh)
      }
    })
  })

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return
    setIsUpdatingStatus(true)
    try {
      const updated = await updateOrderStatus(selectedOrder.id, newStatus)
      setSelectedOrder(updated)
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    } catch (err) {
      console.error('Erro ao atualizar status do pedido', err)
      alert('Falha ao atualizar o status do pedido.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.phone?.includes(search) ||
        o.id?.includes(search)
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
      {/* Top title and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
            Atendimento & Logística
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
            Gestão de Pedidos (Lista)
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-zinc-300 hover:border-black text-xs gap-1.5"
          >
            <Link to="/admin/kanban">
              <span>Quadro Kanban</span>
              <span className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded font-mono">D&D</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-zinc-300 gap-1.5 text-xs self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar Lista
          </Button>
        </div>
      </div>
      {/* Filter toolbar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Buscar por cliente, tel ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm bg-zinc-50 border-zinc-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className="text-xs font-medium text-zinc-600 whitespace-nowrap">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 text-xs bg-zinc-50 border-zinc-200">
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

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 text-zinc-600 font-mono uppercase border-b border-zinc-200">
              <tr>
                <th className="py-3.5 px-4">ID Pedido</th>
                <th className="py-3.5 px-4">Data/Hora</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">WhatsApp</th>
                <th className="py-3.5 px-4">Região / UF</th>
                <th className="py-3.5 px-4">Itens</th>
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
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => openOrderDetail(order)}
                    className="hover:bg-zinc-50/90 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                      #{order.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-500 whitespace-nowrap">
                      {formatDateTime(order.created)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-zinc-900">
                      {order.customer_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-600">{order.phone}</td>
                    <td className="py-3.5 px-4 text-zinc-600">
                      {order.region} ({order.state})
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-600">
                      {order.items?.length || 0} produtos
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-950">
                      {formatBRL(order.total)}
                    </td>
                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openOrderDetail(order)}
                        className="h-7 text-[11px] px-2.5"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Detalhes
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Dialog Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && closeOrderDetail()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="font-display font-bold text-xl">
                    Detalhes do Pedido #{selectedOrder.id}
                  </DialogTitle>
                  <OrderStatusBadge status={selectedOrder.status} />
                </div>
                <DialogDescription className="text-xs font-mono text-zinc-500">
                  Criado em: {formatDateTime(selectedOrder.created)}
                </DialogDescription>
              </DialogHeader>

              {/* Status Selector */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                <label className="text-xs font-semibold text-zinc-700 block">
                  Alterar Status do Pedido:
                </label>
                <div className="flex items-center gap-3">
                  <Select
                    value={selectedOrder.status}
                    disabled={isUpdatingStatus}
                    onValueChange={(val) => handleStatusChange(val as OrderStatus)}
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

                  {/* Customer WhatsApp direct chat button */}
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

              {/* Delivery info */}
              <div className="border border-zinc-200 rounded-xl p-4 space-y-3">
                <h4 className="font-display font-bold text-sm text-zinc-950">
                  Dados de Entrega do Cliente
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Nome:</span>
                    <strong className="text-zinc-900">{selectedOrder.customer_name}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">WhatsApp / Telefone:</span>
                    <strong className="text-zinc-900 font-mono">{selectedOrder.phone}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Endereço:</span>
                    <strong className="text-zinc-900">{selectedOrder.address}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Cidade / Estado / CEP:</span>
                    <strong className="text-zinc-900">
                      {selectedOrder.city} - {selectedOrder.state}{' '}
                      {selectedOrder.cep ? `(CEP: ${selectedOrder.cep})` : ''}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Região de Frete:</span>
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
                <h4 className="font-display font-bold text-sm text-zinc-950">Itens Solicitados</h4>
                <div className="divide-y divide-zinc-100 text-xs">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between items-center">
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

                {/* Totals */}
                <div className="pt-3 border-t border-zinc-200 space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatBRL(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Frete ({selectedOrder.region}):</span>
                    <span className="font-mono">
                      {selectedOrder.shipping === 0 ? 'Grátis' : formatBRL(selectedOrder.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-200 font-bold text-sm text-zinc-950">
                    <span>Total do Pedido:</span>
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
