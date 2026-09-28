import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Truck,
  Award,
  Sparkles,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Product, Category, SeoSettings } from '@/types/ecommerce'
import { getCategories } from '@/services/categories'
import { getProducts } from '@/services/products'
import { getSeoSettings } from '@/services/seo'
import { getCategoryFallbackImage } from '@/lib/formatters'
import { ProductCard } from '@/components/ProductCard'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

export default function IndexPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [seo, setSeo] = useState<SeoSettings | null>(null)
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('todos')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [cats, featured, prods, seoData] = await Promise.all([
          getCategories(),
          getProducts({ featuredOnly: true }),
          getProducts({ activeOnly: true }),
          getSeoSettings(),
        ])
        setCategories(cats)
        setFeaturedProducts(featured.slice(0, 8))
        setAllProducts(prods)
        setSeo(seoData)
      } catch (e) {
        console.error('Erro ao carregar dados da home', e)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const whatsappPhone = seo?.whatsapp_number || '5511999999999'

  const handleCategoryClick = (slug: string) => {
    setActiveCategorySlug(slug)
    const element = document.getElementById('catalogo-produtos')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const filteredProducts = allProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeCategorySlug === 'todos') {
      return matchesSearch
    }
    return matchesSearch && product.expand?.category?.slug === activeCategorySlug
  })

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section - Material Monochrome Full-Width Dark */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] bg-[#0A0A0A] text-white flex items-center border-b border-zinc-800 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column (55%) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono tracking-widest text-zinc-300 uppercase">
              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping" />
              Atendimento Online • Entregas para Todo o Brasil
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-6xl tracking-tight leading-[1.08] text-white">
              {seo?.hero_title || 'Sua loja headshop com entrega rápida'}
            </h1>

            <p className="text-zinc-400 text-base sm:text-xl max-w-xl font-normal leading-relaxed">
              {seo?.hero_subtitle ||
                'Os melhores vaporizadores, sedas de cânhamo, dichavadores e pipes artesanais. Monte seu carrinho e finalize seu pedido com total agilidade pelo WhatsApp.'}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Button
                size="lg"
                onClick={() => {
                  const el = document.getElementById('catalogo-produtos')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="bg-white hover:bg-zinc-200 text-[#0A0A0A] font-semibold px-8 h-12 text-sm sm:text-base shadow-xl transition-all hover:scale-102 active:scale-98"
              >
                Ver Produtos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <a
                href={buildWhatsAppUrl(
                  whatsappPhone,
                  'Olá! Estou na HeadShop Entrega Rápida e gostaria de pedir ajuda ou informações sobre produtos.',
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center h-12 px-6 rounded-md font-semibold text-sm sm:text-base border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-white transition-all hover:border-zinc-500 gap-2"
              >
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
                Pedir pelo WhatsApp
              </a>
            </div>

            {/* Quick bullet trust points */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-zinc-800/80 text-xs font-mono text-zinc-400">
              <div>
                <span className="block font-bold text-white text-sm">R$ 299+</span>
                Frete Grátis
              </div>
              <div>
                <span className="block font-bold text-white text-sm">100%</span>
                Originais
              </div>
              <div>
                <span className="block font-bold text-white text-sm">Direto</span>
                no WhatsApp
              </div>
            </div>
          </div>

          {/* Right Column (45%) — Mockup Hero Showcase */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-[420px] aspect-square rounded-2xl bg-gradient-to-b from-zinc-800/80 to-zinc-900 border border-zinc-700/80 p-6 shadow-2xl flex flex-col justify-between overflow-hidden group">
              <div className="flex items-center justify-between z-10">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Destaque da Semana
                </span>
                <span className="text-xs font-mono font-bold text-[#25D366] bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                  Em Estoque
                </span>
              </div>

              <div className="relative my-auto flex items-center justify-center p-4">
                <img
                  src="https://img.usecurling.com/p/600/600?q=vaporizer%20device%20smoke"
                  alt="Destaque HeadShop"
                  className="w-4/5 h-auto object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="z-10 bg-black/70 backdrop-blur-md border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-display font-semibold text-sm text-white">
                    Vaporizador HerbAir X Pro
                  </h4>
                  <p className="text-xs text-zinc-400 font-mono">Controle digital de temperatura</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate('/produtos')}
                  className="bg-white text-black hover:bg-zinc-200 text-xs font-semibold h-8 px-3"
                >
                  Conferir
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-1 text-zinc-500 text-xs font-mono">
          <span>Role para explorar</span>
          <ChevronDown className="w-4 h-4 animate-bounce text-zinc-400" />
        </div>
      </section>

      {/* 2. Featured Categories Section (Carrossel / Horizontal scroll) */}
      <section className="py-14 sm:py-20 bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 block">
                Navegue por Categoria
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950 tracking-tight">
                Tudo para sua sessão
              </h2>
            </div>
            <Link
              to="/produtos"
              className="text-sm font-semibold text-zinc-900 hover:text-black flex items-center gap-1 group"
            >
              Ver catálogo completo
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat) => {
              const bgImg = getCategoryFallbackImage(cat.slug)
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className="group relative h-44 sm:h-56 rounded-xl overflow-hidden border border-zinc-200 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus:outline-none"
                >
                  <img
                    src={bgImg}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-4 sm:p-5">
                    <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest">
                      Categoria
                    </span>
                    <h3 className="font-display font-bold text-lg sm:text-xl text-white group-hover:underline">
                      {cat.name}
                    </h3>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* 3. Best Sellers / Destaques (4-8 produtos com badge Mais Vendido) */}
      <section className="py-16 sm:py-24 bg-white border-b border-zinc-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-zinc-500">
              Mais Procurados
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-zinc-950 tracking-tight">
              Destaques e Mais Vendidos
            </h2>
            <p className="text-zinc-600 text-sm sm:text-base">
              Os itens mais pedidos pelos nossos clientes com garantia de originalidade e entrega
              expressa.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-80 bg-zinc-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Complete Products Catalog with search and category filters */}
      <section
        id="catalogo-produtos"
        className="py-16 sm:py-24 bg-zinc-50 border-b border-zinc-200"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-zinc-200">
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-widest text-zinc-500">
                Nosso Catálogo
              </span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-zinc-950 tracking-tight">
                Todos os Produtos
              </h2>
            </div>

            {/* Search Input */}
            <div className="w-full md:w-72">
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 px-3.5 text-sm bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveCategorySlug('todos')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeCategorySlug === 'todos'
                  ? 'bg-[#0A0A0A] text-white shadow'
                  : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
              }`}
            >
              Todos os Produtos
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategorySlug(c.slug)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeCategorySlug === c.slug
                    ? 'bg-[#0A0A0A] text-white shadow'
                    : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-zinc-300 rounded-xl">
              <p className="text-zinc-500 text-base">
                Nenhum produto encontrado para o filtro selecionado.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setActiveCategorySlug('todos')
                  setSearchQuery('')
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. About / Trust Section with trust badges */}
      <section
        id="sobre"
        className="py-20 sm:py-28 bg-[#0A0A0A] text-white border-b border-zinc-800"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            <div className="space-y-6">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
                Sobre a HeadShop
              </span>
              <h2 className="font-display font-bold text-3xl sm:text-5xl tracking-tight leading-tight">
                Tradição, agilidade e segurança na sua compra.
              </h2>
              <p className="text-zinc-400 text-base leading-relaxed">
                Nascemos com o propósito de simplificar a sua experiência de compra. Sem cadastros
                demorados e sem risco de expor seus dados em gateways desconhecidos: você escolhe os
                produtos, calcula o frete com transparência e fecha tudo diretamente com nossa
                equipe no WhatsApp.
              </p>
              <p className="text-zinc-400 text-base leading-relaxed">
                Nossos produtos são testados, originais e embalados em caixas discretas, garantindo
                total privacidade do envio até a sua porta.
              </p>
            </div>

            {/* Badges Column */}
            <div className="space-y-4">
              <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-4">
                <div className="p-3 rounded-lg bg-zinc-800 text-[#25D366] shrink-0">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-lg text-white">
                    Compra Segura via WhatsApp
                  </h4>
                  <p className="text-sm text-zinc-400 mt-1">
                    Atendimento em tempo real com atendente dedicado para sanar dúvidas e fechar seu
                    pedido com rapidez.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-4">
                <div className="p-3 rounded-lg bg-zinc-800 text-white shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-lg text-white">
                    Entrega em Todo o Brasil
                  </h4>
                  <p className="text-sm text-zinc-400 mt-1">
                    Envios via Correios e transportadoras com rastreamento ativo e embalagens 100%
                    discretas.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-4">
                <div className="p-3 rounded-lg bg-zinc-800 text-white shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-lg text-white">
                    Produtos Originais Garantidos
                  </h4>
                  <p className="text-sm text-zinc-400 mt-1">
                    Trabalhamos exclusivamente com marcas consagradas, vidraria resistente e
                    matéria-prima premium.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Quick CTA Banner */}
      <section id="contato" className="py-14 bg-zinc-100 border-b border-zinc-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-display font-bold text-2xl text-zinc-950">
              Ficou com alguma dúvida sobre aparelhos ou peças?
            </h3>
            <p className="text-sm text-zinc-600">
              Nossa equipe está disponível online para te recomendar o acessório perfeito.
            </p>
          </div>
          <a
            href={buildWhatsAppUrl(
              whatsappPhone,
              'Olá! Gostaria de tirar dúvidas com o suporte da loja.',
            )}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-md font-semibold text-sm bg-[#25D366] hover:bg-[#1EBE5A] text-white shadow transition-all hover:scale-102"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            Falar com Atendente
          </a>
        </div>
      </section>
    </div>
  )
}
