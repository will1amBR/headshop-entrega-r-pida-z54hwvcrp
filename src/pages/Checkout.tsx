import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MessageCircle, CheckCircle2, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { BRAZIL_STATES, BrazilRegion } from '@/types/ecommerce'
import { formatBRL, getFileUrl, getProductFallbackImage } from '@/lib/formatters'
import { buildWhatsAppOrderMessage, buildWhatsAppUrl } from '@/lib/whatsapp'
import { createOrder } from '@/services/orders'
import { getSeoSettings } from '@/services/seo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DeliveryFormData {
  fullName: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  cep: string
}

interface FormErrors {
  fullName?: string
  phone?: string
  address?: string
  city?: string
  state?: string
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotal, shipping, total, selectedRegion, cep: initialCep, clearCart } = useCart()

  const [formData, setFormData] = useState<DeliveryFormData>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    cep: initialCep || '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [whatsappPhone, setWhatsappPhone] = useState('5548992463428')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null)

  useEffect(() => {
    getSeoSettings().then((s) => {
      if (s?.whatsapp_number) setWhatsappPhone(s.whatsapp_number)
    })
  }, [])

  // Redirect if cart is empty and not just completed
  useEffect(() => {
    if (items.length === 0 && !orderSuccess) {
      navigate('/carrinho')
    }
  }, [items, orderSuccess, navigate])

  // If state changes, maybe check region match or keep selectedRegion
  const handleStateChange = (uf: string) => {
    setFormData((prev) => ({ ...prev, state: uf }))
    if (errors.state) {
      setErrors((prev) => ({ ...prev, state: undefined }))
    }
  }

  const validate = (): boolean => {
    const errs: FormErrors = {}
    if (!formData.fullName.trim()) {
      errs.fullName = 'Informe seu nome completo'
    }
    const cleanP = formData.phone.replace(/\D/g, '')
    if (!cleanP || cleanP.length < 10) {
      errs.phone = 'Informe um WhatsApp válido com DDD (ex: 11 99999-9999)'
    }
    if (!formData.address.trim()) {
      errs.address = 'Informe seu endereço completo (rua, número, complemento)'
    }
    if (!formData.city.trim()) {
      errs.city = 'Informe sua cidade'
    }
    if (!formData.state.trim()) {
      errs.state = 'Selecione o estado (UF)'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '')
    if (raw.length > 11) raw = raw.slice(0, 11)
    if (raw.length > 6) {
      raw = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`
    } else if (raw.length > 2) {
      raw = `(${raw.slice(0, 2)}) ${raw.slice(2)}`
    }
    setFormData((prev) => ({ ...prev, phone: raw }))
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }))
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '')
    if (raw.length > 8) raw = raw.slice(0, 8)
    if (raw.length > 5) {
      raw = `${raw.slice(0, 5)}-${raw.slice(5)}`
    }
    setFormData((prev) => ({ ...prev, cep: raw }))
  }

  const handleSendOrderWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (!selectedRegion) {
      alert('Selecione uma região de frete no carrinho antes de enviar.')
      navigate('/carrinho')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Build exact formatted WhatsApp message
      const message = buildWhatsAppOrderMessage({
        items,
        subtotal,
        shipping,
        region: selectedRegion,
        total,
        customerName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        cep: formData.cep.trim(),
      })

      // 2. Persist order to database with status 'novo'
      const orderRecord = await createOrder({
        customer_name: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        cep: formData.cep.trim() || undefined,
        region: selectedRegion as BrazilRegion,
        items: items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        subtotal,
        shipping,
        total,
        status: 'novo',
      })

      setSavedOrderId(orderRecord.id)

      // 3. Open WhatsApp in new tab
      const waUrl = buildWhatsAppUrl(whatsappPhone, message)
      window.open(waUrl, '_blank', 'noopener,noreferrer')

      // 4. Clear cart & show success screen
      clearCart()
      setOrderSuccess(true)
    } catch (err) {
      console.error('Erro ao salvar pedido', err)
      alert('Ocorreu um erro ao registrar o pedido. Verifique os dados e tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (orderSuccess) {
    return (
      <div className="py-20 bg-white min-h-[75vh] flex items-center">
        <div className="max-w-[620px] mx-auto px-4 text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 text-[#25D366] rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>

          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Pedido Registrado com Sucesso
            </span>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-zinc-950">
              Pedido enviado!
            </h1>
            <p className="text-zinc-600 text-base leading-relaxed">
              Agradecemos a sua preferência. A janela do WhatsApp foi aberta com seu pedido
              formatado.
              <strong> Aguarde o contato da loja para confirmação e pagamento.</strong>
            </p>
          </div>

          {savedOrderId && (
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600">
              Identificador do pedido: <span className="font-bold text-black">{savedOrderId}</span>
            </div>
          )}

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto bg-[#0A0A0A] hover:bg-zinc-800 text-white font-medium"
            >
              Voltar à loja
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/produtos')}
              className="w-full sm:w-auto border-zinc-300"
            >
              Ver mais produtos
            </Button>
          </div>
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
              Etapa 2 de 2 • Finalização
            </span>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
              Checkout & Entrega
            </h1>
          </div>
          <Link
            to="/carrinho"
            className="text-xs sm:text-sm font-semibold text-zinc-600 hover:text-black flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Editar Carrinho
          </Link>
        </div>

        {/* 2 Column Layout: Delivery Form (65%) | Itemized Summary (35% sticky) */}
        <form
          onSubmit={handleSendOrderWhatsApp}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start"
        >
          {/* Left Column: Delivery Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-6 shadow-sm">
              <div>
                <h2 className="font-display font-bold text-lg text-zinc-950">Dados para Entrega</h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Preencha seu endereço para que a loja calcule os prazos exatos e envie seu
                  rastreamento.
                </p>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                {/* Full name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-800 block">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: João da Silva Santos"
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({ ...formData, fullName: e.target.value })
                      if (errors.fullName) setErrors({ ...errors, fullName: undefined })
                    }}
                    className={errors.fullName ? 'border-red-500' : ''}
                  />
                  {errors.fullName && (
                    <span className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.fullName}
                    </span>
                  )}
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-800 block">
                      Telefone / WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className={errors.phone ? 'border-red-500 font-mono' : 'font-mono'}
                    />
                    {errors.phone && (
                      <span className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.phone}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-800 block">
                      E-mail (opcional)
                    </label>
                    <Input
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-800 block">
                    Endereço Completo (Rua, Número, Complemento, Bairro){' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: Rua das Flores, 123, Bloco B Apto 101, Centro"
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value })
                      if (errors.address) setErrors({ ...errors, address: undefined })
                    }}
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && (
                    <span className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.address}
                    </span>
                  )}
                </div>

                {/* City, State, CEP */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-800 block">
                      Cidade <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Ex: São Paulo"
                      value={formData.city}
                      onChange={(e) => {
                        setFormData({ ...formData, city: e.target.value })
                        if (errors.city) setErrors({ ...errors, city: undefined })
                      }}
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && (
                      <span className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.city}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-800 block">
                      Estado (UF) <span className="text-red-500">*</span>
                    </label>
                    <Select value={formData.state} onValueChange={handleStateChange}>
                      <SelectTrigger
                        className={errors.state ? 'border-red-500 bg-white' : 'bg-white'}
                      >
                        <SelectValue placeholder="UF..." />
                      </SelectTrigger>
                      <SelectContent>
                        {BRAZIL_STATES.map((s) => (
                          <SelectItem key={s.uf} value={s.uf}>
                            {s.uf} — {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.state && (
                      <span className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.state}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-800 block">CEP</label>
                    <Input
                      type="text"
                      placeholder="00000-000"
                      value={formData.cep}
                      onChange={handleCepChange}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Selected Region (read-only prefilled from cart) */}
                <div className="pt-2">
                  <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-zinc-800 block">
                        Região Selecionada: <strong>{selectedRegion || 'Não definida'}</strong>
                      </span>
                      <span className="text-zinc-500">
                        Custo de envio: {shipping === 0 ? 'Grátis' : formatBRL(shipping)}
                      </span>
                    </div>
                    <Link to="/carrinho" className="text-xs font-semibold text-zinc-900 underline">
                      Alterar no carrinho
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Itemized Summary & Send CTA */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 space-y-6 shadow-sm">
              <h2 className="font-display font-bold text-lg text-zinc-950 pb-3 border-b border-zinc-200">
                Itens do Pedido ({items.length})
              </h2>

              {/* Itemized list */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {items.map((i) => {
                  const img = i.image
                    ? getFileUrl('products', i.productId, i.image)
                    : getProductFallbackImage(i.name, i.category)

                  return (
                    <div
                      key={i.productId}
                      className="flex items-center justify-between text-xs gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={img}
                          alt={i.name}
                          className="w-10 h-10 rounded border border-zinc-200 object-cover"
                        />
                        <div>
                          <p className="font-semibold text-zinc-900 line-clamp-1">{i.name}</p>
                          <span className="text-zinc-500 font-mono">
                            {i.quantity}x {formatBRL(i.unit_price)}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-semibold text-zinc-950">
                        {formatBRL(i.unit_price * i.quantity)}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Totals Breakdown */}
              <div className="pt-4 border-t border-zinc-200 space-y-2 text-sm">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium text-zinc-900">{formatBRL(subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Frete ({selectedRegion}):</span>
                  <span className="font-mono font-medium text-zinc-900">
                    {shipping === 0 ? (
                      <strong className="text-emerald-600">GRÁTIS</strong>
                    ) : (
                      formatBRL(shipping)
                    )}
                  </span>
                </div>
                <div className="pt-3 border-t border-zinc-200 flex justify-between items-baseline">
                  <span className="font-display font-bold text-base text-zinc-950">
                    Total Geral:
                  </span>
                  <span className="font-mono font-extrabold text-2xl text-zinc-950">
                    {formatBRL(total)}
                  </span>
                </div>
              </div>

              {/* Big WhatsApp CTA Button */}
              <div className="space-y-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full bg-[#25D366] hover:bg-[#1EBE5A] text-white font-bold h-14 text-sm sm:text-base shadow-lg transition-transform hover:scale-101 active:scale-99 gap-2"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  {isSubmitting ? 'Registrando pedido...' : 'Enviar Pedido pelo WhatsApp'}
                </Button>
                <p className="text-[11px] text-center text-zinc-500">
                  Ao clicar, o WhatsApp será aberto com seu pedido pronto para envio e a loja
                  receberá sua solicitação.
                </p>
              </div>

              {/* Trust Badge */}
              <div className="pt-4 border-t border-zinc-200 flex items-center gap-2 text-xs text-zinc-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pagamento combinado diretamente no chat com segurança.</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
