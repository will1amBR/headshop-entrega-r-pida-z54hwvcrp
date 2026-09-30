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
import { Clock, Tag, Sparkles, ArrowRight, X } from 'lucide-react'
import { useCart } from '@/context/CartContext'

export const InactivityDiscountModal: React.FC = () => {
  const navigate = useNavigate()
  const { isOfferModalOpen, dismissInactivityOffer, inactivityDiscount } = useCart()

  if (!isOfferModalOpen || !inactivityDiscount.isActive) {
    return null
  }

  const minutes = Math.floor(inactivityDiscount.remainingSeconds / 60)
  const seconds = inactivityDiscount.remainingSeconds % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const handleClaim = () => {
    dismissInactivityOffer()
    navigate('/checkout')
  }

  return (
    <Dialog open={isOfferModalOpen} onOpenChange={(open) => !open && dismissInactivityOffer()}>
      <DialogContent className="sm:max-w-[460px] p-6 bg-[#0A0A0A] text-white border border-zinc-800 shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200">
        <DialogHeader className="space-y-3 text-left">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              Oferta Especial Relâmpago
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 font-mono text-xs font-bold text-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{formattedTime}</span>
            </div>
          </div>

          <DialogTitle className="font-display font-extrabold text-2xl text-white tracking-tight leading-snug">
            Ainda está aí?
          </DialogTitle>
          <DialogDescription className="text-zinc-300 text-sm leading-relaxed">
            Pegue esse desconto especial para você fechar agora mesmo, mas você tem só 5 minutos.
          </DialogDescription>
        </DialogHeader>

        {/* Card de Destaque do Desconto */}
        <div className="my-3 p-4 rounded-xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-700 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-[#25D366]/20 text-[#25D366] flex items-center justify-center font-black text-lg">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display font-bold text-lg text-white">2% OFF Extra</div>
                <div className="text-xs text-zinc-400 font-mono">
                  Aplicado automaticamente no carrinho & checkout
                </div>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs text-zinc-400 block uppercase">Expira em</span>
              <span className="text-base font-bold text-[#25D366]">{formattedTime}</span>
            </div>
          </div>
          <div className="text-[11px] text-zinc-400 border-t border-zinc-700/60 pt-2 flex items-center justify-between">
            <span>✓ Acumula com kit promocional 5%</span>
            <span>✓ Válido em todo o site</span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={dismissInactivityOffer}
            className="order-2 sm:order-1 text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs sm:text-sm h-11"
          >
            Continuar navegando
          </Button>
          <Button
            type="button"
            onClick={handleClaim}
            className="order-1 sm:order-2 flex-1 bg-[#25D366] hover:bg-[#1EBE5A] text-white font-bold text-xs sm:text-sm h-11 shadow-lg gap-2"
          >
            <span>Aproveitar e Fechar Agora</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
