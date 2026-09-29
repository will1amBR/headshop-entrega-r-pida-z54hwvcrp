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
  Camera,
  FileText,
  CheckCircle2,
  XCircle,
  Upload,
  Eye,
  ShieldCheck,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react'
import {
  Product,
  StockMovement,
  Category,
  Supplier,
  StockEntry,
  StockEntryItem,
  VerificationStatus,
  DivergenceType,
} from '@/types/ecommerce'
import { getAllProductsAdmin } from '@/services/products'
import { getCategories } from '@/services/categories'
import { getSuppliers } from '@/services/suppliers'
import { getStockMovements, registerStockMovement } from '@/services/stock'
import {
  getStockEntries,
  parseInvoicePhoto,
  createStockEntry,
  updateStockEntry,
  finalizeStockEntry,
} from '@/services/stockEntries'
import { formatBRL, formatDateTime, getFileUrl } from '@/lib/formatters'
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
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filtros
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todos')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  // Modal Registrar Entrada Manual
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false)
  const [entryProductId, setEntryProductId] = useState('')
  const [entryQuantity, setEntryQuantity] = useState<number | string>(10)
  const [entryReason, setEntryReason] = useState('Recebimento de Mercadorias / Compra')
  const [entrySupplierId, setEntrySupplierId] = useState('')
  const [isSavingEntry, setIsSavingEntry] = useState(false)

  // Estado da Entrada por Foto (OCR / Assistido)
  const [isPhotoEntryModalOpen, setIsPhotoEntryModalOpen] = useState(false)
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false)
  const [selectedInvoiceFile, setSelectedInvoiceFile] = useState<File | null>(null)
  const [invoicePhotoPreview, setInvoicePhotoPreview] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<{
    invoice_number: string
    series: string
    access_key: string
    supplier_id: string
    supplier_name: string
    supplier_cnpj: string
    notes: string
    items: StockEntryItem[]
  }>({
    invoice_number: '',
    series: '1',
    access_key: '',
    supplier_id: '',
    supplier_name: '',
    supplier_cnpj: '',
    notes: '',
    items: [],
  })

  // Modal / Drawer de Conferência por Foto
  const [activeVerificationEntry, setActiveVerificationEntry] = useState<StockEntry | null>(null)
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false)
  const [verificationItems, setVerificationItems] = useState<StockEntryItem[]>([])
  const [isSavingVerification, setIsSavingVerification] = useState(false)
  const [newVerificationFiles, setNewVerificationFiles] = useState<{ [itemId: string]: File }>({})

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [prods, cats, sups, movs, entries] = await Promise.all([
        getAllProductsAdmin(),
        getCategories(),
        getSuppliers(),
        getStockMovements(),
        getStockEntries(),
      ])
      setProducts(prods)
      setCategories(cats)
      setSuppliers(sups)
      setMovements(movs)
      setStockEntries(entries)
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
  useRealtime('stock_entries', () => {
    getStockEntries().then(setStockEntries)
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

  // Abertura do modal de Entrada por Foto
  const handleOpenPhotoEntryModal = () => {
    setSelectedInvoiceFile(null)
    setInvoicePhotoPreview(null)
    setExtractedData({
      invoice_number: '',
      series: '1',
      access_key: '',
      supplier_id: suppliers[0]?.id || '',
      supplier_name: suppliers[0]?.name || '',
      supplier_cnpj: suppliers[0]?.cnpj || '',
      notes: 'Entrada via leitura de foto da nota fiscal',
      items: [],
    })
    setIsPhotoEntryModalOpen(true)
  }

  // Upload e leitura da foto da NF
  const handleInvoiceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedInvoiceFile(file)
    if (file.type.startsWith('image/')) {
      setInvoicePhotoPreview(URL.createObjectURL(file))
    } else {
      setInvoicePhotoPreview(null)
    }

    setIsProcessingPhoto(true)
    try {
      const res = await parseInvoicePhoto(file)
      if (res.data) {
        // Tenta associar cada item lido com um produto do catálogo por aproximação de nome/ncm
        const itemsWithProducts: StockEntryItem[] = (res.data.items || []).map((item, idx) => {
          const match = products.find(
            (p) =>
              p.name.toLowerCase().includes(item.description.toLowerCase()) ||
              item.description.toLowerCase().includes(p.name.toLowerCase()) ||
              (item.ncm && p.ncm && p.ncm.replace(/\D/g, '') === item.ncm.replace(/\D/g, '')),
          )

          return {
            id: `item-${Date.now()}-${idx}`,
            product_id: match ? match.id : undefined,
            description: item.description,
            ncm: item.ncm,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal || item.quantity * item.unit_price,
            verification_status: 'pendente',
            divergence_type: 'nenhuma',
          }
        })

        // Tenta achar fornecedor pelo nome ou cnpj
        const matchedSupplier = suppliers.find(
          (s) =>
            (res.data.supplier_cnpj &&
              s.cnpj &&
              s.cnpj.replace(/\D/g, '') === res.data.supplier_cnpj?.replace(/\D/g, '')) ||
            (res.data.supplier_name &&
              s.name.toLowerCase().includes(res.data.supplier_name.toLowerCase())),
        )

        setExtractedData((prev) => ({
          ...prev,
          invoice_number:
            res.data.invoice_number ||
            prev.invoice_number ||
            `NF-${Math.floor(10000 + Math.random() * 90000)}`,
          series: res.data.series || prev.series || '1',
          access_key: res.data.access_key || prev.access_key,
          supplier_id: matchedSupplier
            ? matchedSupplier.id
            : prev.supplier_id || suppliers[0]?.id || '',
          supplier_name: res.data.supplier_name || matchedSupplier?.name || prev.supplier_name,
          supplier_cnpj: res.data.supplier_cnpj || matchedSupplier?.cnpj || prev.supplier_cnpj,
          items: itemsWithProducts.length > 0 ? itemsWithProducts : prev.items,
        }))
      }
    } catch (err) {
      console.error('Erro ao ler foto:', err)
      alert(
        'Aviso: Não foi possível realizar OCR automático completo. O modo de preenchimento assistido foi ativado.',
      )
    } finally {
      setIsProcessingPhoto(false)
    }
  }

  // Manipular itens extraídos na modal da NF
  const handleAddItemToExtracted = () => {
    const newItem: StockEntryItem = {
      id: `item-${Date.now()}`,
      product_id: products[0]?.id,
      description: products[0]?.name || 'Novo item de nota',
      quantity: 1,
      unit_price: 10,
      subtotal: 10,
      verification_status: 'pendente',
      divergence_type: 'nenhuma',
    }
    setExtractedData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }))
  }

  const handleRemoveItemFromExtracted = (itemId: string) => {
    setExtractedData((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== itemId),
    }))
  }

  const handleUpdateExtractedItem = (itemId: string, field: keyof StockEntryItem, value: any) => {
    setExtractedData((prev) => {
      const updated = prev.items.map((i) => {
        if (i.id !== itemId) return i
        const next = { ...i, [field]: value }
        if (field === 'product_id') {
          const found = products.find((p) => p.id === value)
          if (found) {
            next.description = found.name
            next.ncm = found.ncm
            if (!next.unit_price || next.unit_price <= 0) {
              next.unit_price = found.cost_price || found.price * 0.4
            }
          }
        }
        if (field === 'quantity' || field === 'unit_price') {
          const qty = Number(field === 'quantity' ? value : next.quantity) || 0
          const price = Number(field === 'unit_price' ? value : next.unit_price) || 0
          next.subtotal = qty * price
        }
        return next
      })
      return { ...prev, items: updated }
    })
  }

  // Salvar nota fiscal como "em conferência"
  const handleSaveInvoiceEntry = async () => {
    if (extractedData.items.length === 0) {
      alert('Adicione ao menos um item extraído da nota fiscal.')
      return
    }

    setIsProcessingPhoto(true)
    try {
      const total = extractedData.items.reduce((acc, i) => acc + (Number(i.subtotal) || 0), 0)
      const newEntry = await createStockEntry(
        {
          invoice_number: extractedData.invoice_number,
          series: extractedData.series,
          access_key: extractedData.access_key,
          supplier: extractedData.supplier_id || undefined,
          supplier_name: extractedData.supplier_name,
          supplier_cnpj: extractedData.supplier_cnpj,
          status: 'em_conferencia',
          total_amount: total,
          items_count: extractedData.items.length,
          notes: extractedData.notes,
          items: extractedData.items,
        },
        selectedInvoiceFile || undefined,
      )

      setIsPhotoEntryModalOpen(false)
      await loadData()

      // Abre direto a conferência da nota criada para agilidade
      handleOpenVerification(newEntry)
    } catch (e) {
      console.error('Erro ao salvar entrada de nota:', e)
      alert('Erro ao salvar entrada de estoque da nota fiscal.')
    } finally {
      setIsProcessingPhoto(false)
    }
  }

  // Iniciar / Abrir modal de conferência por foto
  const handleOpenVerification = (entry: StockEntry) => {
    setActiveVerificationEntry(entry)
    // Garantir que todos os itens tenham campos de conferência
    const items: StockEntryItem[] = (entry.items || []).map((it) => ({
      ...it,
      verified_quantity: it.verified_quantity !== undefined ? it.verified_quantity : it.quantity,
      verification_status: it.verification_status || 'pendente',
      divergence_type: it.divergence_type || 'nenhuma',
      divergence_notes: it.divergence_notes || '',
    }))
    setVerificationItems(items)
    setNewVerificationFiles({})
    setIsVerificationModalOpen(true)
  }

  // Foto do produto durante conferência
  const handleItemPhotoCapture = (itemId: string, file: File) => {
    setNewVerificationFiles((prev) => ({
      ...prev,
      [itemId]: file,
    }))
    const url = URL.createObjectURL(file)
    setVerificationItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, photo_url: url, photo_filename: file.name } : i)),
    )
  }

  // Concluir conferência e registrar movimentações de estoque
  const handleFinalizeVerification = async () => {
    if (!activeVerificationEntry) return

    // Validação: verificar se todos foram checados
    const pendingCount = verificationItems.filter(
      (i) => i.verification_status === 'pendente',
    ).length
    if (pendingCount > 0) {
      const confirmPending = window.confirm(
        `Existem ${pendingCount} itens com status "pendente" de conferência. Deseja marcar como OK e concluir?`,
      )
      if (!confirmPending) return
    }

    setIsSavingVerification(true)
    try {
      const filesToUpload = Object.values(newVerificationFiles)

      // Se houver fotos novas para anexar ao registro
      if (filesToUpload.length > 0) {
        await updateStockEntry(activeVerificationEntry.id, {}, filesToUpload)
      }

      // Conclui e cria as movimentações de estoque por item
      await finalizeStockEntry(activeVerificationEntry.id, {
        ...activeVerificationEntry,
        items: verificationItems.map((i) => ({
          ...i,
          verification_status: i.verification_status === 'pendente' ? 'ok' : i.verification_status,
        })),
      })

      setIsVerificationModalOpen(false)
      setActiveVerificationEntry(null)
      await loadData()
      alert('Conferência finalizada com sucesso! As movimentações de estoque foram registradas.')
    } catch (e) {
      console.error('Erro ao finalizar conferência:', e)
      alert('Falha ao concluir conferência de estoque.')
    } finally {
      setIsSavingVerification(false)
    }
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

        <div className="flex flex-wrap items-center gap-2">
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
            variant="outline"
            onClick={() => handleOpenEntryModal()}
            className="border-zinc-300 gap-1.5 text-xs bg-white text-zinc-900 font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Entrada Manual
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenPhotoEntryModal()}
            className="bg-[#0A0A0A] hover:bg-zinc-800 text-white font-medium text-xs gap-1.5 shadow-sm"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            Entrada por Foto (NF / DANFE)
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

        {/* Total de Movimentações & Entradas de Nota */}
        <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Entradas & Conferências
            </span>
            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-700">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl sm:text-3xl text-zinc-950 flex items-baseline gap-2">
            <span>{stockEntries.length} NFs</span>
            <span className="text-xs font-normal text-zinc-500">({kpis.totalMovements} movs)</span>
          </div>
          <p className="text-xs text-zinc-500">
            {stockEntries.filter((e) => e.status === 'em_conferencia').length > 0 ? (
              <span className="text-amber-600 font-semibold">
                {stockEntries.filter((e) => e.status === 'em_conferencia').length} nota(s) em
                conferência
              </span>
            ) : (
              'Todas as notas conferidas'
            )}
          </p>
        </div>
      </div>

      <Tabs defaultValue="posicao" className="space-y-4">
        <TabsList className="bg-zinc-100 border border-zinc-200 p-1">
          <TabsTrigger value="posicao" className="text-xs">
            Posição Atual de Estoque
          </TabsTrigger>
          <TabsTrigger value="notas_entrada" className="text-xs">
            Entradas por Foto & NFs ({stockEntries.length})
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

        {/* Tab 2: Entradas por Foto & NFs */}
        <TabsContent value="notas_entrada" className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50">
              <div>
                <h3 className="font-display font-bold text-sm text-zinc-950">
                  Notas Fiscais de Entrada & Conferência Física
                </h3>
                <p className="text-xs text-zinc-500">
                  Fluxo inteligente com extração da DANFE por foto e conferência visual de
                  mercadorias.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleOpenPhotoEntryModal()}
                className="bg-[#0A0A0A] hover:bg-zinc-800 text-white font-medium text-xs gap-1.5 self-start sm:self-auto"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                Fotografar Nova Nota
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 text-zinc-600 font-mono uppercase border-b border-zinc-200">
                  <tr>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Nota / Série</th>
                    <th className="py-3 px-4">Fornecedor</th>
                    <th className="py-3 px-4">Valor Total</th>
                    <th className="py-3 px-4">Itens</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Divergências</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {stockEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-zinc-500">
                        Nenhuma nota fiscal de entrada cadastrada ainda.
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPhotoEntryModal()}
                            className="text-xs gap-1"
                          >
                            <Camera className="w-3.5 h-3.5" /> Fazer primeira entrada por foto
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    stockEntries.map((entry) => {
                      const isCompleted = entry.status === 'concluida'
                      const isPending = entry.status === 'em_conferencia'
                      const photoUrl = entry.invoice_photo
                        ? getFileUrl('stock_entries', entry.id, entry.invoice_photo)
                        : null

                      return (
                        <tr key={entry.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono text-zinc-500 whitespace-nowrap">
                            {formatDateTime(entry.created)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-zinc-900 font-mono">
                              {entry.invoice_number || 'Sem número'}
                            </div>
                            {entry.series && (
                              <span className="text-[10px] text-zinc-500 font-mono">
                                Série: {entry.series}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-zinc-900">
                              {entry.supplier_name ||
                                entry.expand?.supplier?.name ||
                                'Fornecedor não informado'}
                            </div>
                            {entry.supplier_cnpj && (
                              <div className="text-[10px] font-mono text-zinc-500">
                                {entry.supplier_cnpj}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-zinc-950">
                            {entry.total_amount ? formatBRL(entry.total_amount) : '—'}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <span className="bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded font-bold">
                              {entry.items?.length || entry.items_count || 0} itens
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {isCompleted ? (
                              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-mono text-[10px] uppercase gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Concluída
                              </Badge>
                            ) : isPending ? (
                              <Badge className="bg-amber-500 hover:bg-amber-500 text-white font-mono text-[10px] uppercase gap-1 animate-pulse">
                                <AlertTriangle className="w-3 h-3" /> Em Conferência
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="font-mono text-[10px] uppercase">
                                {entry.status}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-[11px] text-zinc-600">
                            {entry.divergences_summary || 'Nenhuma'}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {photoUrl && (
                              <a
                                href={photoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 hover:text-black border border-zinc-200 px-2 py-1 rounded hover:bg-zinc-100"
                                title="Ver foto da nota fiscal"
                              >
                                <FileText className="w-3 h-3" /> Ver NF
                              </a>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleOpenVerification(entry)}
                              className={
                                isCompleted
                                  ? 'h-7 text-[11px] px-2.5 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border border-zinc-200'
                                  : 'h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
                              }
                            >
                              <Camera className="w-3 h-3 mr-1" />
                              {isCompleted ? 'Rever Conferência' : 'Conferir Mercadorias'}
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

        {/* Tab 3: Movimentações */}
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

      {/* MODAL 1: ENTRADA POR FOTO (OCR / DANFE / ASSISTIDA) */}
      <Dialog open={isPhotoEntryModalOpen} onOpenChange={setIsPhotoEntryModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="font-display font-bold text-xl">
                    Entrada de Estoque por Foto (DANFE / NF-e)
                  </DialogTitle>
                  <p className="text-xs text-zinc-500">
                    Faça upload ou tire uma foto da nota fiscal para extrair os itens e custos
                    automaticamente.
                  </p>
                </div>
              </div>
            </DialogHeader>

            {/* Dropzone de upload da foto / arquivo */}
            <div className="border-2 border-dashed border-zinc-200 rounded-xl p-5 bg-zinc-50/50 hover:bg-zinc-50 transition-colors text-center relative space-y-3">
              <input
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={handleInvoiceFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Tirar foto ou selecionar arquivo de nota fiscal"
              />

              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-xs">
                  {isProcessingPhoto ? (
                    <RefreshCw className="w-6 h-6 text-zinc-800 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-zinc-700" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-zinc-900">
                    {selectedInvoiceFile
                      ? `Arquivo selecionado: ${selectedInvoiceFile.name}`
                      : 'Clique para fotografar a nota ou arrastar arquivo (Foto / PDF)'}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Formatos aceitos: JPG, PNG, WEBP e PDF (até 10MB)
                  </p>
                </div>

                {isProcessingPhoto && (
                  <Badge
                    variant="secondary"
                    className="font-mono text-xs animate-pulse bg-emerald-50 text-emerald-700 border-emerald-200"
                  >
                    Processando imagem e extraindo campos da DANFE...
                  </Badge>
                )}
              </div>

              {invoicePhotoPreview && (
                <div className="pt-2 flex justify-center">
                  <img
                    src={invoicePhotoPreview}
                    alt="Preview da Nota"
                    className="max-h-36 rounded-lg border border-zinc-300 object-contain shadow-xs"
                  />
                </div>
              )}
            </div>

            {/* Informações da Nota Fiscal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 block">Número da NF</label>
                <Input
                  value={extractedData.invoice_number}
                  onChange={(e) =>
                    setExtractedData((prev) => ({ ...prev, invoice_number: e.target.value }))
                  }
                  placeholder="Ex: NF-89123"
                  className="bg-white text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 block">Série / Chave</label>
                <Input
                  value={extractedData.series}
                  onChange={(e) =>
                    setExtractedData((prev) => ({ ...prev, series: e.target.value }))
                  }
                  placeholder="Série 1"
                  className="bg-white text-xs h-8 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 block">Vincular Fornecedor</label>
                <Select
                  value={extractedData.supplier_id}
                  onValueChange={(val) => {
                    const sup = suppliers.find((s) => s.id === val)
                    setExtractedData((prev) => ({
                      ...prev,
                      supplier_id: val,
                      supplier_name: sup?.name || prev.supplier_name,
                      supplier_cnpj: sup?.cnpj || prev.supplier_cnpj,
                    }))
                  }}
                >
                  <SelectTrigger className="bg-white text-xs h-8">
                    <SelectValue placeholder="Selecione..." />
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
            </div>

            {/* Itens Extraídos e Vinculação com o Catálogo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-zinc-700">
                    Itens Identificados na Nota ({extractedData.items.length})
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Vincule cada linha com o produto do seu catálogo ou ajuste quantidades e custos.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItemToExtracted}
                  className="text-xs h-7 gap-1"
                >
                  <Plus className="w-3 h-3" /> Linha
                </Button>
              </div>

              <div className="border border-zinc-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-50 font-mono text-zinc-600 uppercase border-b border-zinc-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-3">Item da Nota</th>
                      <th className="py-2 px-3">Produto no Catálogo</th>
                      <th className="py-2 px-3 w-20">Qtd</th>
                      <th className="py-2 px-3 w-24">Custo Un.</th>
                      <th className="py-2 px-3 w-24">Subtotal</th>
                      <th className="py-2 px-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    {extractedData.items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-400">
                          Nenhum item detectado ainda. Fotografe a nota acima ou adicione
                          manualmente.
                        </td>
                      </tr>
                    ) : (
                      extractedData.items.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-50/60">
                          <td className="py-2 px-3">
                            <Input
                              value={item.description}
                              onChange={(e) =>
                                handleUpdateExtractedItem(item.id, 'description', e.target.value)
                              }
                              className="text-xs h-7 bg-transparent border-zinc-200"
                            />
                            {item.ncm && (
                              <span className="text-[10px] text-zinc-400 font-mono">
                                NCM: {item.ncm}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <Select
                              value={item.product_id || ''}
                              onValueChange={(val) =>
                                handleUpdateExtractedItem(item.id, 'product_id', val)
                              }
                            >
                              <SelectTrigger className="text-xs h-7 max-w-[220px]">
                                <SelectValue placeholder="Vincular produto..." />
                              </SelectTrigger>
                              <SelectContent className="max-h-56">
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateExtractedItem(item.id, 'quantity', e.target.value)
                              }
                              className="text-xs h-7 font-mono w-16"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) =>
                                handleUpdateExtractedItem(item.id, 'unit_price', e.target.value)
                              }
                              className="text-xs h-7 font-mono w-20"
                            />
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-zinc-900 whitespace-nowrap">
                            {formatBRL(item.subtotal || item.quantity * item.unit_price)}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemFromExtracted(item.id)}
                              className="text-zinc-400 hover:text-red-600 p-1 rounded"
                              title="Remover linha"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {extractedData.items.length > 0 && (
                <div className="flex justify-between items-center px-1 font-mono text-xs">
                  <span className="text-zinc-500">
                    Total Itens:{' '}
                    <strong>
                      {extractedData.items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0)}{' '}
                      un.
                    </strong>
                  </span>
                  <span className="text-zinc-900 font-bold text-sm">
                    Total da Nota:{' '}
                    {formatBRL(
                      extractedData.items.reduce((acc, i) => acc + (Number(i.subtotal) || 0), 0),
                    )}
                  </span>
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPhotoEntryModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={isProcessingPhoto || extractedData.items.length === 0}
                onClick={handleSaveInvoiceEntry}
                className="bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold gap-1.5"
              >
                {isProcessingPhoto ? (
                  'Salvando...'
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    Salvar & Iniciar Conferência
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: CONFERÊNCIA POR FOTO & CONTROLE DE DIVERGÊNCIAS */}
      <Dialog open={isVerificationModalOpen} onOpenChange={setIsVerificationModalOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="font-display font-bold text-xl">
                      Conferência de Mercadorias por Foto
                    </DialogTitle>
                    <p className="text-xs text-zinc-500">
                      Fotografe os produtos recebidos, confira quantidades e aponte divergências
                      antes de efetivar o estoque.
                    </p>
                  </div>
                </div>

                {activeVerificationEntry && (
                  <Badge variant="outline" className="font-mono text-xs self-start sm:self-auto">
                    NF: {activeVerificationEntry.invoice_number || 'Sem número'} | Status:{' '}
                    {activeVerificationEntry.status}
                  </Badge>
                )}
              </div>
            </DialogHeader>

            {/* Lista de itens para conferência individual */}
            <div className="space-y-3">
              {verificationItems.map((item, index) => {
                const prod = products.find((p) => p.id === item.product_id)
                const isDivergent = item.verification_status === 'divergente'
                const isOk = item.verification_status === 'ok'

                return (
                  <div
                    key={item.id || index}
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      isDivergent
                        ? 'border-red-300 bg-red-50/30'
                        : isOk
                          ? 'border-emerald-300 bg-emerald-50/20'
                          : 'border-zinc-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-zinc-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-zinc-900 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                            {index + 1}
                          </span>
                          <h4 className="font-display font-bold text-sm text-zinc-950">
                            {item.description}
                          </h4>
                          {prod && (
                            <span className="text-[10px] font-mono bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">
                              Catálogo: {prod.name} (Atual: {prod.stock ?? 0} un.)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5">
                          Nota: {item.quantity} un. • Custo: {formatBRL(item.unit_price)} •
                          Subtotal: {formatBRL(item.subtotal)}
                        </div>
                      </div>

                      {/* Botões de Decisão OK / Divergente */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setVerificationItems((prev) =>
                              prev.map((i) =>
                                i.id === item.id
                                  ? {
                                      ...i,
                                      verification_status: 'ok',
                                      divergence_type: 'nenhuma',
                                      verified_quantity: i.quantity,
                                    }
                                  : i,
                              ),
                            )
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            isOk
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Conferido OK
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setVerificationItems((prev) =>
                              prev.map((i) =>
                                i.id === item.id
                                  ? {
                                      ...i,
                                      verification_status: 'divergente',
                                      divergence_type:
                                        i.divergence_type !== 'nenhuma'
                                          ? i.divergence_type
                                          : 'quantidade_a_menos',
                                    }
                                  : i,
                              ),
                            )
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            isDivergent
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          Divergente
                        </button>
                      </div>
                    </div>

                    {/* Área de Conferência: Foto do Produto / Lote + Quantidade Conferida */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      {/* Seção da Foto */}
                      <div className="sm:col-span-5 flex items-center gap-3">
                        <div className="relative w-24 h-20 rounded-lg border border-zinc-200 bg-zinc-50 overflow-hidden flex items-center justify-center shrink-0">
                          {item.photo_url ? (
                            <img
                              src={item.photo_url}
                              alt={`Foto ${item.description}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-1 text-zinc-400">
                              <Camera className="w-5 h-5 mx-auto" />
                              <span className="text-[9px] block">Sem foto</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 text-xs font-semibold cursor-pointer hover:bg-zinc-100 bg-white shadow-xs">
                            <Camera className="w-3.5 h-3.5 text-zinc-700" />
                            <span>Fotografar Produto</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleItemPhotoCapture(item.id, file)
                              }}
                              className="sr-only"
                            />
                          </label>
                          <span className="block text-[10px] text-zinc-500">
                            Registre a caixa, lote ou produto físico.
                          </span>
                        </div>
                      </div>

                      {/* Quantidade Efetivamente Recebida */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-700 block">
                          Qtd Conferida (Física)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={
                            item.verified_quantity !== undefined
                              ? item.verified_quantity
                              : item.quantity
                          }
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0
                            setVerificationItems((prev) =>
                              prev.map((i) =>
                                i.id === item.id
                                  ? {
                                      ...i,
                                      verified_quantity: val,
                                      verification_status:
                                        val !== i.quantity ? 'divergente' : i.verification_status,
                                      divergence_type:
                                        val > i.quantity
                                          ? 'quantidade_a_mais'
                                          : val < i.quantity
                                            ? 'quantidade_a_menos'
                                            : 'nenhuma',
                                    }
                                  : i,
                              ),
                            )
                          }}
                          className="h-8 text-xs font-mono font-bold"
                        />
                      </div>

                      {/* Divergência Detalhada (se divergente) */}
                      {isDivergent ? (
                        <div className="sm:col-span-4 space-y-1">
                          <label className="text-[11px] font-semibold text-red-700 block">
                            Tipo de Divergência
                          </label>
                          <Select
                            value={item.divergence_type || 'quantidade_a_menos'}
                            onValueChange={(val: DivergenceType) => {
                              setVerificationItems((prev) =>
                                prev.map((i) =>
                                  i.id === item.id ? { ...i, divergence_type: val } : i,
                                ),
                              )
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs bg-white border-red-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="quantidade_a_menos">
                                Quantidade a menos (Falta)
                              </SelectItem>
                              <SelectItem value="quantidade_a_mais">
                                Quantidade a mais (Sobra)
                              </SelectItem>
                              <SelectItem value="avaria">Avaria / Quebra física</SelectItem>
                              <SelectItem value="item_incorreto">
                                Item incorreto / Trocado
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="sm:col-span-4 text-xs font-mono text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Conferência coincide com a nota</span>
                        </div>
                      )}
                    </div>

                    {/* Observação da Divergência */}
                    {isDivergent && (
                      <div className="pt-1">
                        <Input
                          placeholder="Observação da divergência para o fornecedor (ex: 2 peças trincadas na caixa)"
                          value={item.divergence_notes || ''}
                          onChange={(e) => {
                            const val = e.target.value
                            setVerificationItems((prev) =>
                              prev.map((i) =>
                                i.id === item.id ? { ...i, divergence_notes: val } : i,
                              ),
                            )
                          }}
                          className="h-8 text-xs bg-white border-red-200"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Resumo Final da Conferência */}
            <div className="p-4 bg-zinc-900 text-white rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span>Total de Itens Conferidos:</span>
                <span className="font-bold text-sm">
                  {verificationItems.reduce(
                    (acc, i) =>
                      acc + (i.verified_quantity !== undefined ? i.verified_quantity : i.quantity),
                    0,
                  )}{' '}
                  unidades
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span>Divergências Encontradas:</span>
                <span
                  className={
                    verificationItems.filter((i) => i.verification_status === 'divergente').length >
                    0
                      ? 'text-red-400 font-bold'
                      : 'text-emerald-400 font-bold'
                  }
                >
                  {verificationItems.filter((i) => i.verification_status === 'divergente').length}{' '}
                  item(s) com divergência
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800">
                Ao clicar em "Efetivar Entrada no Estoque", as movimentações serão lançadas
                automaticamente para cada produto vinculado e o custo unitário será atualizado.
              </p>
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVerificationModalOpen(false)}
                className="text-xs"
              >
                Voltar
              </Button>
              <Button
                type="button"
                disabled={isSavingVerification}
                onClick={handleFinalizeVerification}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSavingVerification
                  ? 'Efetivando Movimentações...'
                  : 'Efetivar Entrada no Estoque'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Registrar Entrada Manual */}
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
