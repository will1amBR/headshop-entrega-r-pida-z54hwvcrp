import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  MessageCircle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Flame,
  Zap,
  TrendingUp,
  Tag,
  ShieldCheck,
  Truck,
  Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Product, Category, SeoSettings } from '@/types/ecommerce'
import { getCategories } from '@/services/categories'
import { getProducts } from '@/services/products'
import { getSeoSettings } from '@/services/seo'
import { getCategoryFallbackImage } from '@/lib/formatters'
import { ProductCard } from '@/components/ProductCard'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { useSeoMeta } from '@/hooks/use-seo-meta'

export default function IndexPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [seo, setSeo] = useState<SeoSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [cats, prods, seoData] = await Promise.all([
          getCategories(),
          getProducts({ activeOnly: true }),
          getSeoSettings(),
        ])
        setCategories(cats)
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

  const whatsappPhone = seo?.whatsapp_number || '5548992463428'

  useSeoMeta({
    title: seo?.hero_title
      ? `${seo.hero_title} | HeadShop Entrega Rápida`
      : 'HeadShop Entrega Rápida — Headshop com entrega rápida em São Paulo',
    description:
      seo?.hero_subtitle ||
      'Compre sedas, dichavadores, bongs, vaporizadores e acessórios originais com entrega expressa em São Paulo e envio seguro para todo o Brasil.',
    image: '/og-image.svg',
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: 'HeadShop Entrega Rápida',
      description:
        'Acessórios para fumo, sedas, bongs, dichavadores e vaporizadores com entrega expressa.',
      url:
        typeof window !== 'undefined'
          ? window.location.origin
          : 'https://headshopentregarapida.com.br',
      telephone: `+${whatsappPhone}`,
      priceRange: '$$',
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: '09:00',
          closes: '23:00',
        },
      ],
    },
  })

  // 1. Mais Vendidos (featured = true, max 8)
  const bestSellers = useMemo(() => {
    return allProducts.filter((p) => p.featured).slice(0, 8)
  }, [allProducts])

  // 2. Ofertas & Acessórios Essenciais (preço <= 80, max 8)
  const dealsAndEssentials = useMemo(() => {
    return allProducts.filter((p) => p.price <= 90).slice(0, 8)
  }, [allProducts])

  // 3. Bongs & Vidrarias em Destaque (ou Sedas & Acessórios em Destaque)
  const glassAndBongHighlights = useMemo(() => {
    return allProducts
      .filter(
        (p) => p.expand?.category?.slug === 'bongs-pipes' || p.expand?.category?.slug === 'pipes',
      )
      .slice(0, 6)
  }, [allProducts])

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section - Monocromático de Alto Contraste */}
      <section className="relative min-h-[75vh] sm:min-h-[85vh] bg-[#0A0A0A] text-white flex items-center border-b border-zinc-800 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column (55%) */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-7 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono tracking-wider text-zinc-300 uppercase">
              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping" />
              Entrega Rápida em SP • Envio Brasil
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.08] text-white">
              {seo?.hero_title || 'Sua loja headshop com entrega rápida em São Paulo'}
            </h1>

            <p className="text-zinc-400 text-sm sm:text-lg max-w-xl font-normal leading-relaxed">
              {seo?.hero_subtitle ||
                'Os melhores vaporizadores, sedas de cânhamo, dichavadores e pipes artesanais com entrega expressa em São Paulo e envio seguro para todo o Brasil. Atendimento imediato e pedidos via WhatsApp.'}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <Button
                size="lg"
                onClick={() => navigate('/produtos')}
                className="bg-white hover:bg-zinc-200 text-[#0A0A0A] font-semibold px-7 h-12 text-sm sm:text-base shadow-xl transition-all"
              >
                Explorar Catálogo Completo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <a
                href={buildWhatsAppUrl(
                  whatsappPhone,
                  'Olá! Estou na HeadShop Entrega Rápida e gostaria de pedir ajuda para escolher produtos.',
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center h-12 px-6 rounded-md font-semibold text-sm sm:text-base border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-white transition-all gap-2"
              >
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
                Pedir pelo WhatsApp
              </a>
            </div>

            {/* Quick bullet trust points */}
            <div className="pt-4 grid grid-cols-4 gap-2 border-t border-zinc-800/80 text-[11px] sm:text-xs font-mono text-zinc-400">
              <div>
                <span className="block font-bold text-white text-xs sm:text-sm">Express</span>
                Rápida em SP
              </div>
              <div>
                <span className="block font-bold text-white text-xs sm:text-sm">R$ 299+</span>
                Frete Grátis
              </div>
              <div>
                <span className="block font-bold text-white text-xs sm:text-sm">100%</span>
                Originais
              </div>
              <div>
                <span className="block font-bold text-white text-xs sm:text-sm">Assistente</span>
                Will no Chat
              </div>
            </div>
          </div>

          {/* Right Column (45%) — Card Destaque */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-[380px] sm:max-w-[420px] aspect-square rounded-2xl bg-gradient-to-b from-zinc-800/80 to-zinc-900 border border-zinc-700/80 p-5 sm:p-6 shadow-2xl flex flex-col justify-between overflow-hidden group">
              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#25D366]" />
                  Destaque da Semana
                </span>
                <span className="text-[11px] font-mono font-bold text-[#25D366] bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                  Em Estoque
                </span>
              </div>

              <div className="relative my-auto flex items-center justify-center p-2">
                <img
                  src="https://img.usecurling.com/p/600/600?q=borosilicate%20glass%20bong"
                  alt="Destaque HeadShop"
                  className="w-3/4 sm:w-4/5 h-auto object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="z-10 bg-black/75 backdrop-blur-md border border-zinc-800 p-3.5 sm:p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-display font-semibold text-sm sm:text-base text-white">
                    Bong Vidro Percolador
                  </h4>
                  <p className="text-[11px] sm:text-xs text-zinc-400 font-mono">
                    Borossilicato • Super Filtragem
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate('/produtos?categoria=bongs-pipes')}
                  className="bg-white text-black hover:bg-zinc-200 text-xs font-semibold h-8 px-3"
                >
                  Conferir
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Navegação por Categoria — 4 Blocos / Cards Clean */}
      <section className="py-10 sm:py-16 bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 block">
                Departamentos
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950 tracking-tight">
                Navegue por Categoria
              </h2>
            </div>
            <Link
              to="/produtos"
              className="text-xs sm:text-sm font-semibold text-zinc-900 hover:text-black flex items-center gap-1 group whitespace-nowrap"
            >
              Ver todas
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            {categories
              .filter((cat) => {
                const count = allProducts.filter(
                  (p) => p.expand?.category?.slug === cat.slug || p.category === cat.id,
                ).length
                return count > 0
              })
              .map((cat) => {
                const bgImg = getCategoryFallbackImage(cat.slug)
                const count = allProducts.filter(
                  (p) => p.expand?.category?.slug === cat.slug || p.category === cat.id,
                ).length
                return (
                  <button
                    key={cat.id}
                    onClick={() => navigate(`/produtos?categoria=${cat.slug}`)}
                    className="group relative h-36 sm:h-44 rounded-xl overflow-hidden border border-zinc-200 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none bg-zinc-900"
                  >
                    <img
                      src={bgImg}
                      alt={cat.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-75 group-hover:opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent flex flex-col justify-end p-3 sm:p-4">
                      <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest">
                        {count > 0 ? `${count} itens` : 'Catálogo'}
                      </span>
                      <h3 className="font-display font-bold text-sm sm:text-base text-white group-hover:underline">
                        {cat.name}
                      </h3>
                    </div>
                  </button>
                )
              })}
          </div>
        </div>
      </section>

      {/* 3. Seção: Mais Vendidos (Carrossel Horizontal com Snap Scroll no Mobile) */}
      <section className="py-12 sm:py-18 bg-white border-b border-zinc-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500">
                <TrendingUp className="w-3.5 h-3.5 text-[#25D366]" />
                Top Escolhas
              </div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950 tracking-tight">
                Mais Vendidos
              </h2>
            </div>
            <Link
              to="/produtos"
              className="text-xs sm:text-sm font-semibold text-zinc-900 hover:text-black flex items-center gap-1 group whitespace-nowrap"
            >
              Ver todos ({bestSellers.length})
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="w-[240px] sm:w-[270px] shrink-0 h-80 bg-zinc-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : (
            /* Snap Scroll Horizontal no Mobile, Grid 4 colunas em telas maiores */
            <div className="relative">
              <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-3 sm:pb-0 scroll-smooth snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                {bestSellers.map((product) => (
                  <div
                    key={product.id}
                    className="w-[260px] sm:w-auto shrink-0 snap-start flex flex-col"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
              {/* Dica visual de scroll horizontal exclusiva no mobile */}
              <div className="sm:hidden flex items-center justify-between pt-2 text-[11px] font-mono text-zinc-400">
                <span>← Deslize para ver mais →</span>
                <span>{bestSellers.length} produtos</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Banner Consultor Will / Vendedor IA */}
      <section className="py-8 bg-zinc-950 text-white border-b border-zinc-800">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-[#25D366]" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#25D366] font-bold">
                  Atendimento Inteligente 24h
                </span>
                <h3 className="font-display font-bold text-lg sm:text-xl text-white">
                  Dúvida sobre o que comprar? Fale com o Will!
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Nosso consultor nativo te indica o modelo ideal, combina acessórios e monta seu
                  carrinho para o WhatsApp.
                </p>
              </div>
            </div>

            <Button
              onClick={() => {
                const btn = document.querySelector(
                  'button[aria-label*="chat"]',
                ) as HTMLButtonElement
                btn?.click()
              }}
              className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs sm:text-sm h-10 px-5 shrink-0 whitespace-nowrap shadow"
            >
              Iniciar Chat com Will
            </Button>
          </div>
        </div>
      </section>

      {/* 5. Seção: Ofertas & Essenciais (Carrossel Horizontal no Mobile) */}
      <section className="py-12 sm:py-18 bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500">
                <Tag className="w-3.5 h-3.5 text-zinc-800" />
                Custo-Benefício
              </div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950 tracking-tight">
                Essenciais da Sessão até R$ 90
              </h2>
            </div>
            <Link
              to="/produtos"
              className="text-xs sm:text-sm font-semibold text-zinc-900 hover:text-black flex items-center gap-1 group whitespace-nowrap"
            >
              Ver todos
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="relative">
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-3 sm:pb-0 scroll-smooth snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              {dealsAndEssentials.map((product) => (
                <div
                  key={product.id}
                  className="w-[260px] sm:w-auto shrink-0 snap-start flex flex-col"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            <div className="sm:hidden flex items-center justify-between pt-2 text-[11px] font-mono text-zinc-400">
              <span>← Deslize para ver mais →</span>
              <span>{dealsAndEssentials.length} produtos</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Seção: Linha de Bongs & Pipes (Carrossel Horizontal no Mobile) */}
      <section className="py-12 sm:py-18 bg-white border-b border-zinc-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500">
                <Zap className="w-3.5 h-3.5 text-[#25D366]" />
                Vidraria & Filtragem
              </div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950 tracking-tight">
                Bongs & Pipes
              </h2>
            </div>
            <Link
              to="/produtos?categoria=bongs-pipes"
              className="text-xs sm:text-sm font-semibold text-zinc-900 hover:text-black flex items-center gap-1 group whitespace-nowrap"
            >
              Ver categoria
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="relative">
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto pb-3 sm:pb-0 scroll-smooth snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              {glassAndBongHighlights.map((product) => (
                <div
                  key={product.id}
                  className="w-[260px] sm:w-auto shrink-0 snap-start flex flex-col"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            <div className="sm:hidden flex items-center justify-between pt-2 text-[11px] font-mono text-zinc-400">
              <span>← Deslize para ver mais →</span>
              <span>{glassAndBongHighlights.length} produtos</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Call To Action para o Catálogo Geral */}
      <section className="py-12 sm:py-16 bg-zinc-100 border-b border-zinc-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 text-center space-y-4">
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
            Procurando algo específico?
          </h3>
          <p className="text-sm text-zinc-600 max-w-lg mx-auto">
            Acesse nosso catálogo completo com dezenas de itens organizados por filtros de preço,
            busca direta e categorias.
          </p>
          <div className="pt-2">
            <Button
              size="lg"
              onClick={() => navigate('/produtos')}
              className="bg-[#0A0A0A] hover:bg-zinc-800 text-white font-semibold px-8 h-12 text-sm shadow-md"
            >
              Abrir Catálogo Completo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* 8. Trust & Delivery Information */}
      <section
        id="sobre"
        className="py-16 sm:py-24 bg-[#0A0A0A] text-white border-b border-zinc-800"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-14 items-center">
            <div className="space-y-5">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
                Sobre a HeadShop
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-4xl tracking-tight leading-tight">
                Tradição, agilidade e segurança na sua compra.
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                Nascemos com o propósito de simplificar a sua experiência. Sem cadastros complexos:
                você escolhe os produtos, calcula o frete com transparência e fecha tudo diretamente
                com nossa equipe ou assistente no WhatsApp.
              </p>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                Nossos produtos são testados, originais e embalados em caixas 100% discretas para
                sua privacidade.
              </p>
            </div>

            {/* Badges Column */}
            <div className="space-y-3.5">
              <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-zinc-800 text-[#25D366] shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-base text-white">
                    Compra Segura via WhatsApp
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                    Atendimento imediato com atendente humano ou nosso vendedor IA para tirar
                    dúvidas e gerar o pedido.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-zinc-800 text-white shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-base text-white">
                    Entrega Rápida em SP & Envio Brasil
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                    Agilidade em São Paulo capital e Grande SP, além de envio seguro para todo o
                    Brasil (Frete Grátis acima de R$ 299).
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-zinc-800 text-white shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-base text-white">
                    Produtos Originais Garantidos
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                    Trabalhamos exclusivamente com marcas consagradas, vidraria resistente e peças
                    de alta durabilidade.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
