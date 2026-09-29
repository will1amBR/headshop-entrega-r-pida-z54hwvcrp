import React, { useEffect, useState, useMemo } from 'react'
import {
  DollarSign,
  QrCode,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { Payment, PaymentStatus } from '@/types/ecommerce'
import { getPayments, markPaymentAsPaid, updatePaymentStatus } from '@/services/payments'
import { formatBRL, formatDateTime } from '@/lib/formatters'
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
import { useRealtime } from '@/hooks/use-realtime'

export default function AdminFinanceiro() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [methodFilter, setMethodFilter] = useState<string>('todos')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getPayments()
      setPayments(data)
    } catch (e) {
      console.error('Erro ao carregar pagamentos:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('payments', () => {
    getPayments().then(setPayments)
  })

  // KPIs
  const kpis = useMemo(() => {
    let receitaPix = 0
    let receitaCartao = 0
    let pendente = 0

    payments.forEach((p) => {
      const amt = Number(p.amount) || 0
      if (p.status === 'pago') {
        if (p.method === 'pix') {
          receitaPix += amt
        } else if (p.method === 'cartao') {
          receitaCartao += amt
        }
      } else if (p.status === 'pendente') {
        pendente += amt
      }
    })

    return {
      totalPago: receitaPix + receitaCartao,
      receitaPix,
      receitaCartao,
      pendente,
    }
  }, [payments])

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        p.txid?.toLowerCase().includes(search.toLowerCase()) ||
        p.order?.toLowerCase().includes(search.toLowerCase()) ||
        p.expand?.order?.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.expand?.order?.phone?.includes(search)

      const matchStatus = statusFilter === 'todos' ? true : p.status === statusFilter
      const matchMethod = methodFilter === 'todos' ? true : p.method === methodFilter

      return matchSearch && matchStatus && matchMethod
    })
  }, [payments, search, statusFilter, methodFilter])

  const handleConciliate = async (paymentId: string) => {
    if (!window.confirm('Deseja marcar esta cobrança como PAGA (Conciliação Manual)?')) {
      return
    }

    setUpdatingId(paymentId)
    try {
      await markPaymentAsPaid(paymentId)
      await loadData()
    } catch (e) {
      console.error('Erro ao conciliar pagamento:', e)
      alert('Falha ao conciliar pagamento.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCancelPayment = async (paymentId: string) => {
    if (!window.confirm('Deseja cancelar esta cobrança?')) return
    setUpdatingId(paymentId)
    try {
      await updatePaymentStatus(paymentId, 'cancelado')
      await loadData()
    } catch (e) {
      console.error('Erro ao cancelar:', e)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Gateway Mercado Pago & Conciliação
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
            Gestão Financeira & Cobranças
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Acompanhe pagamentos via Pix, cartão e concilie entradas manuais ou automáticas.
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Total Liquidada */}
        <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Liquidado</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl sm:text-3xl text-zinc-950">
            {formatBRL(kpis.totalPago)}
          </div>
          <p className="text-xs text-zinc-500">Pix + Cartão aprovados</p>
        </div>

        {/* Receita via Pix */}
        <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Receita via Pix</span>
            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-700">
              <QrCode className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl sm:text-3xl text-emerald-600">
            {formatBRL(kpis.receitaPix)}
          </div>
          <p className="text-xs text-zinc-500">Liquidação instantânea</p>
        </div>

        {/* Receita via Cartão */}
        <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Receita no Cartão
            </span>
            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-700">
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl sm:text-3xl text-zinc-950">
            {formatBRL(kpis.receitaCartao)}
          </div>
          <p className="text-xs text-zinc-500">Crédito processado</p>
        </div>

        {/* Pendente de Pagamento */}
        <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Aguardando Pagamento
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl sm:text-3xl text-amber-600">
            {formatBRL(kpis.pendente)}
          </div>
          <p className="text-xs text-zinc-500">Cobranças geradas em aberto</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Buscar por TXID, pedido ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm bg-zinc-50 border-zinc-200"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-600 whitespace-nowrap">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 text-xs bg-zinc-50 border-zinc-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="expirado">Expirado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-600 whitespace-nowrap">Método:</span>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-32 text-xs bg-zinc-50 border-zinc-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 text-zinc-600 font-mono uppercase border-b border-zinc-200">
              <tr>
                <th className="py-3 px-4">TXID / Identificador</th>
                <th className="py-3 px-4">Pedido / Cliente</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Data Criação</th>
                <th className="py-3 px-4">Data Pagamento</th>
                <th className="py-3 px-4 text-right">Conciliação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    Nenhum pagamento encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900">
                        {p.txid || `#${p.id.slice(-6).toUpperCase()}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-900">
                          {p.expand?.order?.customer_name || 'Pedido Direto'}
                        </div>
                        <span className="text-[11px] font-mono text-zinc-500">
                          #{p.order?.slice(-6).toUpperCase()} • {p.expand?.order?.phone || '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {p.method === 'pix' ? (
                          <span className="inline-flex items-center gap-1 font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <QrCode className="w-3 h-3" /> Pix
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            <CreditCard className="w-3 h-3" /> Cartão
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-950">
                        {formatBRL(p.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.status === 'pago' ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-mono text-[10px] uppercase">
                            Pago
                          </Badge>
                        ) : p.status === 'pendente' ? (
                          <Badge className="bg-amber-500 hover:bg-amber-500 text-white font-mono text-[10px] uppercase">
                            Pendente
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="font-mono text-[10px] uppercase">
                            {p.status}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-500 whitespace-nowrap">
                        {formatDateTime(p.created)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-500 whitespace-nowrap">
                        {p.paid_at ? formatDateTime(p.paid_at) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {p.status === 'pendente' && (
                          <>
                            <Button
                              size="sm"
                              disabled={updatingId === p.id}
                              onClick={() => handleConciliate(p.id)}
                              className="h-7 text-[11px] px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Marcar Pago
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={updatingId === p.id}
                              onClick={() => handleCancelPayment(p.id)}
                              className="h-7 text-[11px] px-2 text-red-600 hover:bg-red-50 border-red-200"
                            >
                              Cancelar
                            </Button>
                          </>
                        )}
                        {p.status === 'pago' && (
                          <span className="text-emerald-700 font-semibold text-[11px] inline-flex items-center gap-1 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Conciliado
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
