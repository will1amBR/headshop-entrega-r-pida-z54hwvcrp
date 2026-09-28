import React, { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import { Product, Category } from '@/types/ecommerce'
import { getCategories } from '@/services/categories'
import { getProducts } from '@/services/products'
import { ProductCard } from '@/components/ProductCard'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // States
  const [search, setSearch] = useState<string>(searchParams.get('busca') || '')
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('categoria') || 'todos',
  )
  const [sortBy, setSortBy] = useState<string>('mais-vendidos')

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const [cats, prods] = await Promise.all([
          getCategories(),
          getProducts({ activeOnly: true }),
        ])
        setCategories(cats)
        setProducts(prods)
      } catch (err) {
        console.error('Erro ao carregar catálogo de produtos', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug)
    if (slug === 'todos') {
      searchParams.delete('categoria')
    } else {
      searchParams.set('categoria', slug)
    }
    setSearchParams(searchParams)
  }

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      if (selectedCategory === 'todos') return matchSearch
      return matchSearch && p.expand?.category?.slug === selectedCategory
    })

    if (sortBy === 'menor-preco') {
      result.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'maior-preco') {
      result.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'mais-vendidos') {
      // Destaques primeiro, depois mais recentes
      result.sort((a, b) => (b.featured === a.featured ? 0 : b.featured ? 1 : -1))
    }

    return result
  }, [products, search, selectedCategory, sortBy])

  return (
    <div className="py-10 sm:py-16 bg-white min-h-[80vh]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
            Loja Completa
          </span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-zinc-950 tracking-tight">
            Nossos Produtos
          </h1>
          <p className="text-zinc-600 text-sm sm:text-base max-w-2xl">
            Explore nossa seleção completa de acessórios para headshop. Todos os pedidos são
            finalizados com segurança e frete fixo via WhatsApp.
          </p>
        </div>

        {/* Filter bar */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                placeholder="Buscar por nome ou modelo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white border-zinc-300"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-medium whitespace-nowrap">
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
                <span>Ordenar por:</span>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48 bg-white border-zinc-300 text-xs sm:text-sm">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mais-vendidos">Mais Vendidos</SelectItem>
                  <SelectItem value="menor-preco">Menor Preço</SelectItem>
                  <SelectItem value="maior-preco">Maior Preço</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-zinc-200 scrollbar-none">
            <button
              onClick={() => handleCategoryChange('todos')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === 'todos'
                  ? 'bg-[#0A0A0A] text-white shadow'
                  : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
              }`}
            >
              Todos ({products.length})
            </button>
            {categories.map((c) => {
              const count = products.filter(
                (p) => p.category === c.id || p.expand?.category?.slug === c.slug,
              ).length
              return (
                <button
                  key={c.id}
                  onClick={() => handleCategoryChange(c.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedCategory === c.slug
                      ? 'bg-[#0A0A0A] text-white shadow'
                      : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                  }`}
                >
                  {c.name} {count > 0 && `(${count})`}
                </button>
              )
            })}
          </div>
        </div>

        {/* Results grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-80 bg-zinc-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 border border-dashed border-zinc-300 rounded-xl space-y-4">
            <SlidersHorizontal className="w-10 h-10 text-zinc-400 mx-auto" />
            <h3 className="font-display font-semibold text-lg text-zinc-800">
              Nenhum produto encontrado
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto">
              Não encontramos resultados com os filtros informados. Tente ajustar os termos da
              busca.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                setSelectedCategory('todos')
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs font-mono text-zinc-500">
              Mostrando <strong>{filteredAndSortedProducts.length}</strong> produtos
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredAndSortedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
