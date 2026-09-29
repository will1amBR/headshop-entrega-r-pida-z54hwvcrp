import React, { useEffect, useState, useMemo } from 'react'
import {
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Send,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Clock,
  Package,
} from 'lucide-react'
import { Product, Supplier, PurchaseOrder, PurchaseOrderStatus } from '@/types/ecommerce'
import { getAllProductsAdmin } from '@/services/products'
import {
  getSuppliers,
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  calculateRecompraSuggestions,
  RecompraSuggestion,
} from '@/services/suppliers'
import { formatBRL, formatDateTime } from '@/lib/formatters'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRealtime } from '@/hooks/use-realtime'

export default function AdminRecompras() {
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Ações de criação de recompra rápida
  const [selectedSupplierForCreation, setSelectedSupplierForCreation] = useState<string>('')
  const [isCreatingPO, setIsCreatingPO] = useState(false)
  const [updatingPoId, setUpdatingPoId] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [prods, sups, pos] = await Promise.all([
        getAllProductsAdmin(),
        getSuppliers(),
        getPurchaseOrders(),
      ])
      setProducts(prods)
      setSuppliers(sups)
      setPurchaseOrders(pos)
      if (sups.length > 0) {
        setSelectedSupplierForCreation(sups[0].id)
      }
    } catch (e) {
      console.error('Erro ao carregar dados de recompras:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('products', () => {
    getAllProductsAdmin().then(setProducts)
  })
  useRealtime('purchase_orders', () => {
    getPurchaseOrders().then(setPurchaseOrders)
  })

  // Sugestões calculadas automaticamente: produtos com stock < min_stock
  const suggestions = useMemo(() => {
    return calculateRecompraSuggestions(products)
  }, [products])

  const totalSugestaoCusto = useMemo(() => {
    return suggestions.reduce((sum, s) => sum + s.estimatedSubtotal, 0)
  }, [suggestions])

  // Gerar pedido de recompra com todos os itens sugeridos em 1 clique
  const handleCreateBatchPO = async () => {
    if (suggestions.length === 0) {
      alert('Não há itens abaixo do estoque mínimo no momento!')
      return
    }

    if (!selectedSupplierForCreation) {
      alert('Selecione um fornecedor para destinar o pedido de recompra.')
      return
    }

    const sup = suppliers.find((s) => s.id === selectedSupplierForCreation)
    const confirmed = window.confirm(
      `Deseja gerar um pedido de recompra de ${suggestions.length} itens para "${sup?.name || 'Fornecedor'}" no valor estimado de ${formatBRL(totalSugestaoCusto)}?`,
    )
    if (!confirmed) return

    setIsCreatingPO(true)
    try {
      const items = suggestions.map((s) => ({
        product_id: s.product.id,
        name: s.product.name,
        quantity: s.suggestedQty,
        unit_cost: s.estimatedUnitCost,
        subtotal: s.estimatedSubtotal,
      }))

      await createPurchaseOrder({
        supplier: selectedSupplierForCreation,
        items,
        status: 'rascunho',
        total: totalSugestaoCusto,
        notes: `Pedido gerado automaticamente pela inteligência de estoque mínimo (regra: min_stock x 2 menos saldo atual).`,
      })

      await loadData()
      alert('Pedido de recompra criado com sucesso! Agora você pode enviá-lo ao fornecedor.')
    } catch (e) {
      console.error('Erro ao criar pedido de recompra:', e)
      alert('Falha ao gerar recompra.')
    } finally {
      setIsCreatingPO(false)
    }
  }

  // Atualizar status do pedido de recompra (ex: marcar como recebido -> dá entrada no estoque)
  const handleStatusChange = async (poId: string, status: PurchaseOrderStatus) => {
    setUpdatingPoId(poId)
    try {
      if (status === 'recebido') {
        const confirmReceive = window.confirm(
          'Marcar como RECEBIDO? Isso dará entrada automática nas quantidades deste pedido no estoque de cada produto.',
        )
        if (!confirmReceive) {
          setUpdatingPoId(null)
          return
        }
      }

      await updatePurchaseOrderStatus(poId, status)
      await loadData()
    } catch (e) {
      console.error('Erro ao atualizar status do pedido de recompra:', e)
      alert('Falha ao atualizar status.')
    } finally {
      setUpdatingPoId(null)
    }
  }

  // Gerar link de WhatsApp para enviar pedido de cotação formatado ao fornecedor
  const getSupplierWhatsAppUrl = (po: PurchaseOrder) => {
    const sup = po.expand?.supplier || suppliers.find((s) => s.id === po.supplier)
    const phone = sup?.phone || '5548992463428'

    let msg = `*PEDIDO DE RECOMPRA #${po.id.slice(-6).toUpperCase()}*\n`
    msg += `Fornecedor: ${sup?.name || 'Fornecedor'}\n`
    msg += `Data: ${new Date(po.created).toLocaleDateString('pt-BR')}\n\n`
    msg += `*ITENS SOLICITADOS:*\n`

    po.items?.forEach((it, idx) => {
      msg += `${idx + 1}. ${it.name} - ${it.quantity} un. (Custo est.: ${formatBRL(it.unit_cost)})\n`
    })

    msg += `\n*Total Estimado: ${formatBRL(po.total)}*\n\n`
    msg += `Por favor, confirme a disponibilidade e prazo de despacho para a HeadShop Entrega Rápida.`

    return buildWhatsAppUrl(phone, msg)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-zinc-700" />
            Inteligência de Reposição & Suprimentos
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
            Recompras com Fornecedores
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Sugestões automáticas ao atingir o estoque mínimo e geração de pedidos de compra
            integrados.
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

      {/* Bloco de Sugestão Automática de Recompra */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-red-50 text-red-700">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h2 className="font-display font-bold text-lg text-zinc-950">
                Sugestões Automáticas por Baixa de Estoque ({suggestions.length} produtos)
              </h2>
            </div>
            <p className="text-xs text-zinc-500">
              Regra aplicada: <code>Quantidade Sugerida = (Estoque Mínimo × 2) - Saldo Atual</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-600">Fornecedor:</span>
              <Select
                value={selectedSupplierForCreation}
                onValueChange={setSelectedSupplierForCreation}
              >
                <SelectTrigger className="w-56 text-xs bg-zinc-50 border-zinc-300">
                  <SelectValue placeholder="Selecione o fornecedor..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              disabled={isCreatingPO || suggestions.length === 0}
              onClick={handleCreateBatchPO}
              className="bg-[#0A0A0A] hover:bg-zinc-800 text-white font-medium text-xs gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Gerar Pedido de Recompra ({suggestions.length} itens)
            </Button>
          </div>
        </div>

        {/* Tabela de Sugestões */}
        {suggestions.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            Nenhum produto está abaixo do estoque mínimo configurado. Estoque em níveis saudáveis!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 text-zinc-600 font-mono uppercase border-b border-zinc-200">
                <tr>
                  <th className="py-2.5 px-4">Produto</th>
                  <th className="py-2.5 px-4">Saldo Atual</th>
                  <th className="py-2.5 px-4">Estoque Mínimo</th>
                  <th className="py-2.5 px-4">Qtd. Sugerida</th>
                  <th className="py-2.5 px-4">Custo Unitário Estimado</th>
                  <th className="py-2.5 px-4 text-right">Subtotal Estimado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {suggestions.map((s) => (
                  <tr key={s.product.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-900 max-w-xs truncate">
                      {s.product.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-red-600">
                      {s.currentStock} un.
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-500">{s.minStock} un.</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      +{s.suggestedQty} un.
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-700">
                      {formatBRL(s.estimatedUnitCost)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-zinc-950 text-right">
                      {formatBRL(s.estimatedSubtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-zinc-50 border-t border-zinc-200 font-semibold text-xs">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-zinc-700 text-right">
                    Total Estimado do Lote de Reposição:
                  </td>
                  <td className="py-3 px-4 font-mono font-extrabold text-sm text-zinc-950 text-right">
                    {formatBRL(totalSugestaoCusto)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Histórico de Pedidos de Recompra */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="font-display font-bold text-lg text-zinc-950">
            Pedidos de Recompra Emitidos
          </h2>
          <p className="text-xs text-zinc-500">
            Acompanhe status com os fornecedores e envie pedidos formatados por WhatsApp.
          </p>
        </div>

        {purchaseOrders.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            Nenhum pedido de recompra gerado ainda.
          </div>
        ) : (
          <div className="space-y-4">
            {purchaseOrders.map((po) => {
              const sup = po.expand?.supplier || suppliers.find((s) => s.id === po.supplier)

              return (
                <div
                  key={po.id}
                  className="p-5 border border-zinc-200 rounded-xl space-y-4 hover:border-zinc-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-zinc-950">
                          Recompra #{po.id.slice(-6).toUpperCase()}
                        </span>
                        <PurchaseOrderStatusBadge status={po.status} />
                      </div>
                      <span className="text-xs text-zinc-500 block">
                        Fornecedor: <strong>{sup?.name || 'Fornecedor'}</strong> (
                        {sup?.phone || 'Sem telefone'}) • Emitido em: {formatDateTime(po.created)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Botão Enviar por WhatsApp */}
                      <a
                        href={getSupplierWhatsAppUrl(po)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-[#25D366] hover:bg-[#1EBE5A] text-white transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-current" />
                        Enviar no WhatsApp
                      </a>

                      {/* Ações de Status */}
                      <Select
                        value={po.status}
                        disabled={updatingPoId === po.id}
                        onValueChange={(val) =>
                          handleStatusChange(po.id, val as PurchaseOrderStatus)
                        }
                      >
                        <SelectTrigger className="w-36 h-8 text-xs bg-white border-zinc-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rascunho">Rascunho</SelectItem>
                          <SelectItem value="enviado">Enviado</SelectItem>
                          <SelectItem value="confirmado">Confirmado</SelectItem>
                          <SelectItem value="recebido">Recebido (Baixa)</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Itens do pedido de recompra */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {po.items?.map((it, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg flex justify-between items-center"
                      >
                        <div className="truncate pr-2">
                          <span className="font-semibold text-zinc-900 block truncate">
                            {it.name}
                          </span>
                          <span className="text-zinc-500 font-mono text-[11px]">
                            {it.quantity} un. × {formatBRL(it.unit_cost)}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-zinc-900 shrink-0">
                          {formatBRL(it.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-between items-center text-xs text-zinc-600">
                    <span className="italic">{po.notes || 'Sem observações adicionais.'}</span>
                    <span className="font-mono font-extrabold text-sm text-zinc-950">
                      Total: {formatBRL(po.total)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function PurchaseOrderStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'rascunho':
      return (
        <Badge variant="secondary" className="font-mono text-[10px] uppercase">
          Rascunho
        </Badge>
      )
    case 'enviado':
      return (
        <Badge className="bg-blue-600 text-white font-mono text-[10px] uppercase">Enviado</Badge>
      )
    case 'confirmado':
      return (
        <Badge className="bg-amber-600 text-white font-mono text-[10px] uppercase">
          Confirmado
        </Badge>
      )
    case 'recebido':
      return (
        <Badge className="bg-emerald-600 text-white font-mono text-[10px] uppercase">
          Recebido (Estoque Atualizado)
        </Badge>
      )
    case 'cancelado':
      return (
        <Badge variant="destructive" className="font-mono text-[10px] uppercase">
          Cancelado
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}
