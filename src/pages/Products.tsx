import React, { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  LayoutGrid,
  Layers,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'
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

const INITIAL_PAGE_SIZE = 8
const LOAD_MORE_STEP = 8

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filtros
  const [search, setSearch] = useState<string>(searchParams.get('busca') || '')
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('categoria') || 'todos',
  )
  const [sortBy, setSortBy] = useState<string>('mais-vendidos')

  // Controle de paginação progressiva / Carregar mais (especialmente para mobile não ter scroll infinito de 24 itens)
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_PAGE_SIZE)
  // Modo de visualização: 'grid' (com paginação) ou 'grouped' (agrupado por seções de categoria)
  const [viewMode, setViewMode] = useState<'grid' | 'grouped'>('grid')

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

  // Reseta a paginação ao trocar filtro ou busca
  useEffect(() => {
    setVisibleCount(INITIAL_PAGE_SIZE)
  }, [search, selectedCategory, sortBy])

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
      result.sort((a, b) => (b.featured === a.featured ? 0 : b.featured ? 1 : -1))
    }

    return result
  }, [products, search, selectedCategory, sortBy])

  // Produtos exibidos no modo grid (respeitando o visibleCount)
  const paginatedProducts = useMemo(() => {
    return filteredAndSortedProducts.slice(0, visibleCount)
  }, [filteredAndSortedProducts, visibleCount])

  // Produtos agrupados por categoria para o modo de seções
  const productsGroupedByCategory = useMemo(() => {
    return categories
      .map((cat) => {
        const catProds = filteredAndSortedProducts.filter(
          (p) => p.category === cat.id || p.expand?.category?.slug === cat.slug,
        )
        return {
          category: cat,
          items: catProds,
        }
      })
      .filter((group) => group.items.length > 0)
  }, [categories, filteredAndSortedProducts])

  const hasMore = visibleCount < filteredAndSortedProducts.length

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + LOAD_MORE_STEP)
  }

  return (
    <div className="py-8 sm:py-14 bg-white min-h-[80vh]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="space-y-1.5">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
            Loja Completa
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-4xl text-zinc-950 tracking-tight">
            Nossos Produtos
          </h1>
          <p className="text-zinc-600 text-xs sm:text-base max-w-2xl leading-relaxed">
            Catálogo completo da HeadShop Entrega Rápida com sedas, piteiras, dichavadores,
            isqueiros, bongs e acessórios. Entrega rápida em São Paulo e envio Brasil com
            finalização via WhatsApp.
          </p>
        </div>

        {/* Filter bar */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 sm:p-5 space-y-3.5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                placeholder="Buscar produto ou modelo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white border-zinc-300 text-sm h-10"
              />
            </div>

            {/* Controls: Ordenar e Alternador de visualização */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500 hidden sm:block" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[170px] sm:w-[190px] bg-white border-zinc-300 text-xs h-9">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mais-vendidos">Mais Vendidos</SelectItem>
                    <SelectItem value="menor-preco">Menor Preço</SelectItem>
                    <SelectItem value="maior-preco">Maior Preço</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botões alternadores Grid / Seções */}
              {selectedCategory === 'todos' && !search && (
                <div className="flex items-center bg-zinc-200/70 p-0.5 rounded-lg border border-zinc-300">
                  <button
                    onClick={() => setViewMode('grid')}
                    title="Visualização em grade"
                    className={`p-1.5 rounded-md transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white shadow-sm text-zinc-950'
                        : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grouped')}
                    title="Visualização por seções de categoria"
                    className={`p-1.5 rounded-md transition-all ${
                      viewMode === 'grouped'
                        ? 'bg-white shadow-sm text-zinc-950'
                        : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Category Chips com rolagem horizontal limpa */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-zinc-200 scrollbar-none -mx-1 px-1">
            <button
              onClick={() => handleCategoryChange('todos')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === 'todos'
                  ? 'bg-[#0A0A0A] text-white shadow-sm'
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
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedCategory === c.slug
                      ? 'bg-[#0A0A0A] text-white shadow-sm'
                      : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                  }`}
                >
                  {c.name} {count > 0 && `(${count})`}
                </button>
              )
            })}
          </div>
        </div>

        {/* Results Area */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-72 sm:h-80 bg-zinc-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-16 sm:py-20 bg-zinc-50 border border-dashed border-zinc-300 rounded-xl space-y-3">
            <SlidersHorizontal className="w-8 h-8 text-zinc-400 mx-auto" />
            <h3 className="font-display font-semibold text-base sm:text-lg text-zinc-800">
              Nenhum produto encontrado
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto">
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
        ) : viewMode === 'grouped' && selectedCategory === 'todos' && !search ? (
          /* MODO SEÇÕES POR CATEGORIA: Organizado por blocos com cabeçalho limpo */
          <div className="space-y-10 sm:space-y-14">
            {productsGroupedByCategory.map((group) => (
              <section key={group.category.id} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                    <h2 className="font-display font-bold text-xl sm:text-2xl text-zinc-950">
                      {group.category.name}
                    </h2>
                    <span className="text-xs font-mono text-zinc-400">
                      ({group.items.length} itens)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCategoryChange(group.category.slug)}
                    className="text-xs font-semibold text-zinc-700 hover:text-black flex items-center gap-1"
                  >
                    Filtrar só esta
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {group.items.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          /* MODO GRID COM PAGINAÇÃO LIMPA ("Carregar Mais" no mobile) */
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
              <span>
                Exibindo <strong>{paginatedProducts.length}</strong> de{' '}
                <strong>{filteredAndSortedProducts.length}</strong> produtos
              </span>
              {hasMore && (
                <span className="text-[#1EBE5A] font-semibold">
                  +{filteredAndSortedProducts.length - paginatedProducts.length} disponíveis
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {paginatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Botão Carregar Mais para evitar scroll infinito vertiginoso no mobile */}
            {hasMore && (
              <div className="text-center pt-4 sm:pt-6">
                <Button
                  onClick={handleLoadMore}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-8 border-zinc-300 hover:bg-zinc-100 text-zinc-900 font-semibold gap-2 shadow-sm"
                >
                  Carregar Mais Produtos (
                  {filteredAndSortedProducts.length - paginatedProducts.length} restantes)
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <p className="text-[11px] font-mono text-zinc-400 mt-2">
                  Carregamento por blocos de {LOAD_MORE_STEP} produtos para uma navegação mobile
                  mais rápida
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
