import React, { useEffect, useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Upload,
  Image as ImageIcon,
} from 'lucide-react'
import { Product, Category } from '@/types/ecommerce'
import {
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
} from '@/services/products'
import { getCategories } from '@/services/categories'
import { formatBRL, getFileUrl, getProductFallbackImage } from '@/lib/formatters'
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
import { useRealtime } from '@/hooks/use-realtime'

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form Fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<number | string>('')
  const [stock, setStock] = useState<number | string>(10)
  const [category, setCategory] = useState('')
  const [featured, setFeatured] = useState(false)
  const [active, setActive] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [prods, cats] = await Promise.all([getAllProductsAdmin(), getCategories()])
      setProducts(prods)
      setCategories(cats)
    } catch (e) {
      console.error('Erro ao buscar produtos/categorias', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Real-time synchronization
  useRealtime('products', () => {
    getAllProductsAdmin().then(setProducts)
  })

  const openCreateModal = () => {
    setEditingProduct(null)
    setName('')
    setDescription('')
    setPrice('')
    setStock(10)
    setCategory(categories[0]?.id || '')
    setFeatured(false)
    setActive(true)
    setImageFile(null)
    setIsModalOpen(true)
  }

  const openEditModal = (p: Product) => {
    setEditingProduct(p)
    setName(p.name)
    setDescription(p.description)
    setPrice(p.price)
    setStock(p.stock)
    setCategory(p.category)
    setFeatured(p.featured)
    setActive(p.active)
    setImageFile(null)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !category || !price) {
      alert('Preencha os campos obrigatórios (Nome, Categoria e Preço).')
      return
    }

    setIsSaving(true)
    try {
      const numPrice = Number(price)
      const numStock = Number(stock) || 0

      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: name.trim(),
          description: description.trim(),
          price: numPrice,
          stock: numStock,
          category,
          featured,
          active,
          image: imageFile || undefined,
        })
      } else {
        await createProduct({
          name: name.trim(),
          description: description.trim(),
          price: numPrice,
          stock: numStock,
          category,
          featured,
          active,
          image: imageFile || undefined,
        })
      }

      setIsModalOpen(false)
      loadData()
    } catch (err) {
      console.error('Erro ao salvar produto', err)
      alert('Falha ao salvar produto. Verifique os dados e tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, prodName: string) => {
    if (window.confirm(`Tem certeza que deseja remover o produto "${prodName}"?`)) {
      try {
        await deleteProduct(id)
        setProducts((prev) => prev.filter((p) => p.id !== id))
      } catch (err) {
        console.error('Erro ao deletar produto', err)
        alert('Falha ao excluir produto.')
      }
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const updated = await toggleProductActive(id, currentActive)
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, active: updated.active } : p)))
    } catch (err) {
      console.error('Erro ao alterar status do produto', err)
    }
  }

  const filtered = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()),
    )
  }, [products, search])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
            Catálogo da Loja
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
            Gerenciar Produtos
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-zinc-300 gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-[#0A0A0A] hover:bg-zinc-800 text-white font-semibold text-xs gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Buscar por nome do produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm bg-zinc-50 border-zinc-200"
          />
        </div>
        <div className="text-xs font-mono text-zinc-500">
          Total: <strong>{filtered.length}</strong> produtos
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 text-zinc-600 font-mono uppercase border-b border-zinc-200">
              <tr>
                <th className="py-3.5 px-4">Imagem</th>
                <th className="py-3.5 px-4">Nome</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Preço</th>
                <th className="py-3.5 px-4">Estoque</th>
                <th className="py-3.5 px-4">Destaque</th>
                <th className="py-3.5 px-4">Ativo</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    Nenhum produto cadastrado ou correspondente à busca.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const img = prod.image
                    ? getFileUrl('products', prod.id, prod.image)
                    : getProductFallbackImage(prod.name, prod.expand?.category?.slug)

                  return (
                    <tr key={prod.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <img
                          src={img}
                          alt={prod.name}
                          className="w-12 h-12 rounded object-cover border border-zinc-200"
                        />
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-900 max-w-xs truncate">
                        {prod.name}
                      </td>
                      <td className="py-3 px-4 text-zinc-600">
                        {prod.expand?.category?.name ||
                          categories.find((c) => c.id === prod.category)?.name ||
                          '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-zinc-950">
                        {formatBRL(prod.price)}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {prod.stock > 0 ? (
                          <span className="text-zinc-700">{prod.stock} un.</span>
                        ) : (
                          <span className="text-red-600 font-bold">Esgotado</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {prod.featured ? (
                          <Badge className="bg-black text-white text-[10px]">Sim</Badge>
                        ) : (
                          <span className="text-zinc-400 font-mono">Não</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(prod.id, prod.active)}
                          className="flex items-center gap-1.5 focus:outline-none"
                          title="Clique para alternar status"
                        >
                          {prod.active ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded text-[11px] font-medium border border-zinc-200">
                              <XCircle className="w-3 h-3" /> Inativo
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(prod)}
                          className="h-7 px-2 text-[11px]"
                          title="Editar"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(prod.id, prod.name)}
                          className="h-7 px-2 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          title="Excluir"
                        >
                          <Trash2 className="w-3 h-3" />
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

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display font-bold text-xl">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 block">
                  Nome do Produto <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Ex: Vaporizador de Ervas Slim X"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 block">
                  Descrição Completa <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detalhes, especificações e diferenciais do produto..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 border border-zinc-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 block">
                    Categoria <span className="text-red-500">*</span>
                  </label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-white border-zinc-300">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 block">
                    Preço (BRL) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="99.90"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Stock & Image upload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 block">
                    Estoque Disponível
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="10"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 block">
                    Upload de Imagem
                  </label>
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0])
                      }
                    }}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Toggles: Featured & Active */}
              <div className="pt-2 flex items-center gap-6 border-t border-zinc-200">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded border-zinc-300 w-4 h-4 text-black focus:ring-black"
                  />
                  <span>Produto em Destaque ("Mais Vendido")</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded border-zinc-300 w-4 h-4 text-black focus:ring-black"
                  />
                  <span>Produto Ativo (visível na loja)</span>
                </label>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#0A0A0A] hover:bg-zinc-800 text-white font-semibold text-xs"
              >
                {isSaving ? 'Salvando...' : 'Salvar Produto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
