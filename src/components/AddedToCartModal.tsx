import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react'
import { formatBRL, getFileUrl, getProductFallbackImage } from '@/lib/formatters'
import { Product } from '@/types/ecommerce'

interface AddedToCartModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  quantity?: number
}

export const AddedToCartModal: React.FC<AddedToCartModalProps> = ({
  isOpen,
  onClose,
  product,
  quantity = 1,
}) => {
  const navigate = useNavigate()

  if (!product) return null

  const imageUrl = product.image
    ? getFileUrl('products', product.id, product.image)
    : getProductFallbackImage(product.name, product.expand?.category?.slug)

  const handleCheckout = () => {
    onClose()
    navigate('/checkout')
  }

  const handleContinueShopping = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px] p-6 bg-white border border-zinc-200 shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-mono text-xs uppercase font-bold tracking-wider">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Produto Adicionado</span>
          </div>
          <DialogTitle className="font-display font-bold text-xl sm:text-2xl text-zinc-950">
            Deseja finalizar a compra ou mais produtos?
          </DialogTitle>
          <DialogDescription className="text-zinc-600 text-xs sm:text-sm">
            O item já está seguro no seu carrinho com entrega rápida e discreta.
          </DialogDescription>
        </DialogHeader>

        {/* Produto preview */}
        <div className="my-4 p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center gap-3">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-14 h-14 rounded-lg object-cover border border-zinc-200 bg-white shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-sm text-zinc-900 truncate">{product.name}</h4>
            <div className="flex items-center justify-between text-xs text-zinc-500 mt-0.5">
              <span>Qtd: {quantity}</span>
              <span className="font-mono font-bold text-zinc-950">
                {formatBRL(product.price * quantity)}
              </span>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={handleContinueShopping}
            className="flex-1 order-2 sm:order-1 border-zinc-300 hover:bg-zinc-100 text-zinc-800 text-xs sm:text-sm h-11"
          >
            Continuar comprando
          </Button>
          <Button
            type="button"
            onClick={handleCheckout}
            className="flex-1 order-1 sm:order-2 bg-[#0A0A0A] hover:bg-zinc-800 text-white font-semibold text-xs sm:text-sm h-11 shadow-md gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            Finalizar compra
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
