import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { BRAZIL_REGIONS, BrazilRegion, REGION_SHIPPING_RATES } from '@/types/ecommerce'
import { formatBRL } from '@/lib/formatters'
import { useCart } from '@/context/CartContext'
import { CheckCircle2, Truck, Info } from 'lucide-react'

export const ShippingCalculator: React.FC = () => {
  const {
    selectedRegion,
    setSelectedRegion,
    cep,
    setCep,
    shipping,
    isFreeShippingEligible,
    subtotal,
    remainingForFreeShipping,
  } = useCart()

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value as BrazilRegion)
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '')
    if (raw.length > 8) raw = raw.slice(0, 8)
    if (raw.length > 5) {
      raw = `${raw.slice(0, 5)}-${raw.slice(5)}`
    }
    setCep(raw)
  }

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-black" />
          <h3 className="font-display font-semibold text-sm sm:text-base text-zinc-900">
            Calculadora de Frete por Região
          </h3>
        </div>
        <span className="text-[11px] font-mono text-zinc-500 uppercase">Tabela Fixa Brasil</span>
      </div>

      {/* Free shipping notice / banner */}
      {isFreeShippingEligible ? (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm p-3 rounded-md flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Parabéns! Seu pedido atingiu o valor de <strong>Frete Grátis</strong> (acima de R$
            299,00). Selecione sua região para prosseguir.
          </span>
        </div>
      ) : (
        <div className="bg-zinc-100 text-zinc-600 text-xs p-2.5 rounded flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span>
            Falta apenas <strong>{formatBRL(remainingForFreeShipping)}</strong> para você garantir{' '}
            <strong>Frete Grátis</strong>!
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Region select */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700 block">
            Região de Entrega <span className="text-red-500">*</span>
          </label>
          <Select value={selectedRegion || ''} onValueChange={handleRegionChange}>
            <SelectTrigger className="bg-white border-zinc-300">
              <SelectValue placeholder="Selecione sua região..." />
            </SelectTrigger>
            <SelectContent>
              {BRAZIL_REGIONS.map((region) => {
                const rate = REGION_SHIPPING_RATES[region]
                return (
                  <SelectItem key={region} value={region}>
                    {region} — {isFreeShippingEligible ? 'Grátis' : formatBRL(rate)}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Optional CEP */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700 block">CEP (opcional)</label>
          <Input
            type="text"
            placeholder="00000-000"
            value={cep}
            onChange={handleCepChange}
            className="bg-white border-zinc-300 font-mono text-sm"
          />
        </div>
      </div>

      {/* Feedback banner */}
      {selectedRegion && (
        <div className="mt-2 p-3 bg-white border border-zinc-200 rounded-md flex items-center justify-between text-xs sm:text-sm animate-fade-in">
          <div className="flex items-center gap-2 text-zinc-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              ✓ Frete calculado para <strong>{selectedRegion}</strong>:
            </span>
          </div>
          <span className="font-mono font-bold text-sm text-black">
            {isFreeShippingEligible ? 'GRÁTIS' : formatBRL(shipping)}
          </span>
        </div>
      )}
    </div>
  )
}
