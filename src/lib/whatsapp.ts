import { OrderItem } from '@/types/ecommerce'
import { formatBRL } from './formatters'

interface WhatsAppMessageParams {
  items: OrderItem[]
  subtotal: number
  shipping: number
  discount?: number
  region: string
  total: number
  customerName: string
  phone: string
  address: string
  city: string
  state: string
  cep?: string
}

/**
 * Builds the exact required WhatsApp order payload:
 *
 * *NOVO PEDIDO — HeadShop Entrega Rápida*
 *
 * *Itens:*
 * 1x Produto — R$ XX,XX
 * ...
 *
 * *Subtotal:* R$ XX,XX
 * *Frete (Região):* R$ XX,XX (ou Grátis)
 * *Total: R$ XX,XX*
 *
 * *Dados de entrega:*
 * Nome: ...
 * WhatsApp: ...
 * Endereço: ...
 * Cidade/UF: ...
 * CEP: ...
 *
 * *Pagamento:* combinado via WhatsApp.
 */
export function buildWhatsAppOrderMessage(params: WhatsAppMessageParams): string {
  const itemsText = params.items
    .map((item) => `${item.quantity}x ${item.name} — ${formatBRL(item.unit_price * item.quantity)}`)
    .join('\n')

  const shippingFormatted = params.shipping === 0 ? 'Grátis' : formatBRL(params.shipping)

  const lines = [
    `*NOVO PEDIDO — HeadShop Entrega Rápida*`,
    ``,
    `*Itens:*`,
    itemsText,
    ``,
    `*Subtotal:* ${formatBRL(params.subtotal)}`,
    params.discount && params.discount > 0
      ? `*Desconto Kit Completo (5% OFF):* -${formatBRL(params.discount)}`
      : null,
    `*Frete (${params.region}):* ${shippingFormatted}`,
    `*Total: ${formatBRL(params.total)}*`,
    ``,
    `*Dados de entrega:*`,
    `Nome: ${params.customerName}`,
    `WhatsApp: ${params.phone}`,
    `Endereço: ${params.address}`,
    `Cidade/UF: ${params.city}/${params.state}`,
    params.cep ? `CEP: ${params.cep}` : `CEP: Não informado`,
    ``,
    `*Pagamento:* combinado via WhatsApp com vendedor Ali.`,
  ].filter(Boolean) as string[]

  return lines.join('\n')
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '')
  // Garantir DDI do Brasil caso venha apenas DDD + número (ex: 11999999999 -> 5511999999999)
  const fullPhone = cleaned.length === 10 || cleaned.length === 11 ? `55${cleaned}` : cleaned
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${fullPhone}?text=${encoded}`
}

/**
 * Mensagem amigável e profissional de despacho de pedido com código de rastreio
 */
export function buildDispatchNotificationMessage(params: {
  customerName: string
  orderId: string
  carrier?: string
  trackingCode?: string
}): string {
  const lines = [
    `📦 *Seu pedido foi despachado! — HeadShop Entrega Rápida*`,
    ``,
    `Olá, *${params.customerName}*! Seu pedido *#${params.orderId.slice(-6).toUpperCase()}* já está a caminho com embalagem 100% discreta e segura.`,
    ``,
    params.carrier ? `🚚 *Transportadora:* ${params.carrier}` : `🚚 *Envio:* Express`,
    params.trackingCode ? `🔍 *Código de Rastreio:* ${params.trackingCode}` : null,
    ``,
    `Qualquer dúvida ou para acompanhar o trajeto, estamos à disposição aqui pelo WhatsApp (+55 48 99246-3428). Muito obrigado pela confiança! 🔥`,
  ].filter(Boolean) as string[]

  return lines.join('\n')
}
