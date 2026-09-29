import React, { useEffect, useState, useMemo } from 'react'
import {
  Users,
  Search,
  MessageCircle,
  Eye,
  RefreshCw,
  ShoppingBag,
  DollarSign,
  Calendar,
  MapPin,
  TrendingUp,
  Award,
  ArrowUpDown,
} from 'lucide-react'
import { Order, CustomerProfile } from '@/types/ecommerce'
import { getOrders } from '@/services/orders'
import { buildCustomerProfilesFromOrders } from '@/services/crm'
import { formatBRL, formatDateTime, formatDate } from '@/lib/formatters'
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

type SortField = 'totalSpent' | 'ordersCount' | 'lastOrderDate' | 'name'

export default function AdminCRM() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('todas')
  const [sortBy, setSortBy] = useState<SortField>('totalSpent')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getOrders()
      setOrders(data)
    } catch (e) {
      console.error('Erro ao buscar pedidos no CRM', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('orders', () => {
    getOrders().then((updated) => {
      setOrders(updated)
      if (selectedCustomer) {
        const freshProfiles = buildCustomerProfilesFromOrders(updated)
        const fresh = freshProfiles.find((p) => p.id === selectedCustomer.id)
        if (fresh) setSelectedCustomer(fresh)
      }
    })
  })

  // Perfis agregados
  const customerProfiles = useMemo(() => {
    return buildCustomerProfilesFromOrders(orders)
  }, [orders])

  // Filtragem e ordenação
  const filteredProfiles = useMemo(() => {
    return customerProfiles
      .filter((p) => {
        const term = search.toLowerCase()
        const matchesSearch =
          p.name.toLowerCase().includes(term) ||
          p.phone.includes(term) ||
          p.email?.toLowerCase().includes(term) ||
          p.city.toLowerCase().includes(term)

        const matchesRegion = regionFilter === 'todas' || p.region === regionFilter

        return matchesSearch && matchesRegion
      })
      .sort((a, b) => {
        if (sortBy === 'totalSpent') return b.totalSpent - a.totalSpent
        if (sortBy === 'ordersCount') return b.ordersCount - a.ordersCount
        if (sortBy === 'lastOrderDate')
          return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        return 0
      })
  }, [customerProfiles, search, regionFilter, sortBy])

  // Métricas de CRM consolidadas
  const totalCustomers = customerProfiles.length
  const recurringCustomers = customerProfiles.filter((p) => p.ordersCount > 1).length
  const recurringRate = totalCustomers > 0 ? (recurringCustomers / totalCustomers) * 100 : 0
  const avgCustomerLtv =
    totalCustomers > 0
      ? customerProfiles.reduce((sum, p) => sum + p.totalSpent, 0) / totalCustomers
      : 0

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-zinc-800" />
            Gestão de Relacionamento (CRM)
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
            Base de Clientes
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Perfis gerados a partir do histórico de pedidos, LTV, frequência e canal direto de
            WhatsApp.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          className="border-zinc-300 gap-1.5 text-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar Clientes
        </Button>
      </div>

      {/* KPI Cards CRM */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-1">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Total de Clientes Únicos
          </span>
          <div className="font-mono font-extrabold text-3xl text-zinc-950">
            {isLoading ? '...' : totalCustomers}
          </div>
          <p className="text-xs text-zinc-400">Identificados por número de WhatsApp</p>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-1">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Clientes Recorrentes (2+ Pedidos)
          </span>
          <div className="font-mono font-extrabold text-3xl text-emerald-600">
            {isLoading ? '...' : `${recurringCustomers} (${recurringRate.toFixed(0)}%)`}
          </div>
          <p className="text-xs text-zinc-400">Fidelização e recompra no catálogo</p>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-1">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            LTV Médio por Cliente
          </span>
          <div className="font-mono font-extrabold text-3xl text-zinc-950">
            {isLoading ? '...' : formatBRL(avgCustomerLtv)}
          </div>
          <p className="text-xs text-zinc-400">Valor total gasto médio por perfil</p>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Buscar por nome, WhatsApp ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm bg-zinc-50 border-zinc-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Região */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-600">Região:</span>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-36 text-xs bg-zinc-50 border-zinc-200 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Regiões</SelectItem>
                <SelectItem value="Sudeste">Sudeste</SelectItem>
                <SelectItem value="Sul">Sul</SelectItem>
                <SelectItem value="Centro-Oeste">Centro-Oeste</SelectItem>
                <SelectItem value="Nordeste">Nordeste</SelectItem>
                <SelectItem value="Norte">Norte</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ordenação */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-600">Ordenar por:</span>
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortField)}>
              <SelectTrigger className="w-44 text-xs bg-zinc-50 border-zinc-200 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totalSpent">Maior Total Gasto (LTV)</SelectItem>
                <SelectItem value="ordersCount">Mais Pedidos</SelectItem>
                <SelectItem value="lastOrderDate">Último Pedido Mais Recente</SelectItem>
                <SelectItem value="name">Nome (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 text-zinc-600 font-mono uppercase border-b border-zinc-200">
              <tr>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">WhatsApp</th>
                <th className="py-3.5 px-4">Localização</th>
                <th className="py-3.5 px-4 text-center">Nº Pedidos</th>
                <th className="py-3.5 px-4">Total Gasto (LTV)</th>
                <th className="py-3.5 px-4">Ticket Médio</th>
                <th className="py-3.5 px-4">Último Pedido</th>
                <th className="py-3.5 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    Nenhum cliente encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className="hover:bg-zinc-50/90 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-zinc-950">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 font-bold flex items-center justify-center text-[11px] shrink-0">
                          {customer.name.slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{customer.name}</div>
                          {customer.email && (
                            <div className="text-[10px] text-zinc-400 font-mono truncate">
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-zinc-700 whitespace-nowrap">
                      {customer.phone}
                    </td>

                    <td className="py-3.5 px-4 text-zinc-600 whitespace-nowrap">
                      {customer.city ? `${customer.city}/${customer.state}` : customer.region}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={customer.ordersCount > 1 ? 'default' : 'secondary'}
                        className={`font-mono text-[11px] ${
                          customer.ordersCount > 1
                            ? 'bg-zinc-950 text-white'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {customer.ordersCount} {customer.ordersCount > 1 ? 'pedidos' : 'pedido'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-950 whitespace-nowrap">
                      {formatBRL(customer.totalSpent)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-zinc-700 whitespace-nowrap">
                      {formatBRL(customer.averageTicket)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-zinc-500 whitespace-nowrap">
                      {formatDate(customer.lastOrderDate)}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={buildWhatsAppUrl(
                            customer.phone,
                            `Olá ${customer.name}! Sou da equipe da HeadShop Entrega Rápida. Tudo bem?`,
                          )}
                          target="_blank"
                          rel="noreferrer"
                          title="Abrir WhatsApp com o cliente"
                          className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-current" />
                        </a>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCustomer(customer)}
                          className="h-7 text-[11px] px-2.5"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Perfil
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal with Order History */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedCustomer && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-950 text-white font-bold flex items-center justify-center text-sm">
                      {selectedCustomer.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <DialogTitle className="font-display font-bold text-xl">
                        {selectedCustomer.name}
                      </DialogTitle>
                      <DialogDescription className="text-xs font-mono text-zinc-500">
                        Cliente desde {formatDate(selectedCustomer.firstOrderDate)}
                      </DialogDescription>
                    </div>
                  </div>

                  <a
                    href={buildWhatsAppUrl(
                      selectedCustomer.phone,
                      `Olá ${selectedCustomer.name}! Estou entrando em contato da HeadShop Entrega Rápida para saber como foram suas últimas experiências de compra.`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg font-semibold text-xs bg-[#25D366] hover:bg-[#1EBE5A] text-white shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    Conversar no WhatsApp
                  </a>
                </div>
              </DialogHeader>

              {/* CRM Key Metrics for this client */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-center">
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                    Total Gasto (LTV)
                  </span>
                  <strong className="font-mono text-base font-bold text-zinc-950">
                    {formatBRL(selectedCustomer.totalSpent)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                    Pedidos Feitos
                  </span>
                  <strong className="font-mono text-base font-bold text-zinc-950">
                    {selectedCustomer.ordersCount}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                    Ticket Médio
                  </span>
                  <strong className="font-mono text-base font-bold text-zinc-950">
                    {formatBRL(selectedCustomer.averageTicket)}
                  </strong>
                </div>
              </div>

              {/* Customer Contact details */}
              <div className="p-4 border border-zinc-200 rounded-xl space-y-2 text-xs">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-zinc-400">
                  Dados Cadastrais
                </h4>
                <div className="grid grid-cols-2 gap-2 text-zinc-700">
                  <div>
                    <span className="text-zinc-400">Telefone:</span>{' '}
                    <strong className="font-mono text-zinc-900">{selectedCustomer.phone}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400">E-mail:</span>{' '}
                    <strong className="text-zinc-900">
                      {selectedCustomer.email || 'Não cadastrado'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-400">Cidade / UF:</span>{' '}
                    <strong className="text-zinc-900">
                      {selectedCustomer.city} - {selectedCustomer.state}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-400">Região de Frete:</span>{' '}
                    <strong className="text-zinc-900">{selectedCustomer.region}</strong>
                  </div>
                </div>
              </div>

              {/* Order History Timeline */}
              <div className="space-y-3">
                <h4 className="font-display font-bold text-sm text-zinc-950 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-zinc-500" />
                  Histórico de Pedidos ({selectedCustomer.orders.length})
                </h4>

                <div className="space-y-3">
                  {selectedCustomer.orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-3.5 border border-zinc-200 rounded-xl bg-white space-y-2 text-xs shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-zinc-900">
                            #{order.id.slice(-6).toUpperCase()}
                          </span>
                          <span className="text-zinc-400 font-mono">
                            {formatDateTime(order.created)}
                          </span>
                        </div>
                        <OrderStatusBadge status={order.status} />
                      </div>

                      <div className="text-zinc-600 bg-zinc-50 p-2 rounded-md space-y-1">
                        {order.items?.map((it, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>
                              {it.quantity}x {it.name}
                            </span>
                            <span className="font-mono font-semibold">
                              {formatBRL(it.quantity * it.unit_price)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-1 font-bold">
                        <span className="text-zinc-500 font-normal">
                          Frete: {order.shipping === 0 ? 'Grátis' : formatBRL(order.shipping)}
                        </span>
                        <span className="font-mono text-zinc-950">
                          Total: {formatBRL(order.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
