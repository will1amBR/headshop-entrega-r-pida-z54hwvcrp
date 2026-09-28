import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, ArrowLeft } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { formatBRL, getFileUrl, getProductFallbackImage } from '@/lib/formatters'
import { ShippingCalculator } from '@/components/ShippingCalculator'
import { Button } from '@/components/ui/button'

export default function CartPage() {
  const navigate = useNavigate()
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    shipping,
    total,
    selectedRegion,
    isFreeShippingEligible,
  } = useCart()

  const handleCheckout = () => {
    if (!selectedRegion) {
      alert('Por favor, selecione sua região na Calculadora de Frete antes de fechar o pedido.')
      return
    }
    navigate('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="py-20 bg-white min-h-[70vh] flex items-center">
        <div className="max-w-[600px] mx-auto px-4 text-center space-y-6">
          <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-400">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
              Seu carrinho está vazio
            </h1>
            <p className="text-zinc-500 text-sm sm:text-base">
              Aproveite para conhecer nossos vaporizadores, sedas de alta qualidade, dichavadores e
              acessórios exclusivos.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => navigate('/produtos')}
            className="bg-[#0A0A0A] hover:bg-zinc-800 text-white font-medium"
          >
            Explorar Produtos
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-10 sm:py-16 bg-white min-h-[80vh]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold block">
              Etapa 1 de 2
            </span>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
              Meu Carrinho de Compras
            </h1>
          </div>
          <Link
            to="/produtos"
            className="text-xs sm:text-sm font-semibold text-zinc-600 hover:text-black flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Continuar Comprando
          </Link>
        </div>

        {/* 2 Columns: Items & Shipping (65%) | Summary (35% sticky) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Main Content (Items + Calculator) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Items List */}
            <div className="border border-zinc-200 rounded-xl overflow-hidden divide-y divide-zinc-200 bg-white shadow-sm">
              <div className="p-4 bg-zinc-50 flex items-center justify-between text-xs font-mono font-semibold uppercase text-zinc-500">
                <span>Produtos ({items.length})</span>
                <span>Subtotal</span>
              </div>

              {items.map((item) => {
                const img = item.image
                  ? getFileUrl('products', item.productId, item.image)
                  : getProductFallbackImage(item.name, item.category)

                const lineTotal = item.unit_price * item.quantity

                return (
                  <div
                    key={item.productId}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
                  >
                    {/* Thumbnail + Name + Unit Price */}
                    <div className="flex items-center gap-4 flex-1">
                      <Link
                        to={`/produto/${item.productId}`}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-zinc-50 border border-zinc-200 overflow-hidden shrink-0"
                      >
                        <img
                          src={img}
                          alt={item.name}
                          className="w-full h-full object-cover object-center"
                        />
                      </Link>
                      <div className="space-y-1">
                        <Link
                          to={`/produto/${item.productId}`}
                          className="font-display font-semibold text-sm sm:text-base text-zinc-900 hover:underline line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <div className="text-xs text-zinc-500 font-mono">
                          Unitário: {formatBRL(item.unit_price)}
                        </div>
                      </div>
                    </div>

                    {/* Stepper + Line Total + Remove */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-100">
                      {/* Stepper */}
                      <div className="flex items-center border border-zinc-300 rounded bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1.5 text-zinc-600 hover:text-black hover:bg-zinc-100"
                          aria-label="Diminuir"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-9 text-center font-mono font-semibold text-xs text-zinc-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1.5 text-zinc-600 hover:text-black hover:bg-zinc-100"
                          aria-label="Aumentar"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right min-w-[80px]">
                        <span className="font-mono font-bold text-sm sm:text-base text-zinc-950 block">
                          {formatBRL(lineTotal)}
                        </span>
                      </div>

                      {/* Trash */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-zinc-400 hover:text-red-600 p-1 transition-colors"
                        title="Remover produto"
                        aria-label="Remover produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Shipping Calculator */}
            <ShippingCalculator />
          </div>

          {/* Sticky Summary Column (35%) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 space-y-6 shadow-sm">
              <h2 className="font-display font-bold text-lg text-zinc-950 pb-3 border-b border-zinc-200">
                Resumo do Pedido
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal ({items.length} itens):</span>
                  <span className="font-mono font-medium text-zinc-900">{formatBRL(subtotal)}</span>
                </div>

                <div className="flex justify-between text-zinc-600">
                  <div className="flex flex-col">
                    <span>Frete:</span>
                    <span className="text-[11px] text-zinc-400">
                      {selectedRegion ? `Região ${selectedRegion}` : 'Nenhuma região selecionada'}
                    </span>
                  </div>
                  <span className="font-mono font-medium text-zinc-900">
                    {!selectedRegion ? (
                      <span className="text-xs text-amber-600 font-sans">Selecione a região</span>
                    ) : isFreeShippingEligible ? (
                      <strong className="text-emerald-600">GRÁTIS</strong>
                    ) : (
                      formatBRL(shipping)
                    )}
                  </span>
                </div>

                <div className="pt-4 border-t border-zinc-200 flex justify-between items-baseline">
                  <span className="font-display font-bold text-base text-zinc-950">
                    Total Previsto:
                  </span>
                  <span className="font-mono font-extrabold text-2xl text-zinc-950">
                    {formatBRL(total)}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <div className="space-y-3 pt-2">
                <Button
                  size="lg"
                  onClick={handleCheckout}
                  disabled={!selectedRegion}
                  className="w-full bg-[#0A0A0A] hover:bg-zinc-800 text-white font-semibold h-12 text-sm sm:text-base shadow-md disabled:opacity-50"
                >
                  Fechar Pedido
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                {!selectedRegion && (
                  <p className="text-xs text-center text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    ⚠️ Selecione sua região na calculadora acima para calcular o frete e avançar.
                  </p>
                )}
              </div>

              {/* Payment note & Fast SP Delivery badge */}
              <div className="pt-4 border-t border-zinc-200 space-y-2.5 text-xs text-zinc-500">
                <div className="flex items-center gap-2 text-zinc-800 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Pagamento combinado no WhatsApp</span>
                </div>
                <p className="leading-relaxed">
                  Na próxima etapa você confere os dados de entrega e envia a lista formatada direto
                  para nossa equipe pelo chat do WhatsApp.
                </p>
                <div className="p-2.5 rounded bg-zinc-100 border border-zinc-200/80 text-[11px] text-zinc-700 flex items-center gap-2">
                  <span className="font-bold text-black">⚡ Entrega Expressa:</span>
                  <span>Agilidade prioritária para pedidos na Grande São Paulo.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
