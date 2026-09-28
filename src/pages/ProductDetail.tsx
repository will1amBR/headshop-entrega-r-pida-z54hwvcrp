import React, { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { Product } from '@/types/ecommerce'
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
  const [whatsappPhone, setWhatsappPhone] = useState('5511999999999')

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
          // Load related products from same category
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
  }, [id])

  if (isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-zinc-100 rounded-xl" />
          <div className="space-y-6">
            <div className="h-8 bg-zinc-200 w-3/4 rounded" />
            <div className="h-6 bg-zinc-100 w-1/4 rounded" />
            <div className="h-24 bg-zinc-100 rounded" />
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
        <Button onClick={() => navigate('/produtos')}>Voltar para a loja</Button>
      </div>
    )
  }

  const imageUrl = product.image
    ? getFileUrl('products', product.id, product.image)
    : getProductFallbackImage(product.name, product.expand?.category?.slug)

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

  const directWhatsAppLink = buildWhatsAppUrl(
    whatsappPhone,
    `Olá! Tenho interesse no produto *${product.name}* (${formatBRL(product.price)}). Poderia me passar mais informações?`,
  )

  return (
    <div className="py-8 sm:py-14 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-16">
        {/* Breadcrumb / Back button */}
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
          <Link to="/produtos" className="hover:text-black flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar aos Produtos
          </Link>
          {product.expand?.category && (
            <>
              <span>/</span>
              <span className="text-zinc-800">{product.expand.category.name}</span>
            </>
          )}
        </div>

        {/* Product Details Section: Left Image, Right Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left: Large Image with zoom on hover */}
          <div className="lg:col-span-6">
            <div className="relative aspect-square w-full rounded-2xl bg-zinc-50 border border-zinc-200 overflow-hidden group shadow-sm">
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-125 cursor-zoom-in"
              />
              {product.featured && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge className="bg-[#0A0A0A] text-white font-semibold text-xs px-3 py-1 uppercase tracking-wider">
                    Mais Vendido
                  </Badge>
                </div>
              )}
            </div>
            <div className="mt-3 text-center text-xs text-zinc-400 font-mono">
              Passe o mouse sobre a imagem para dar zoom
            </div>
          </div>

          {/* Right: Product Info & Actions */}
          <div className="lg:col-span-6 space-y-6">
            {/* Category tag & Stock indicator */}
            <div className="flex items-center justify-between gap-2">
              {product.expand?.category ? (
                <Badge
                  variant="outline"
                  className="border-zinc-300 font-mono text-xs uppercase tracking-wider"
                >
                  {product.expand.category.name}
                </Badge>
              ) : (
                <div />
              )}

              {isOutOfStock ? (
                <span className="text-xs font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded">
                  Sob Encomenda / Esgotado
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Em estoque ({product.stock} disponíveis)
                </span>
              )}
            </div>

            {/* Title & Price */}
            <div className="space-y-2">
              <h1 className="font-display font-bold text-2xl sm:text-4xl text-zinc-950 tracking-tight leading-tight">
                {product.name}
              </h1>
              <div className="flex items-baseline gap-3 pt-2">
                <span className="font-mono font-extrabold text-3xl sm:text-4xl text-zinc-950">
                  {formatBRL(product.price)}
                </span>
                <span className="text-xs text-zinc-500 font-mono uppercase">Em até 12x ou PIX</span>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-b border-zinc-200 py-5">
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-400 mb-2">
                Descrição do Produto
              </h3>
              <p className="text-sm sm:text-base text-zinc-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Quantity Selector & Add to cart CTA */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-zinc-700">Quantidade:</span>
                <div className="flex items-center border border-zinc-300 rounded-md bg-white">
                  <button
                    type="button"
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 text-zinc-600 hover:text-black hover:bg-zinc-100 disabled:opacity-40"
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
                    className="p-2 text-zinc-600 hover:text-black hover:bg-zinc-100 disabled:opacity-40"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CTAs */}
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
                  className="inline-flex items-center justify-center px-4 h-12 rounded-md font-semibold text-sm border border-zinc-300 hover:border-black bg-zinc-50 hover:bg-zinc-100 text-zinc-900 gap-2 transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  Dúvidas no WhatsApp
                </a>
              </div>
            </div>

            {/* Shipping & Guarantee perks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-zinc-100 text-xs text-zinc-600">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                <Truck className="w-4 h-4 text-black shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-zinc-900 block">Entrega Rápida em SP</span>
                  <span>
                    Envio expresso em São Paulo e tabela fixa para todo o Brasil (grátis acima de R$
                    299).
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                <ShieldCheck className="w-4 h-4 text-black shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-zinc-900 block">Pagamento Seguro</span>
                  <span>Combinado direto no WhatsApp da loja.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="pt-12 border-t border-zinc-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold block">
                  Recomendados
                </span>
                <h2 className="font-display font-bold text-2xl text-zinc-950">
                  Produtos Relacionados
                </h2>
              </div>
              <Link to="/produtos" className="text-xs font-semibold hover:underline">
                Ver todos →
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
