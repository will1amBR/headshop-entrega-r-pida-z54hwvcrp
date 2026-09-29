import React, { useEffect, useState, useMemo } from 'react'
import {
  Boxes,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  DollarSign,
  PackageCheck,
  TrendingDown,
} from 'lucide-react'
import { Product, StockMovement, Category, Supplier } from '@/types/ecommerce'
import { getAllProductsAdmin } from '@/services/products'
import { getCategories } from '@/services/categories'
import { getSuppliers } from '@/services/suppliers'
import { getStockMovements, registerStockMovement } from '@/services/stock'
import { formatBRL, formatDateTime } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

export default function AdminEstoque() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filtros
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todos')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  // Modal Registrar Entrada
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false)
  const [entryProductId, setEntryProductId] = useState('')
  const [entryQuantity, setEntryQuantity] = useState<number | string>(10)
  const [entryReason, setEntryReason] = useState('Recebimento de Mercadorias / Compra')
  const [entrySupplierId, setEntrySupplierId] = useState('')
  const [isSavingEntry, setIsSavingEntry] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [prods, cats, sups, movs] = await Promise.all([
        getAllProductsAdmin(),
        getCategories(),
        getSuppliers(),
        getStockMovements(),
      ])
      setProducts(prods)
      setCategories(cats)
      setSuppliers(sups)
      setMovements(movs)
    } catch (e) {
      console.error('Erro ao buscar dados de estoque:', e)
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
  useRealtime('stock_movements', () => {
    getStockMovements().then(setMovements)
  })

  // KPIs
  const kpis = useMemo(() => {
    let abaixoDoMinimo = 0
    let valorCustoTotal = 0

    products.forEach((p) => {
      const st = Number(p.stock) || 0
      const min = Number(p.min_stock) || 10
      const cost = Number(p.cost_price) || (p.price ? p.price * 0.4 : 0)

      if (st < min) {
        abaixoDoMinimo++
      }
      valorCustoTotal += st * cost
    })

    return {
      totalItens: products.length,
      abaixoDoMinimo,
      valorCustoTotal,
      totalMovements: movements.length,
    }
  }, [products, movements])

  // Produtos filtrados
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.ncm?.toLowerCase().includes(search.toLowerCase())

      const matchCategory = categoryFilter === 'todos' ? true : p.category === categoryFilter

      const min = p.min_stock ?? 10
      const stock = p.stock ?? 0
      const matchLowStock = lowStockOnly ? stock < min : true

      return matchSearch && matchCategory && matchLowStock
    })
  }, [products, search, categoryFilter, lowStockOnly])

  const handleOpenEntryModal = (productId?: string) => {
    if (productId) {
      setEntryProductId(productId)
    } else if (products.length > 0) {
      setEntryProductId(products[0].id)
    }
    setEntryQuantity(10)
    setEntryReason('Recebimento de Mercadorias / Compra')
    setEntrySupplierId(suppliers[0]?.id || '')
    setIsEntryModalOpen(true)
  }

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entryProductId || !entryQuantity || Number(entryQuantity) <= 0) {
      alert('Informe um produto válido e a quantidade.')
      return
    }

    setIsSavingEntry(true)
    try {
      await registerStockMovement({
        product: entryProductId,
        type: 'entrada',
        quantity: Number(entryQuantity),
        reason: entryReason.trim(),
        supplier: entrySupplierId || undefined,
      })

      setIsEntryModalOpen(false)
      await loadData()
    } catch (err) {
      console.error('Erro ao registrar entrada:', err)
      alert('Falha ao registrar entrada no estoque.')
    } finally {
      setIsSavingEntry(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
            <Boxes className="w-3.5 h-3.5 text-zinc-700" />
            Controle Físico & Financeiro
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
            Gestão de Estoque & Entradas
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Monitore níveis mínimos, valor em estoque a preço de custo e registre movimentações de
            entrada.
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

          <Button
            size="sm"
            onClick={() => handleOpenEntryModal()}
            className="bg-[#0A0A0A] hover:bg-zinc-800 text-white font-medium text-xs gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Registrar Nova Entrada
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Itens abaixo do mínimo */}
        <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Abaixo do Mínimo</span>
            <div
              className={`p-2 rounded-lg ${kpis.abaixoDoMinimo > 0 ? 'bg-red-50 text-red-700' : 'bg-zinc-100 text-zinc-600'}`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`font-mono font-bold text-2xl sm:text-3xl ${kpis.abaixoDoMinimo > 0 ? 'text-red-600' : 'text-zinc-950'}`}
          >
            {kpis.abaixoDoMinimo} itens
          </div>
          <p className="text-xs text-zinc-500">Produtos que necessitam reposição</p>
        </div>

        {/* Valor Total a Preço de Custo */}
        <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Valor em Estoque (Custo)
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl sm:text-3xl text-zinc-950">
            {formatBRL(kpis.valorCustoTotal)}
          </div>
          <p className="text-xs text-zinc-500">Patrimônio imobilizado em mercadorias</p>
        </div>

        {/* Total de Movimentações */}
        <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Movimentações Registradas
            </span>
            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-700">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl sm:text-3xl text-zinc-950">
            {kpis.totalMovements}
          </div>
          <p className="text-xs text-zinc-500">Histórico de entradas e saídas</p>
        </div>
      </div>

      <Tabs defaultValue="posicao" className="space-y-4">
        <TabsList className="bg-zinc-100 border border-zinc-200 p-1">
          <TabsTrigger value="posicao" className="text-xs">
            Posição Atual de Estoque
          </TabsTrigger>
          <TabsTrigger value="movimentacoes" className="text-xs">
            Histórico de Movimentações ({movements.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Posição de Estoque */}
        <TabsContent value="posicao" className="space-y-4">
          {/* Toolbar de busca e filtros */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                placeholder="Buscar por produto ou NCM..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs sm:text-sm bg-zinc-50 border-zinc-200"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-600">Categoria:</span>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40 text-xs bg-zinc-50 border-zinc-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 cursor-pointer bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-lg">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="rounded border-zinc-300 text-black focus:ring-black"
                />
                <span>Apenas abaixo do mínimo</span>
              </label>
            </div>
          </div>

          {/* Tabela de Produtos */}
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 text-zinc-600 font-mono uppercase border-b border-zinc-200">
                  <tr>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4">NCM</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Preço Custo</th>
                    <th className="py-3 px-4">Preço Venda</th>
                    <th className="py-3 px-4">Estoque Atual</th>
                    <th className="py-3 px-4">Mínimo</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-zinc-500">
                        Nenhum produto encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const stock = p.stock ?? 0
                      const min = p.min_stock ?? 10
                      const isLow = stock < min

                      return (
                        <tr key={p.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="py-3 px-4 font-semibold text-zinc-900 max-w-xs truncate">
                            {p.name}
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-600">{p.ncm || '—'}</td>
                          <td className="py-3 px-4 text-zinc-600">
                            {p.expand?.category?.name ||
                              categories.find((c) => c.id === p.category)?.name ||
                              '—'}
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-700">
                            {p.cost_price ? formatBRL(p.cost_price) : '—'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-zinc-950">
                            {formatBRL(p.price)}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold">
                            <span className={isLow ? 'text-red-600' : 'text-zinc-900'}>
                              {stock} un.
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-500">{min} un.</td>
                          <td className="py-3 px-4">
                            {isLow ? (
                              <Badge
                                variant="destructive"
                                className="font-mono text-[10px] uppercase gap-1"
                              >
                                <AlertTriangle className="w-3 h-3" /> Repor
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-mono text-[10px] uppercase">
                                Normal
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEntryModal(p.id)}
                              className="h-7 text-[11px] px-2.5 gap-1 border-zinc-300"
                            >
                              <Plus className="w-3 h-3" /> Entrada
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

        {/* Tab 2: Movimentações */}
        <TabsContent value="movimentacoes" className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 text-zinc-600 font-mono uppercase border-b border-zinc-200">
                  <tr>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4">Quantidade</th>
                    <th className="py-3 px-4">Motivo / Documento</th>
                    <th className="py-3 px-4">Fornecedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500">
                        Nenhuma movimentação de estoque registrada.
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-zinc-500 whitespace-nowrap">
                          {formatDateTime(m.movement_date || m.created)}
                        </td>
                        <td className="py-3 px-4">
                          {m.type === 'entrada' ? (
                            <span className="inline-flex items-center gap-1 font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <ArrowDownRight className="w-3 h-3 text-emerald-600" /> Entrada
                            </span>
                          ) : m.type === 'saida' ? (
                            <span className="inline-flex items-center gap-1 font-mono font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              <ArrowUpRight className="w-3 h-3 text-red-600" /> Saída
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-mono font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                              <RotateCcw className="w-3 h-3 text-zinc-600" /> Ajuste
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-zinc-900 max-w-xs truncate">
                          {m.expand?.product?.name || 'Produto ID: ' + m.product}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          {m.type === 'entrada' ? (
                            <span className="text-emerald-700">+{m.quantity} un.</span>
                          ) : m.type === 'saida' ? (
                            <span className="text-red-600">-{m.quantity} un.</span>
                          ) : (
                            <span>{m.quantity} un.</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-zinc-700">{m.reason}</td>
                        <td className="py-3 px-4 text-zinc-500">
                          {m.expand?.supplier?.name || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Registrar Entrada */}
      <Dialog open={isEntryModalOpen} onOpenChange={setIsEntryModalOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSaveEntry} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display font-bold text-xl">
                Registrar Entrada de Estoque
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 block">
                  Produto <span className="text-red-500">*</span>
                </label>
                <Select value={entryProductId} onValueChange={setEntryProductId}>
                  <SelectTrigger className="bg-white border-zinc-300">
                    <SelectValue placeholder="Selecione o produto..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} (Atual: {p.stock ?? 0} un.)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 block">
                    Quantidade de Entrada <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    type="number"
                    min="1"
                    value={entryQuantity}
                    onChange={(e) => setEntryQuantity(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 block">
                    Fornecedor (opcional)
                  </label>
                  <Select value={entrySupplierId} onValueChange={setEntrySupplierId}>
                    <SelectTrigger className="bg-white border-zinc-300">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhum">Nenhum / Próprio</SelectItem>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 block">
                  Motivo / Nota Fiscal / Observação <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Ex: Nota Fiscal 10928 / Fornecedor Higher HK"
                  value={entryReason}
                  onChange={(e) => setEntryReason(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEntryModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSavingEntry}
                className="bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-medium"
              >
                {isSavingEntry ? 'Salvando...' : 'Confirmar Entrada'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
