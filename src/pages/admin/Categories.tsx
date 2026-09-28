import React, { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, RefreshCw, Layers } from 'lucide-react'
import { Category } from '@/types/ecommerce'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/services/categories'
import { getCategoryFallbackImage } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useRealtime } from '@/hooks/use-realtime'

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const cats = await getCategories()
      setCategories(cats)
    } catch (e) {
      console.error('Erro ao buscar categorias', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Real-time synchronization
  useRealtime('categories', () => {
    getCategories().then(setCategories)
  })

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
  }

  const handleNameChange = (val: string) => {
    setName(val)
    if (!editingCategory) {
      setSlug(slugify(val))
    }
  }

  const openCreateModal = () => {
    setEditingCategory(null)
    setName('')
    setSlug('')
    setImageFile(null)
    setIsModalOpen(true)
  }

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat)
    setName(cat.name)
    setSlug(cat.slug)
    setImageFile(null)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) {
      alert('Preencha o nome e o slug da categoria.')
      return
    }

    setIsSaving(true)
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          slug: slug.trim(),
          image: imageFile || undefined,
        })
      } else {
        await createCategory({
          name: name.trim(),
          slug: slug.trim(),
          image: imageFile || undefined,
        })
      }
      setIsModalOpen(false)
      loadData()
    } catch (err) {
      console.error('Erro ao salvar categoria', err)
      alert('Falha ao salvar categoria. Verifique se o slug já não existe.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, catName: string) => {
    if (window.confirm(`Deseja realmente remover a categoria "${catName}"?`)) {
      try {
        await deleteCategory(id)
        setCategories((prev) => prev.filter((c) => c.id !== id))
      } catch (err) {
        console.error('Erro ao deletar categoria', err)
        alert('Não foi possível excluir a categoria. Verifique se há produtos associados a ela.')
      }
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
            Estrutura da Loja
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
            Categorias de Produtos
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
            Nova Categoria
          </Button>
        </div>
      </div>

      {/* Grid of categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {categories.map((cat) => {
          const bg = getCategoryFallbackImage(cat.slug)

          return (
            <div
              key={cat.id}
              className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div className="relative h-32 bg-zinc-100 overflow-hidden">
                <img src={bg} alt={cat.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
                  <h3 className="font-display font-bold text-xl text-white text-center">
                    {cat.name}
                  </h3>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-mono">Slug:</span>
                  <span className="font-mono font-bold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded">
                    {cat.slug}
                  </span>
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(cat)}
                    className="h-8 px-2.5 text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="h-8 px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display font-bold text-xl">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 block">
                  Nome da Categoria <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Ex: Vaporizadores"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 block">
                  Slug (identificador URL) <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="vaporizadores"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 block">
                  Imagem da Categoria (opcional)
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
                {isSaving ? 'Salvando...' : 'Salvar Categoria'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
