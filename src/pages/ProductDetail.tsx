import React, { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  ShoppingCart,
  Truck,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Clock,
  MapPin,
  Share2,
  Copy,
  ZoomIn,
  Package,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react'
import {
  Product,
  BrazilRegion,
  REGION_SHIPPING_RATES,
  FREE_SHIPPING_THRESHOLD,
} from '@/types/ecommerce'
import { getProductById, getProducts } from '@/services/products'
import { getSeoSettings } from '@/services/seo'
import { formatBRL, getFileUrl, getProductFallbackImage } from '@/lib/formatters'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/ProductCard'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [justAdded, setJustAdded] = useState(false)
  const [whatsappPhone, setWhatsappPhone] = useState('5548992463428')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [selectedShippingRegion, setSelectedShippingRegion] = useState<BrazilRegion>('Sudeste')

  useEffect(() => {
    async function load() {
      if (!id) return
      setIsLoading(true)
      try {
        const [prod, seo] = await Promise.all([getProductById(id), getSeoSettings()])

        if (seo?.whatsapp_number) {
          setWhatsappPhone(seo.whatsapp_number)
        }

        if (prod) {
          setProduct(prod)

          // Atualização dinâmica de metatags / SEO para compartilhamento
          const cleanTitle = `${prod.name} | HeadShop Entrega Rápida`
          const cleanDesc = prod.description
            ? prod.description.slice(0, 155) + '...'
            : 'Compre com entrega rápida em São Paulo e envio para todo o Brasil na HeadShop Entrega Rápida.'

          document.title = cleanTitle

          // Atualizar metatags padrão
          let metaDesc = document.querySelector('meta[name="description"]')
          if (!metaDesc) {
            metaDesc = document.createElement('meta')
            metaDesc.setAttribute('name', 'description')
            document.head.appendChild(metaDesc)
          }
          metaDesc.setAttribute('content', cleanDesc)

          // Open Graph / WhatsApp / Facebook
          const setOgMeta = (prop: string, val: string) => {
            let tag = document.querySelector(`meta[property="${prop}"]`)
            if (!tag) {
              tag = document.createElement('meta')
              tag.setAttribute('property', prop)
              document.head.appendChild(tag)
            }
            tag.setAttribute('content', val)
          }

          const prodImg = prod.image
            ? getFileUrl('products', prod.id, prod.image)
            : getProductFallbackImage(prod.name, prod.expand?.category?.slug)

          setOgMeta('og:title', cleanTitle)
          setOgMeta('og:description', cleanDesc)
          setOgMeta('og:image', prodImg)
          setOgMeta('og:url', window.location.href)
          setOgMeta('og:type', 'product')

          // Carregar produtos relacionados da mesma categoria
          const allFromCat = await getProducts({ category: prod.category })
          setRelatedProducts(allFromCat.filter((p) => p.id !== prod.id).slice(0, 4))
        }
      } catch (err) {
        console.error('Erro ao carregar produto', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
    setQuantity(1)
    setSelectedImageIndex(0)
  }, [id])

  if (isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-zinc-100 rounded-2xl" />
          <div className="space-y-6">
            <div className="h-8 bg-zinc-200 w-3/4 rounded-lg" />
            <div className="h-6 bg-zinc-100 w-1/4 rounded-lg" />
            <div className="h-28 bg-zinc-100 rounded-xl" />
            <div className="h-12 bg-zinc-100 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-24 text-center space-y-4">
        <h2 className="font-display font-bold text-2xl">Produto não encontrado</h2>
        <p className="text-zinc-600 text-sm">
          O produto solicitado pode ter sido descontinuado ou o link está incorreto.
        </p>
        <Button
          onClick={() => navigate('/produtos')}
          className="bg-[#0A0A0A] hover:bg-zinc-800 text-white"
        >
          Voltar para a vitrine
        </Button>
      </div>
    )
  }

  const primaryImageUrl = product.image
    ? getFileUrl('products', product.id, product.image)
    : getProductFallbackImage(product.name, product.expand?.category?.slug)

  // Galeria de ângulos/vistas do produto
  const galleryImages = [
    { url: primaryImageUrl, label: 'Visão Principal' },
    {
      url: getProductFallbackImage(`${product.name} detalhe`, product.expand?.category?.slug),
      label: 'Detalhe & Acabamento',
    },
    {
      url: getProductFallbackImage(`${product.name} embalagem`, product.expand?.category?.slug),
      label: 'Embalagem & Kit',
    },
  ]

  const activeImage = galleryImages[selectedImageIndex]?.url || primaryImageUrl

  const isOutOfStock = product.stock <= 0
  const maxAllowed = product.stock > 0 ? product.stock : 1

  const handleAddToCart = () => {
    if (isOutOfStock) return
    addItem(product, quantity)
    setJustAdded(true)
    setTimeout(() => {
      setJustAdded(false)
    }, 1500)
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const directWhatsAppLink = buildWhatsAppUrl(
    whatsappPhone,
    `Olá! Tenho dúvidas sobre o produto *${product.name}* (R$ ${product.price.toFixed(2).replace('.', ',')}${product.ncm ? ` - NCM ${product.ncm}` : ''}) disponível na loja. Poderia me atender?`,
  )

  const currentRegionRate = REGION_SHIPPING_RATES[selectedShippingRegion]
  const isFreeShipping = product.price * quantity >= FREE_SHIPPING_THRESHOLD

  return (
    <div className="py-8 sm:py-12 bg-white">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-14">
        {/* Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 font-medium">
          <Link to="/" className="hover:text-black transition-colors">
            Início
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <Link to="/produtos" className="hover:text-black transition-colors">
            Catálogo
          </Link>
          {product.expand?.category && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <Link
                to={`/produtos?categoria=${product.expand.category.slug}`}
                className="hover:text-black transition-colors"
              >
                {product.expand.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-900 font-semibold truncate max-w-[240px]">{product.name}</span>
        </div>

        {/* Product Details Grid: Left Gallery & Right Technical / Buy Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Interactive Gallery + Zoom */}
          <div className="lg:col-span-6 space-y-4">
            {/* Main Stage Image with Zoom on Hover and click to inspect */}
            <div className="relative aspect-square w-full rounded-2xl bg-zinc-50 border border-zinc-200 overflow-hidden group shadow-xs">
              <img
                src={activeImage}
                alt={product.name}
                onClick={() => setIsZoomModalOpen(true)}
                className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-125 cursor-zoom-in"
              />

              {product.featured && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge className="bg-[#0A0A0A] text-white font-semibold text-xs px-3 py-1 uppercase tracking-wider shadow-sm">
                    Destaque da Loja
                  </Badge>
                </div>
              )}

              {/* Botão de ampliação / zoom no canto inferior */}
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(true)}
                className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-md hover:bg-white text-zinc-900 border border-zinc-200 p-2 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 text-xs font-semibold px-2.5"
                title="Ampliar imagem do produto"
              >
                <ZoomIn className="w-4 h-4" />
                <span className="hidden sm:inline">Ampliar</span>
              </button>
            </div>

            {/* Thumbnail Gallery Switcher */}
            <div className="grid grid-cols-3 gap-3">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all p-1 bg-zinc-50 ${
                    selectedImageIndex === idx
                      ? 'border-black ring-2 ring-black/10 shadow-xs'
                      : 'border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`${product.name} miniatura ${idx + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono px-1">
              <span>Passe o mouse para zoom ou clique para tela cheia</span>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1 text-zinc-600 hover:text-black font-medium transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Link copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Compartilhar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Title, Category, Price, Technical Details, Actions, Shipping */}
          <div className="lg:col-span-6 space-y-6">
            {/* Category tag & Stock Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {product.expand?.category ? (
                  <Badge
                    variant="outline"
                    className="border-zinc-300 font-mono text-xs uppercase tracking-wider bg-zinc-50"
                  >
                    {product.expand.category.name}
                  </Badge>
                ) : null}

                {product.ncm && (
                  <span className="text-[11px] font-mono text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded font-semibold">
                    NCM: {product.ncm}
                  </span>
                )}
              </div>

              {isOutOfStock ? (
                <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded">
                  Sob Encomenda / Esgotado
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Pronta Entrega ({product.stock} un.)
                </span>
              )}
            </div>

            {/* Product Title & Pricing */}
            <div className="space-y-2">
              <h1 className="font-display font-bold text-2xl sm:text-4xl text-zinc-950 tracking-tight leading-tight">
                {product.name}
              </h1>

              <div className="pt-2 flex flex-wrap items-baseline gap-3">
                <span className="font-mono font-extrabold text-3xl sm:text-4xl text-zinc-950">
                  {formatBRL(product.price)}
                </span>
                <span className="text-xs text-zinc-500 font-mono uppercase bg-zinc-100 px-2.5 py-1 rounded">
                  Em até 12x no cartão ou PIX com confirmação imediata
                </span>
              </div>
            </div>

            {/* Description & Technical Specification */}
            <div className="border-t border-b border-zinc-200 py-5 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-400">
                Descrição Detalhada
              </h3>
              <p className="text-sm sm:text-base text-zinc-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>

              {/* Technical Specifications Sheet */}
              <div className="pt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                  <span className="text-zinc-500 block text-[10px] uppercase">Código / ID:</span>
                  <span className="font-bold text-zinc-900">#{product.id}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                  <span className="text-zinc-500 block text-[10px] uppercase">
                    Classificação Fiscal:
                  </span>
                  <span className="font-bold text-zinc-900">
                    {product.ncm ? `NCM ${product.ncm}` : 'Acessório Tabacaria'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity Selector & CTAs */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-zinc-700">Quantidade:</span>
                <div className="flex items-center border border-zinc-300 rounded-md bg-white">
                  <button
                    type="button"
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2.5 text-zinc-600 hover:text-black hover:bg-zinc-100 disabled:opacity-40 transition-colors"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-mono font-bold text-sm text-zinc-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= maxAllowed || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.min(maxAllowed, q + 1))}
                    className="p-2.5 text-zinc-600 hover:text-black hover:bg-zinc-100 disabled:opacity-40 transition-colors"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs font-mono text-zinc-500">
                  Subtotal:{' '}
                  <strong className="text-zinc-950 font-bold">
                    {formatBRL(product.price * quantity)}
                  </strong>
                </span>
              </div>

              {/* Action Buttons: Add to Cart & WhatsApp */}
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <Button
                  size="lg"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className={`flex-1 font-semibold text-sm sm:text-base h-12 shadow-md transition-all ${
                    justAdded
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[#0A0A0A] hover:bg-zinc-800 text-white'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />✓ Adicionado ao Carrinho!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Adicionar ao Carrinho
                    </>
                  )}
                </Button>

                <a
                  href={directWhatsAppLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center px-4 h-12 rounded-md font-semibold text-xs sm:text-sm border border-zinc-300 hover:border-black bg-zinc-50 hover:bg-zinc-100 text-zinc-900 gap-2 transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366] fill-current" />
                  Tirar Dúvidas no WhatsApp
                </a>
              </div>
            </div>

            {/* Simulação de Frete por Região & Informações de Entrega Rápida em SP */}
            <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/70 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-zinc-900" />
                  <h4 className="font-display font-bold text-zinc-950">
                    Cálculo de Frete e Prazos por Região
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded">
                  Grátis acima de R$ 299
                </span>
              </div>

              {/* Seletor de Região */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {(['Sudeste', 'Sul', 'Centro-Oeste', 'Nordeste', 'Norte'] as BrazilRegion[]).map(
                  (reg) => (
                    <button
                      key={reg}
                      type="button"
                      onClick={() => setSelectedShippingRegion(reg)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                        selectedShippingRegion === reg
                          ? 'bg-zinc-950 text-white shadow-xs font-bold'
                          : 'bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-400'
                      }`}
                    >
                      {reg}
                    </button>
                  ),
                )}
              </div>

              {/* Resultado do Frete */}
              <div className="p-3 bg-white border border-zinc-200 rounded-lg flex items-center justify-between font-mono">
                <div>
                  <span className="font-semibold text-zinc-900 block font-sans">
                    Envio para a Região {selectedShippingRegion}:
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {selectedShippingRegion === 'Sudeste'
                      ? 'Entrega Expressa em São Paulo / Região Sudeste (1 a 3 dias úteis)'
                      : 'Envio seguro rastreado para toda a região (3 a 8 dias úteis)'}
                  </span>
                </div>
                <div className="text-right">
                  <strong className="text-sm font-bold text-zinc-950">
                    {isFreeShipping ? 'FRETE GRÁTIS' : formatBRL(currentRegionRate)}
                  </strong>
                </div>
              </div>

              <div className="flex items-start gap-2 text-[11px] text-zinc-500 pt-1">
                <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Entrega Rápida em SP:</strong> Pedidos aprovados até as 14h são
                  despachados no mesmo dia para a capital paulista e Grande SP.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Zoom em Tela Cheia */}
        {isZoomModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsZoomModalOpen(false)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-auto max-h-[85vh] object-contain rounded-xl shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white text-black p-2 rounded-full font-bold text-sm shadow-md"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Related Products Carousel / Grid */}
        {relatedProducts.length > 0 && (
          <div className="pt-12 border-t border-zinc-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold block">
                  Combine sua sessão
                </span>
                <h2 className="font-display font-bold text-2xl text-zinc-950">
                  Produtos Relacionados da Categoria
                </h2>
              </div>
              <Link
                to={`/produtos?categoria=${product.expand?.category?.slug || ''}`}
                className="text-xs font-semibold hover:underline flex items-center gap-1"
              >
                Ver todos da categoria →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
