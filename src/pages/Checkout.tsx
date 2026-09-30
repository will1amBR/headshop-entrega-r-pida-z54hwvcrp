import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  MessageCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  QrCode,
  CreditCard,
  Copy,
  Check,
  ExternalLink,
  Info,
  Truck,
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  Lock,
  Sparkles,
  Search,
  Loader2,
  Trash2,
  Plus,
  Minus,
} from 'lucide-react'
import { useCart } from '@/context/CartContext'
import {
  BRAZIL_STATES,
  BRAZIL_REGIONS,
  BrazilRegion,
  REGION_SHIPPING_RATES,
  FREE_SHIPPING_THRESHOLD,
} from '@/types/ecommerce'
import { formatBRL, getFileUrl, getProductFallbackImage } from '@/lib/formatters'
import { buildWhatsAppOrderMessage, buildWhatsAppUrl } from '@/lib/whatsapp'
import { createOrder } from '@/services/orders'
import { createMercadoPagoCharge } from '@/services/payments'
import { getSeoSettings } from '@/services/seo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  number: string
  complement: string
  neighborhood: string
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
  region?: string
}

const CUSTOMER_DATA_STORAGE_KEY = 'headshop_saved_customer_v1'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const {
    items,
    subtotal,
    shipping,
    kitDiscount,
    total,
    selectedRegion,
    setSelectedRegion,
    cep: cartCep,
    setCep: setCartCep,
    updateQuantity,
    removeItem,
    clearCart,
    isFreeShippingEligible,
    remainingForFreeShipping,
  } = useCart()

  // Carregar dados prévios do cliente salvos em localStorage (para compra instantânea em 1 clique)
  const [formData, setFormData] = useState<DeliveryFormData>(() => {
    try {
      const saved = localStorage.getItem(CUSTOMER_DATA_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          fullName: parsed.fullName || '',
          phone: parsed.phone || '',
          email: parsed.email || '',
          address: parsed.address || '',
          number: parsed.number || '',
          complement: parsed.complement || '',
          neighborhood: parsed.neighborhood || '',
          city: parsed.city || '',
          state: parsed.state || '',
          cep: parsed.cep || cartCep || '',
        }
      }
    } catch {
      /* intentionally ignored */
    }
    return {
      fullName: '',
      phone: '',
      email: '',
      address: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: 'SP',
      cep: cartCep || '',
    }
  })

  // Seções colapsáveis para agilidade (etapas em UMA tela)
  const [openSections, setOpenSections] = useState({
    customer: true,
    address: true,
    payment: true,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [whatsappPhone, setWhatsappPhone] = useState('5548992463428')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null)
  const [isSearchingCep, setIsSearchingCep] = useState(false)
  const [cepNotice, setCepNotice] = useState<string | null>(null)
  const [hasLoadedSavedData, setHasLoadedSavedData] = useState(false)

  // Opção de pagamento selecionada: 'whatsapp' | 'pix' | 'cartao'
  const [paymentChoice, setPaymentChoice] = useState<'whatsapp' | 'pix' | 'cartao'>('whatsapp')
  const [pixChargeData, setPixChargeData] = useState<{
    txid?: string
    qrCode?: string
    isMock: boolean
  } | null>(null)
  const [copiedPix, setCopiedPix] = useState(false)
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false)

  useEffect(() => {
    getSeoSettings().then((s) => {
      if (s?.whatsapp_number) setWhatsappPhone(s.whatsapp_number)
    })
  }, [])

  // Auto-selecionar 'Sudeste' por padrão se o usuário tiver estado SP ou CEP de SP e nenhuma região selecionada ainda
  useEffect(() => {
    if (!selectedRegion) {
      if (formData.state === 'SP' || formData.cep.startsWith('0') || formData.cep.startsWith('1')) {
        setSelectedRegion('Sudeste')
      }
    }
    const saved = localStorage.getItem(CUSTOMER_DATA_STORAGE_KEY)
    if (saved) {
      setHasLoadedSavedData(true)
    }
  }, [formData.state, formData.cep, selectedRegion, setSelectedRegion])

  // Redirect se carrinho vazio e pedido ainda não completado
  useEffect(() => {
    if (items.length === 0 && !orderSuccess) {
      navigate('/produtos')
    }
  }, [items, orderSuccess, navigate])

  // Salvar no localStorage sempre que o cliente altera dados
  const saveCustomerToStorage = (data: DeliveryFormData) => {
    try {
      localStorage.setItem(CUSTOMER_DATA_STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* intentionally ignored */
    }
  }

  // Preenchimento de CEP automático via ViaCEP
  const handleCepLookup = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '')
    if (cleanCep.length !== 8) return

    setIsSearchingCep(true)
    setCepNotice(null)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      if (!res.ok) throw new Error('Falha ao consultar CEP')
      const data = await res.json()

      if (data.erro) {
        setCepNotice('CEP não encontrado na base dos Correios. Preencha manualmente.')
        return
      }

      const uf = data.uf || ''
      let autoRegion: BrazilRegion = 'Sudeste'
      if (['SP', 'RJ', 'MG', 'ES'].includes(uf)) autoRegion = 'Sudeste'
      else if (['PR', 'SC', 'RS'].includes(uf)) autoRegion = 'Sul'
      else if (['DF', 'GO', 'MT', 'MS'].includes(uf)) autoRegion = 'Centro-Oeste'
      else if (['BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI'].includes(uf))
        autoRegion = 'Nordeste'
      else if (['AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO'].includes(uf)) autoRegion = 'Norte'

      setSelectedRegion(autoRegion)

      setFormData((prev) => {
        const next = {
          ...prev,
          address: data.logradouro || prev.address,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: uf || prev.state,
          cep: cepValue,
        }
        saveCustomerToStorage(next)
        return next
      })

      setCepNotice(`✓ Localizado: ${data.localidade}/${uf} (Região ${autoRegion} aplicada)`)
      if (errors.city || errors.state || errors.address) {
        setErrors((prev) => ({
          ...prev,
          city: undefined,
          state: undefined,
          address: undefined,
        }))
      }
    } catch (err) {
      console.warn('Erro ao consultar ViaCEP', err)
      setCepNotice('Não foi possível autocompletar. Preencha os campos abaixo.')
    } finally {
      setIsSearchingCep(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '')
    if (raw.length > 11) raw = raw.slice(0, 11)
    if (raw.length > 6) {
      raw = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`
    } else if (raw.length > 2) {
      raw = `(${raw.slice(0, 2)}) ${raw.slice(2)}`
    }
    const updated = { ...formData, phone: raw }
    setFormData(updated)
    saveCustomerToStorage(updated)
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }))
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '')
    if (raw.length > 8) raw = raw.slice(0, 8)
    if (raw.length > 5) {
      raw = `${raw.slice(0, 5)}-${raw.slice(5)}`
    }
    const updated = { ...formData, cep: raw }
    setFormData(updated)
    setCartCep(raw)
    saveCustomerToStorage(updated)

    if (raw.replace(/\D/g, '').length === 8) {
      handleCepLookup(raw)
    }
  }

  const handleStateChange = (uf: string) => {
    const updated = { ...formData, state: uf }
    setFormData(updated)
    saveCustomerToStorage(updated)

    // Ajuste sugerido da região com base na UF
    if (['SP', 'RJ', 'MG', 'ES'].includes(uf)) setSelectedRegion('Sudeste')
    else if (['PR', 'SC', 'RS'].includes(uf)) setSelectedRegion('Sul')
    else if (['DF', 'GO', 'MT', 'MS'].includes(uf)) setSelectedRegion('Centro-Oeste')
    else if (['BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI'].includes(uf))
      setSelectedRegion('Nordeste')
    else if (['AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO'].includes(uf)) setSelectedRegion('Norte')

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
      errs.phone = 'Informe seu WhatsApp com DDD (ex: 11 99999-9999)'
    }
    if (!formData.address.trim()) {
      errs.address = 'Informe rua/avenida e número'
    }
    if (!formData.city.trim()) {
      errs.city = 'Informe sua cidade'
    }
    if (!formData.state.trim()) {
      errs.state = 'Selecione a UF'
    }
    if (!selectedRegion) {
      errs.region = 'Selecione uma região de frete'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleCopyPix = () => {
    if (pixChargeData?.qrCode) {
      navigator.clipboard.writeText(pixChargeData.qrCode)
      setCopiedPix(true)
      setTimeout(() => setCopiedPix(false), 2500)
    }
  }

  const fullDeliveryAddress = useMemo(() => {
    const parts = [formData.address]
    if (formData.number) parts.push(`nº ${formData.number}`)
    if (formData.complement) parts.push(formData.complement)
    if (formData.neighborhood) parts.push(`Bairro ${formData.neighborhood}`)
    return parts.filter(Boolean).join(', ')
  }, [formData])

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      // Abre seções que possuem erro para o cliente corrigir rápido
      setOpenSections({
        customer: true,
        address: true,
        payment: true,
      })
      return
    }

    setIsSubmitting(true)
    try {
      saveCustomerToStorage(formData)

      // 1. Salvar o pedido no banco
      const orderRecord = await createOrder({
        customer_name: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: fullDeliveryAddress || formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        cep: formData.cep.trim() || undefined,
        region: (selectedRegion || 'Sudeste') as BrazilRegion,
        items: items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        subtotal,
        shipping,
        discount: kitDiscount?.discountAmount || 0,
        total,
        status: 'novo',
      })

      setSavedOrderId(orderRecord.id)

      // 2. Se cliente escolheu Pix ou Cartão: criar cobrança Mercado Pago
      if (paymentChoice === 'pix' || paymentChoice === 'cartao') {
        const charge = await createMercadoPagoCharge({
          orderId: orderRecord.id,
          amount: total,
          method: paymentChoice,
          customer: {
            name: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
          },
        })

        if (paymentChoice === 'pix') {
          setPixChargeData({
            txid: charge.payment.txid,
            qrCode: charge.qrCode,
            isMock: charge.isMock,
          })
        }
      }

      // 3. Preparar mensagem do WhatsApp
      const message = buildWhatsAppOrderMessage({
        items,
        subtotal,
        shipping,
        discount: kitDiscount?.discountAmount || 0,
        region: selectedRegion || 'Sudeste',
        total,
        customerName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        address: fullDeliveryAddress || formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        cep: formData.cep.trim(),
      })

      // Se foi via WhatsApp direto, abre o aplicativo
      if (paymentChoice === 'whatsapp') {
        const waUrl = buildWhatsAppUrl(whatsappPhone, message)
        window.open(waUrl, '_blank', 'noopener,noreferrer')
      }

      // Limpar carrinho e avançar para tela de confirmação
      clearCart()
      setOrderSuccess(true)
    } catch (err) {
      console.error('Erro ao processar pedido:', err)
      alert('Ocorreu um erro ao registrar o pedido. Verifique os dados e tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // TELA DE SUCESSO / CONFIRMAÇÃO
  if (orderSuccess) {
    return (
      <div className="py-16 sm:py-24 bg-white min-h-[75vh] flex items-center">
        <div className="max-w-[620px] mx-auto px-4 text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 text-[#25D366] rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>

          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              ⚡ Pedido Registrado com Sucesso
            </span>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-zinc-950">
              {paymentChoice === 'pix'
                ? 'Pague via Pix para Concluir'
                : paymentChoice === 'cartao'
                  ? 'Cobrança Gerada com Sucesso!'
                  : 'Pedido Enviado pelo WhatsApp!'}
            </h1>
            <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
              {paymentChoice === 'pix'
                ? 'Copie o código Pix abaixo ou escaneie o QR Code para efetuar o pagamento imediato.'
                : paymentChoice === 'cartao'
                  ? 'Seu pedido foi registrado. Nossa equipe confirmará o pagamento ou enviará o link seguro.'
                  : 'Agradecemos sua compra! A janela do WhatsApp foi iniciada com todos os itens e endereço formatados.'}
            </p>
          </div>

          {/* Bloco Pix Copia e Cola / QR Code */}
          {paymentChoice === 'pix' && pixChargeData && (
            <div className="p-5 bg-zinc-50 border-2 border-zinc-300 rounded-2xl text-left space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-zinc-900" />
                  <span className="font-bold text-sm text-zinc-900">
                    Pix Copia e Cola • Mercado Pago
                  </span>
                </div>
                {pixChargeData.txid && (
                  <span className="text-[11px] font-mono text-zinc-500">
                    Ref: {pixChargeData.txid}
                  </span>
                )}
              </div>

              {pixChargeData.isMock && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Modo Demonstração / Pagamento Ágil:</strong> O gateway Mercado Pago
                    opera em modo transparente. Você também pode avisar a confirmação no WhatsApp
                    com 1 toque.
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 block">
                  Código Pix (Copia e Cola):
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={pixChargeData.qrCode || ''}
                    className="font-mono text-xs bg-white text-zinc-700 select-all"
                  />
                  <Button
                    type="button"
                    onClick={handleCopyPix}
                    className="gap-1.5 shrink-0 bg-black text-white hover:bg-zinc-800 text-xs"
                  >
                    {copiedPix ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Pix
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-xs text-zinc-500 font-mono">
                <span>Total: {formatBRL(total)}</span>
                <a
                  href={buildWhatsAppUrl(
                    whatsappPhone,
                    `Olá! Acabei de registrar o pedido #${savedOrderId} (R$ ${total.toFixed(2)}) e gerei a chave Pix. Gostaria de confirmar!`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  Avisar no WhatsApp
                </a>
              </div>
            </div>
          )}

          {savedOrderId && (
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600">
              Número do Pedido: <span className="font-bold text-black">#{savedOrderId}</span>
            </div>
          )}

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto bg-[#0A0A0A] hover:bg-zinc-800 text-white font-medium"
            >
              Voltar ao Início
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/produtos')}
              className="w-full sm:w-auto border-zinc-300"
            >
              Ver Mais Produtos
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // TELA PRINCIPAL DE CHECKOUT RÁPIDO EM 1 TELA
  return (
    <div className="py-8 sm:py-12 bg-zinc-50 min-h-screen">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-6">
        {/* Top Header & Fast Trust Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 bg-white p-4 sm:p-6 rounded-2xl shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#25D366]" />
                Checkout Rápido em 1 Tela
              </span>
              {hasLoadedSavedData && (
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                  ✓ Dados salvos pré-carregados
                </span>
              )}
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
              Finalização Ágil de Pedido
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              WhatsApp é o único canal obrigatório. Menos cliques e compra concluída em segundos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-500 border border-zinc-200 px-3 py-1.5 rounded-lg bg-zinc-50">
              <Lock className="w-3.5 h-3.5 text-zinc-700" />
              <span>Ambiente Seguro SSL</span>
            </div>
            <Link
              to="/carrinho"
              className="text-xs sm:text-sm font-semibold text-zinc-700 hover:text-black flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 px-3 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Ver Carrinho
            </Link>
          </div>
        </div>

        {/* Free Shipping Alert Banner */}
        {remainingForFreeShipping > 0 ? (
          <div className="p-3.5 bg-zinc-900 text-white rounded-xl flex items-center justify-between text-xs sm:text-sm shadow-xs">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#25D366] shrink-0" />
              <span>
                Falta apenas <strong>{formatBRL(remainingForFreeShipping)}</strong> no carrinho para
                você ganhar <strong>FRETE GRÁTIS</strong>!
              </span>
            </div>
            <Link
              to="/produtos"
              className="underline text-[#25D366] font-semibold text-xs whitespace-nowrap hover:text-emerald-400"
            >
              + Adicionar Itens
            </Link>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Parabéns! Seu pedido atingiu o valor de <strong>FRETE GRÁTIS</strong> para qualquer
              região do Brasil.
            </span>
          </div>
        )}

        {/* 2 Column Layout: Form (7 col) + Resumo do Pedido Sticky (5 col) */}
        <form
          onSubmit={handleCheckoutSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start"
        >
          {/* Coluna Esquerda: Etapas Compactas e Colapsáveis */}
          <div className="lg:col-span-7 space-y-4">
            {/* ETAPA 1: DADOS DO CLIENTE (Nome + WhatsApp Essencial) */}
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setOpenSections((prev) => ({ ...prev, customer: !prev.customer }))}
                className="w-full p-4 sm:p-5 flex items-center justify-between bg-white hover:bg-zinc-50/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-zinc-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-base text-zinc-950 flex items-center gap-2">
                      <span>Identificação Rápida</span>
                      {formData.fullName && formData.phone && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Nome e WhatsApp são o essencial para confirmar seu pedido
                    </p>
                  </div>
                </div>
                {openSections.customer ? (
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </button>

              {openSections.customer && (
                <div className="p-4 sm:p-5 pt-0 border-t border-zinc-100 space-y-3 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                    {/* Nome Completo */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-800 block">
                        Nome Completo <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Seu nome ou apelido"
                        value={formData.fullName}
                        onChange={(e) => {
                          const updated = { ...formData, fullName: e.target.value }
                          setFormData(updated)
                          saveCustomerToStorage(updated)
                          if (errors.fullName) setErrors({ ...errors, fullName: undefined })
                        }}
                        className={`text-xs h-10 ${errors.fullName ? 'border-red-500 bg-red-50/20' : 'bg-zinc-50'}`}
                      />
                      {errors.fullName && (
                        <span className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3" /> {errors.fullName}
                        </span>
                      )}
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-800 block">
                          WhatsApp <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold">
                          Obrigatório
                        </span>
                      </div>
                      <Input
                        type="text"
                        placeholder="(11) 99999-9999"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        className={`text-xs h-10 font-mono ${errors.phone ? 'border-red-500 bg-red-50/20' : 'bg-zinc-50'}`}
                      />
                      {errors.phone && (
                        <span className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3" /> {errors.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* E-mail (opcional) */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-800 block">
                      E-mail{' '}
                      <span className="text-zinc-400 font-normal">
                        (opcional para receber comprovante)
                      </span>
                    </label>
                    <Input
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      value={formData.email}
                      onChange={(e) => {
                        const updated = { ...formData, email: e.target.value }
                        setFormData(updated)
                        saveCustomerToStorage(updated)
                      }}
                      className="text-xs h-10 bg-zinc-50"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ETAPA 2: ENDEREÇO & FRETE POR REGIÃO */}
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setOpenSections((prev) => ({ ...prev, address: !prev.address }))}
                className="w-full p-4 sm:p-5 flex items-center justify-between bg-white hover:bg-zinc-50/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-zinc-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-base text-zinc-950 flex items-center gap-2">
                      <span>Endereço de Entrega & Frete</span>
                      {formData.address && formData.city && selectedRegion && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Digite o CEP para preencher rua, bairro e selecionar a região de envio
                    </p>
                  </div>
                </div>
                {openSections.address ? (
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </button>

              {openSections.address && (
                <div className="p-4 sm:p-5 pt-0 border-t border-zinc-100 space-y-4 animate-fade-in">
                  {/* Busca Rápida de CEP */}
                  <div className="pt-3">
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-1">
                        <label className="text-xs font-semibold text-zinc-800 block">
                          CEP para Auto-Preenchimento
                        </label>
                        <div className="relative">
                          <Input
                            type="text"
                            placeholder="00000-000"
                            value={formData.cep}
                            onChange={handleCepChange}
                            className="text-xs h-10 font-mono bg-zinc-50 pr-8"
                          />
                          {isSearchingCep && (
                            <Loader2 className="w-4 h-4 text-zinc-500 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleCepLookup(formData.cep)}
                        disabled={isSearchingCep || formData.cep.replace(/\D/g, '').length < 8}
                        className="h-10 text-xs gap-1 border-zinc-300"
                      >
                        <Search className="w-3.5 h-3.5" />
                        Buscar CEP
                      </Button>
                    </div>

                    {cepNotice && (
                      <p className="text-[11px] text-zinc-600 font-medium mt-1.5 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        {cepNotice}
                      </p>
                    )}
                  </div>

                  {/* Rua + Número + Complemento */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-8 space-y-1">
                      <label className="text-xs font-semibold text-zinc-800 block">
                        Rua / Avenida <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Ex: Rua Augusta"
                        value={formData.address}
                        onChange={(e) => {
                          const updated = { ...formData, address: e.target.value }
                          setFormData(updated)
                          saveCustomerToStorage(updated)
                          if (errors.address) setErrors({ ...errors, address: undefined })
                        }}
                        className={`text-xs h-10 ${errors.address ? 'border-red-500 bg-red-50/20' : 'bg-zinc-50'}`}
                      />
                      {errors.address && (
                        <span className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3" /> {errors.address}
                        </span>
                      )}
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-xs font-semibold text-zinc-800 block">Número</label>
                      <Input
                        type="text"
                        placeholder="123"
                        value={formData.number}
                        onChange={(e) => {
                          const updated = { ...formData, number: e.target.value }
                          setFormData(updated)
                          saveCustomerToStorage(updated)
                        }}
                        className="text-xs h-10 bg-zinc-50"
                      />
                    </div>
                  </div>

                  {/* Complemento + Bairro */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-800 block">
                        Complemento <span className="text-zinc-400 font-normal">(apto, bloco)</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Apto 42, Bloco C"
                        value={formData.complement}
                        onChange={(e) => {
                          const updated = { ...formData, complement: e.target.value }
                          setFormData(updated)
                          saveCustomerToStorage(updated)
                        }}
                        className="text-xs h-10 bg-zinc-50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-800 block">Bairro</label>
                      <Input
                        type="text"
                        placeholder="Centro"
                        value={formData.neighborhood}
                        onChange={(e) => {
                          const updated = { ...formData, neighborhood: e.target.value }
                          setFormData(updated)
                          saveCustomerToStorage(updated)
                        }}
                        className="text-xs h-10 bg-zinc-50"
                      />
                    </div>
                  </div>

                  {/* Cidade e Estado */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-zinc-800 block">
                        Cidade <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Ex: São Paulo"
                        value={formData.city}
                        onChange={(e) => {
                          const updated = { ...formData, city: e.target.value }
                          setFormData(updated)
                          saveCustomerToStorage(updated)
                          if (errors.city) setErrors({ ...errors, city: undefined })
                        }}
                        className={`text-xs h-10 ${errors.city ? 'border-red-500 bg-red-50/20' : 'bg-zinc-50'}`}
                      />
                      {errors.city && (
                        <span className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3" /> {errors.city}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-800 block">
                        Estado (UF) <span className="text-red-500">*</span>
                      </label>
                      <Select value={formData.state} onValueChange={handleStateChange}>
                        <SelectTrigger className="text-xs h-10 bg-zinc-50 border-zinc-200">
                          <SelectValue placeholder="UF..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {BRAZIL_STATES.map((s) => (
                            <SelectItem key={s.uf} value={s.uf} className="text-xs">
                              {s.uf} — {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.state && (
                        <span className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3" /> {errors.state}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SELEÇÃO DIRETA DA REGIÃO DE FRETE COM VALORES VISÍVEIS DE UMA VEZ */}
                  <div className="pt-2 border-t border-zinc-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-900 block">
                        Região de Entrega / Frete <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] font-mono text-zinc-500">
                        ⚡ SP Expresso em até 24h
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {BRAZIL_REGIONS.map((region) => {
                        const rate = REGION_SHIPPING_RATES[region]
                        const isSelected = selectedRegion === region
                        return (
                          <button
                            key={region}
                            type="button"
                            onClick={() => {
                              setSelectedRegion(region)
                              if (errors.region)
                                setErrors((prev) => ({ ...prev, region: undefined }))
                            }}
                            className={`p-2.5 rounded-lg border text-left transition-all text-xs flex flex-col justify-between ${
                              isSelected
                                ? 'border-black bg-zinc-950 text-white shadow-xs'
                                : 'border-zinc-200 hover:border-zinc-400 bg-zinc-50 text-zinc-800'
                            }`}
                          >
                            <span className="font-bold block truncate">{region}</span>
                            <span
                              className={`font-mono text-[11px] mt-1 ${
                                isSelected ? 'text-[#25D366]' : 'text-zinc-600'
                              }`}
                            >
                              {isFreeShippingEligible ? 'Grátis' : formatBRL(rate)}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    {errors.region && (
                      <span className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3" /> {errors.region}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ETAPA 3: FORMA DE PAGAMENTO */}
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setOpenSections((prev) => ({ ...prev, payment: !prev.payment }))}
                className="w-full p-4 sm:p-5 flex items-center justify-between bg-white hover:bg-zinc-50/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-zinc-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-base text-zinc-950 flex items-center gap-2">
                      <span>Forma de Pagamento</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </h2>
                    <p className="text-xs text-zinc-500">
                      WhatsApp direto (mais rápido), Pix Copia e Cola ou Cartão em até 12x
                    </p>
                  </div>
                </div>
                {openSections.payment ? (
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </button>

              {openSections.payment && (
                <div className="p-4 sm:p-5 pt-0 border-t border-zinc-100 space-y-3 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                    {/* Opção 1: WhatsApp Direto (Foco em agilidade) */}
                    <button
                      type="button"
                      onClick={() => setPaymentChoice('whatsapp')}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        paymentChoice === 'whatsapp'
                          ? 'border-[#25D366] bg-emerald-950 text-white shadow-md ring-1 ring-[#25D366]'
                          : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50 text-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <MessageCircle className="w-5 h-5 text-[#25D366] fill-current" />
                        <span
                          className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                            paymentChoice === 'whatsapp'
                              ? 'bg-emerald-900 text-emerald-200'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          Mais Rápido
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-xs sm:text-sm block">
                          WhatsApp 1 Clique
                        </span>
                        <span
                          className={`text-[11px] block mt-0.5 ${
                            paymentChoice === 'whatsapp' ? 'text-emerald-200' : 'text-zinc-500'
                          }`}
                        >
                          Mensagem pronta imediata
                        </span>
                      </div>
                    </button>

                    {/* Opção 2: Pix */}
                    <button
                      type="button"
                      onClick={() => setPaymentChoice('pix')}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        paymentChoice === 'pix'
                          ? 'border-black bg-zinc-950 text-white shadow-md'
                          : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50 text-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <QrCode
                          className={`w-5 h-5 ${paymentChoice === 'pix' ? 'text-[#25D366]' : 'text-zinc-700'}`}
                        />
                        <span
                          className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                            paymentChoice === 'pix'
                              ? 'bg-zinc-800 text-zinc-300'
                              : 'bg-zinc-200 text-zinc-700'
                          }`}
                        >
                          Imediato
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-xs sm:text-sm block">Pagar com Pix</span>
                        <span
                          className={`text-[11px] block mt-0.5 ${
                            paymentChoice === 'pix' ? 'text-zinc-300' : 'text-zinc-500'
                          }`}
                        >
                          QR Code Mercado Pago
                        </span>
                      </div>
                    </button>

                    {/* Opção 3: Cartão de Crédito */}
                    <button
                      type="button"
                      onClick={() => setPaymentChoice('cartao')}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        paymentChoice === 'cartao'
                          ? 'border-black bg-zinc-950 text-white shadow-md'
                          : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50 text-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <CreditCard
                          className={`w-5 h-5 ${paymentChoice === 'cartao' ? 'text-blue-400' : 'text-zinc-700'}`}
                        />
                        <span
                          className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                            paymentChoice === 'cartao'
                              ? 'bg-zinc-800 text-zinc-300'
                              : 'bg-zinc-200 text-zinc-700'
                          }`}
                        >
                          Até 12x
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-xs sm:text-sm block">
                          Cartão de Crédito
                        </span>
                        <span
                          className={`text-[11px] block mt-0.5 ${
                            paymentChoice === 'cartao' ? 'text-zinc-300' : 'text-zinc-500'
                          }`}
                        >
                          Via Mercado Pago
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita: Resumo do Pedido Sticky (Desktop) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                <h3 className="font-display font-bold text-base text-zinc-950">
                  Resumo do Pedido ({items.length} itens)
                </h3>
                <span className="text-[11px] font-mono text-zinc-500">
                  {items.reduce((acc, i) => acc + i.quantity, 0)} unidades
                </span>
              </div>

              {/* Lista dos Itens com Miniaturas e Stepper Rápido */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {items.map((item) => {
                  const img = item.image
                    ? getFileUrl('products', item.productId, item.image)
                    : getProductFallbackImage(item.name, item.category)

                  return (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between gap-3 text-xs bg-zinc-50/70 p-2 rounded-lg border border-zinc-100"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={img}
                          alt={item.name}
                          className="w-10 h-10 rounded border border-zinc-200 object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 truncate">{item.name}</p>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {formatBRL(item.unit_price)} un.
                          </span>
                        </div>
                      </div>

                      {/* Stepper Rápido */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center border border-zinc-300 rounded bg-white">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1 hover:bg-zinc-100 text-zinc-600"
                            aria-label="Diminuir"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-[11px]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-1 hover:bg-zinc-100 text-zinc-600"
                            aria-label="Aumentar"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-mono font-bold text-zinc-950 min-w-[60px] text-right">
                          {formatBRL(item.unit_price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Discriminação de Valores */}
              <div className="pt-3 border-t border-zinc-200 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold text-zinc-950">
                    {formatBRL(subtotal)}
                  </span>
                </div>
                {kitDiscount?.isEligible && (
                  <div className="flex justify-between text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-200 text-xs">
                    <span className="font-medium">Kit Completo (5% OFF):</span>
                    <span className="font-mono font-bold">
                      -{formatBRL(kitDiscount.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-600 items-baseline">
                  <div className="flex flex-col">
                    <span>Frete:</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {selectedRegion ? `Região ${selectedRegion}` : 'Selecione a região'}
                    </span>
                  </div>
                  <span className="font-mono font-semibold">
                    {!selectedRegion ? (
                      <span className="text-amber-600 text-xs">Pendente</span>
                    ) : isFreeShippingEligible ? (
                      <span className="text-emerald-700 font-bold">GRÁTIS</span>
                    ) : (
                      formatBRL(shipping)
                    )}
                  </span>
                </div>

                <div className="pt-3 border-t border-zinc-200 flex justify-between items-baseline">
                  <span className="font-display font-bold text-base text-zinc-950">
                    Total Final:
                  </span>
                  <span className="font-mono font-extrabold text-2xl text-zinc-950">
                    {formatBRL(total)}
                  </span>
                </div>
              </div>

              {/* Botão de Finalizar no Desktop */}
              <div className="space-y-2 pt-1">
                {paymentChoice === 'whatsapp' ? (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#25D366] hover:bg-[#1EBE5A] text-white font-bold h-12 text-sm sm:text-base shadow-md gap-2"
                  >
                    <MessageCircle className="w-5 h-5 fill-current" />
                    {isSubmitting ? 'Registrando...' : 'Finalizar pelo WhatsApp Agora'}
                  </Button>
                ) : paymentChoice === 'pix' ? (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#0A0A0A] hover:bg-zinc-800 text-white font-bold h-12 text-sm sm:text-base shadow-md gap-2"
                  >
                    <QrCode className="w-5 h-5 text-[#25D366]" />
                    {isSubmitting ? 'Gerando Pix...' : `Pagar ${formatBRL(total)} no Pix`}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#0A0A0A] hover:bg-zinc-800 text-white font-bold h-12 text-sm sm:text-base shadow-md gap-2"
                  >
                    <CreditCard className="w-5 h-5 text-blue-400" />
                    {isSubmitting ? 'Processando...' : `Pagar ${formatBRL(total)} no Cartão`}
                  </Button>
                )}

                <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pedido via WhatsApp em segundos • Dados salvos no seu aparelho</span>
                </div>
              </div>
            </div>
          </div>

          {/* BARRA FIXA COLAPSÁVEL NO RODAPÉ MOBILE (Resumo & Finalização Flutuante) */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 p-3 shadow-2xl">
            {isMobileSummaryOpen && (
              <div className="mb-3 max-h-48 overflow-y-auto bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 text-xs space-y-2 animate-fade-in">
                <div className="flex justify-between font-bold text-zinc-900 border-b pb-1">
                  <span>Itens ({items.length})</span>
                  <span>{formatBRL(subtotal)}</span>
                </div>
                {items.map((it) => (
                  <div key={it.productId} className="flex justify-between text-zinc-600">
                    <span className="truncate pr-2">
                      {it.quantity}x {it.name}
                    </span>
                    <span className="font-mono">{formatBRL(it.unit_price * it.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-zinc-700 pt-1 border-t">
                  <span>Frete ({selectedRegion || 'Pendente'}):</span>
                  <span className="font-mono">
                    {isFreeShippingEligible ? 'Grátis' : formatBRL(shipping)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
                className="text-left"
              >
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">
                  {isMobileSummaryOpen ? 'Ocultar itens ▲' : 'Ver itens ▼'}
                </span>
                <span className="font-mono font-extrabold text-lg text-zinc-950 block leading-tight">
                  {formatBRL(total)}
                </span>
              </button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#25D366] hover:bg-[#1EBE5A] text-white font-bold h-11 text-xs sm:text-sm shadow-md gap-1.5"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                {isSubmitting ? 'Processando...' : 'Finalizar Pedido'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
