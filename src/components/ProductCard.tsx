import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ShoppingCart } from 'lucide-react'
import { Product } from '@/types/ecommerce'
import { formatBRL, getFileUrl, getProductFallbackImage } from '@/lib/formatters'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ProductCardProps {
  product: Product
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const imageUrl = product.image
    ? getFileUrl('products', product.id, product.image)
    : getProductFallbackImage(product.name, product.expand?.category?.slug)

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, 1)
    setJustAdded(true)
    setTimeout(() => {
      setJustAdded(false)
    }, 1200)
  }

  const isOutOfStock = product.stock <= 0

  return (
    <div className="group relative flex flex-col bg-white border border-zinc-200 rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-black/30">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {product.featured && (
          <Badge className="bg-[#0A0A0A] text-white hover:bg-[#0A0A0A] font-semibold text-[11px] px-2.5 py-0.5 rounded uppercase tracking-wider shadow-sm">
            Mais Vendido
          </Badge>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <Badge
            variant="secondary"
            className="bg-amber-100 text-amber-900 text-[10px] font-medium border-amber-300"
          >
            Últimas {product.stock} un.
          </Badge>
        )}
      </div>

      {/* Image container */}
      <Link
        to={`/produto/${product.id}`}
        className="block relative aspect-square bg-zinc-50 overflow-hidden border-b border-zinc-100"
      >
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white text-xs font-bold uppercase tracking-wider px-3 py-1 bg-zinc-900 border border-zinc-700 rounded">
              Esgotado
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
        <div className="space-y-1.5">
          {product.expand?.category && (
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block">
              {product.expand.category.name}
            </span>
          )}
          <Link to={`/produto/${product.id}`}>
            <h3 className="font-display font-semibold text-base sm:text-lg text-zinc-900 group-hover:text-black line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Action */}
        <div className="pt-4 mt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase">Preço</span>
            <span className="font-mono font-bold text-lg text-zinc-950">
              {formatBRL(product.price)}
            </span>
          </div>

          <Button
            size="sm"
            disabled={isOutOfStock}
            onClick={handleBuy}
            className={`font-medium transition-all duration-150 h-9 px-3 sm:px-4 text-xs ${
              justAdded
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-[#0A0A0A] hover:bg-zinc-800 text-white'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1" />✓ Adicionado
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                Comprar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
