import React from 'react'
import { Link } from 'react-router-dom'
import { Clock, Tag, ArrowRight } from 'lucide-react'
import { useCart } from '@/context/CartContext'

export const InactivityBanner: React.FC = () => {
  const { inactivityDiscount } = useCart()

  if (!inactivityDiscount.isActive) {
    return null
  }

  const minutes = Math.floor(inactivityDiscount.remainingSeconds / 60)
  const seconds = inactivityDiscount.remainingSeconds % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div className="bg-gradient-to-r from-amber-500 via-emerald-600 to-emerald-700 text-white text-xs py-2 px-4 shadow-sm">
      <div className="max-w-[1240px] mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <Tag className="w-3.5 h-3.5" />
          <span>
            <strong>Desconto especial de 2% ativado!</strong> Você tem{' '}
            <span className="font-mono font-bold underline">{formattedTime}</span> para fechar com
            esse valor promocional.
          </span>
        </div>
        <Link
          to="/checkout"
          className="inline-flex items-center gap-1 font-bold underline hover:text-zinc-100 uppercase tracking-wider text-[11px] font-mono"
        >
          Ir para o Checkout
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
