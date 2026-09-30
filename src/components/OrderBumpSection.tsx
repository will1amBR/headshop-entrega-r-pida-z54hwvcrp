import React, { useMemo } from 'react'
import { Plus, Sparkles, Check, Flame } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { Product } from '@/types/ecommerce'
import { formatBRL } from '@/lib/formatters'
import { Button } from '@/components/ui/button'

interface OrderBumpProps {
  products: Product[]
}

interface BumpItem {
  id: string
  name: string
  category: string
  price: number
  image: string
  reason: string
  rawProduct: Product
}

export const OrderBumpSection: React.FC<OrderBumpProps> = ({ products }) => {
  const { items, addItem, kitDiscount } = useCart()

  // Analisa o que já está no carrinho
  const hasSeda = items.some((i) => {
    const n = i.name.toLowerCase()
    return n.includes('seda') && !n.includes('porta') && !n.includes('cone')
  })
  const hasDichavador = items.some((i) => i.name.toLowerCase().includes('dichavador'))
  const hasBong = items.some((i) => i.name.toLowerCase().includes('bong'))
  const hasCuia = items.some((i) => i.name.toLowerCase().includes('cuia'))
  const hasTesoura = items.some((i) => i.name.toLowerCase().includes('tesoura'))
  const hasPiteira = items.some((i) => i.name.toLowerCase().includes('piteira'))
  const hasTabaco = items.some((i) => {
    const n = i.name.toLowerCase()
    return n.includes('tabaco') || n.includes('fumo') || n.includes('pote') || n.includes('kumbaya')
  })

  // Sugestões inteligentes de Order Bump
  const suggestions = useMemo<BumpItem[]>(() => {
    if (products.length === 0) return []

    const bumps: BumpItem[] = []
    const cartProductIds = new Set(items.map((i) => i.productId))

    // Função auxiliar para achar produto por palavra-chave
    const findProduct = (kw: string) => {
      return products.find(
        (p) =>
          p.active && !cartProductIds.has(p.id) && p.name.toLowerCase().includes(kw.toLowerCase()),
      )
    }

    // Regra 1: Tem seda no carrinho -> Sugere Cuia ou Tesoura
    if (hasSeda) {
      if (!hasCuia) {
        const cuiaProd = findProduct('cuia')
        if (cuiaProd) {
          bumps.push({
            id: cuiaProd.id,
            name: cuiaProd.name,
            category: cuiaProd.category,
            price: cuiaProd.price,
            image: '/products/cuia-silicone.svg',
            reason: 'Comprou seda? Leve uma cuia antiaderente para misturar sem grudar nada!',
            rawProduct: cuiaProd,
          })
        }
      }
      if (!hasTesoura) {
        const tesouraProd = findProduct('tesoura')
        if (tesouraProd) {
          bumps.push({
            id: tesouraProd.id,
            name: tesouraProd.name,
            category: tesouraProd.category,
            price: tesouraProd.price,
            image: '/products/tesoura-dobravel.svg',
            reason: 'Que tal uma tesoura de precisão para picar com agilidade na sua cuia?',
            rawProduct: tesouraProd,
          })
        }
      }
    }

    // Regra 2: Tem dichavador -> Sugere seda ou piteira de vidro
    if (hasDichavador) {
      if (!hasSeda) {
        const sedaProd = findProduct('seda raw') || findProduct('seda')
        if (sedaProd) {
          bumps.push({
            id: sedaProd.id,
            name: sedaProd.name,
            category: sedaProd.category,
            price: sedaProd.price,
            image: '/products/seda-raw.svg',
            reason:
              'Comprou dichavador? Aproveite e leve a seda RAW Classic com queima ultralenta.',
            rawProduct: sedaProd,
          })
        }
      }
      if (!hasPiteira) {
        const piteiraProd = findProduct('piteira de vidro') || findProduct('piteira')
        if (piteiraProd) {
          bumps.push({
            id: piteiraProd.id,
            name: piteiraProd.name,
            category: piteiraProd.category,
            price: piteiraProd.price,
            image: '/products/piteira-vidro.svg',
            reason: 'Piteira de vidro borossilicato: resfria a fumaça e reduz danos.',
            rawProduct: piteiraProd,
          })
        }
      }
    }

    // Regra 3: Tem bong -> Sugere maçarico ou piteira
    if (hasBong) {
      const macaricoProd = findProduct('maçarico') || findProduct('macarico')
      if (macaricoProd) {
        bumps.push({
          id: macaricoProd.id,
          name: macaricoProd.name,
          category: macaricoProd.category,
          price: macaricoProd.price,
          image: '/products/macarico.svg',
          reason: 'Chama Jet Flame estável ideal para acender seu bong sem apagar no vento.',
          rawProduct: macaricoProd,
        })
      }
    }

    // Regra 4: Fallback se ainda tiver espaço (Isqueiro Clipper ou Pote Hermético)
    if (bumps.length < 2) {
      const clipperProd = findProduct('clipper') || findProduct('isqueiro')
      if (clipperProd && !bumps.some((b) => b.id === clipperProd.id)) {
        bumps.push({
          id: clipperProd.id,
          name: clipperProd.name,
          category: clipperProd.category,
          price: clipperProd.price,
          image: '/products/isqueiro-clipper.svg',
          reason: 'Isqueiro Clipper recarregável com pilão removível indispensável.',
          rawProduct: clipperProd,
        })
      }
    }

    if (bumps.length < 2) {
      const poteProd = findProduct('pote') || findProduct('mocó')
      if (poteProd && !bumps.some((b) => b.id === poteProd.id)) {
        bumps.push({
          id: poteProd.id,
          name: poteProd.name,
          category: poteProd.category,
          price: poteProd.price,
          image: '/products/pote-hermetico.svg',
          reason: 'Pote hermético anti-odor: conserva a cura e frescor das suas ervas.',
          rawProduct: poteProd,
        })
      }
    }

    return bumps.slice(0, 3)
  }, [products, items, hasSeda, hasCuia, hasTesoura, hasDichavador, hasPiteira, hasBong])

  return (
    <div className="space-y-4">
      {/* Box do Kit 5% OFF Banner / Status */}
      <div className="border border-emerald-500/30 bg-emerald-950/20 rounded-xl p-4 sm:p-5 relative overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="font-display font-bold text-sm sm:text-base text-emerald-300">
                Combo Especial: Kit Completo com 5% OFF
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Junte <strong className="text-white">Seda + Cuia + Tesoura + Tabaco/Pote</strong> no
              carrinho e ganhe automaticamente <strong>5% de desconto</strong> no combo!
            </p>
          </div>
          {kitDiscount.isEligible ? (
            <span className="shrink-0 bg-emerald-500 text-black text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
              5% OFF Ativo 🎉
            </span>
          ) : (
            <span className="shrink-0 bg-zinc-800 text-zinc-300 text-[11px] font-bold px-2.5 py-1 rounded-full">
              Faltam itens
            </span>
          )}
        </div>

        {/* Checklist dos 4 itens */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-emerald-900/40 text-xs">
          <div
            className={`flex items-center gap-1.5 ${hasSeda ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${hasSeda ? 'bg-emerald-500 text-black' : 'border border-zinc-700'}`}
            >
              {hasSeda ? <Check className="w-3 h-3 stroke-[3]" /> : '1'}
            </span>
            <span>1. Seda</span>
          </div>

          <div
            className={`flex items-center gap-1.5 ${hasCuia ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${hasCuia ? 'bg-emerald-500 text-black' : 'border border-zinc-700'}`}
            >
              {hasCuia ? <Check className="w-3 h-3 stroke-[3]" /> : '2'}
            </span>
            <span>2. Cuia</span>
          </div>

          <div
            className={`flex items-center gap-1.5 ${hasTesoura ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${hasTesoura ? 'bg-emerald-500 text-black' : 'border border-zinc-700'}`}
            >
              {hasTesoura ? <Check className="w-3 h-3 stroke-[3]" /> : '3'}
            </span>
            <span>3. Tesoura</span>
          </div>

          <div
            className={`flex items-center gap-1.5 ${hasTabaco ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${hasTabaco ? 'bg-emerald-500 text-black' : 'border border-zinc-700'}`}
            >
              {hasTabaco ? <Check className="w-3 h-3 stroke-[3]" /> : '4'}
            </span>
            <span>4. Tabaco/Pote</span>
          </div>
        </div>
      </div>

      {/* Sugestões de Order Bump (cards compactos de 1 clique) */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Aproveite o frete — Adicione com 1 clique:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggestions.map((bump) => (
              <div
                key={bump.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3 flex flex-col justify-between transition-all shadow-sm"
              >
                <div className="flex gap-3 items-center">
                  <div className="w-14 h-14 rounded-lg bg-zinc-950 border border-zinc-800 shrink-0 overflow-hidden flex items-center justify-center p-1">
                    <img
                      src={bump.image}
                      alt={bump.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-xs text-white truncate" title={bump.name}>
                      {bump.name}
                    </h4>
                    <span className="text-amber-400 font-mono font-bold text-xs block">
                      {formatBRL(bump.price)}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2 leading-snug">
                  {bump.reason}
                </p>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addItem(bump.rawProduct, 1)}
                  className="w-full mt-3 h-8 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 hover:border-amber-500/50"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />+ Adicionar
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
