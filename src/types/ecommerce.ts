export interface Category {
  id: string
  name: string
  slug: string
  image?: string
  created: string
  updated: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  cost_price?: number
  min_stock?: number
  image?: string
  stock: number
  featured: boolean
  active: boolean
  category: string
  ncm?: string
  expand?: {
    category?: Category
  }
  created: string
  updated: string
}

export type PaymentMethod = 'pix' | 'cartao' | 'outro'
export type PaymentStatus = 'pendente' | 'pago' | 'expirado' | 'cancelado'

export interface Payment {
  id: string
  order: string
  expand?: {
    order?: Order
  }
  gateway: string
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  txid?: string
  qr_code?: string
  payload?: any
  paid_at?: string
  created: string
  updated: string
}

export type InvoiceStatus = 'pendente' | 'emitida' | 'cancelada' | 'erro'

export interface Invoice {
  id: string
  order: string
  expand?: {
    order?: Order
  }
  invoice_number?: string
  series?: string
  status: InvoiceStatus
  xml_url?: string
  danfe_url?: string
  access_key?: string
  protocol?: string
  issued_at?: string
  error_message?: string
  created: string
  updated: string
}

export interface Supplier {
  id: string
  name: string
  contact_person?: string
  phone?: string
  email?: string
  cnpj?: string
  supplied_products?: string
  notes?: string
  created: string
  updated: string
}

export type StockMovementType = 'entrada' | 'saida' | 'ajuste'

export interface StockMovement {
  id: string
  product: string
  expand?: {
    product?: Product
    supplier?: Supplier
  }
  type: StockMovementType
  quantity: number
  reason: string
  supplier?: string
  movement_date?: string
  created: string
  updated: string
}

export type PurchaseOrderStatus = 'rascunho' | 'enviado' | 'confirmado' | 'recebido' | 'cancelado'

export interface PurchaseOrderItem {
  product_id: string
  name: string
  quantity: number
  unit_cost: number
  subtotal: number
}

export interface PurchaseOrder {
  id: string
  supplier: string
  expand?: {
    supplier?: Supplier
  }
  items: PurchaseOrderItem[]
  status: PurchaseOrderStatus
  total: number
  expected_date?: string
  received_at?: string
  notes?: string
  created: string
  updated: string
}

export interface IntegrationSetting {
  id: string
  key: string
  value?: string
  environment?: string
  status?: string
  last_sync?: string
  details?: any
  created: string
  updated: string
}

export type OrderStatus = 'novo' | 'em preparo' | 'enviado' | 'entregue' | 'cancelado'

export interface OrderItem {
  id?: string
  name: string
  quantity: number
  unit_price: number
  image?: string
}

export interface Order {
  id: string
  customer_name: string
  phone: string
  email?: string
  address: string
  city: string
  state: string
  cep?: string
  region: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul'
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  status: OrderStatus
  created: string
  updated: string
}

export type ShippingStatus =
  | 'separacao'
  | 'pronto_envio'
  | 'enviado'
  | 'em_transito'
  | 'entregue'
  | 'devolvido'
  | 'devolucao_recebida'

export interface Shipment {
  id: string
  order: string
  expand?: {
    order?: Order
  }
  tracking_code?: string
  carrier?: string
  shipping_status: ShippingStatus
  return_reason?: string
  refund_amount?: number
  shipped_at?: string
  delivered_at?: string
  returned_at?: string
  notes?: string
  created: string
  updated: string
}

export interface SeoSettings {
  id: string
  store_name: string
  whatsapp_number: string
  announcement_text?: string
  hero_title?: string
  hero_subtitle?: string
  created: string
  updated: string
}

export type CampaignStatus = 'rascunho' | 'ativa' | 'concluida' | 'pausada'

export interface Campaign {
  id: string
  name: string
  type?: string
  description?: string
  target_audience?: string
  status: CampaignStatus
  start_date?: string
  end_date?: string
  discount_code?: string
  message_template?: string
  clicks_count?: number
  created: string
  updated: string
}

export interface CustomerProfile {
  id: string
  name: string
  phone: string
  email?: string
  city: string
  state: string
  region: string
  ordersCount: number
  totalSpent: number
  averageTicket: number
  lastOrderDate: string
  firstOrderDate: string
  orders: Order[]
}

export type BrazilRegion = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul'

export const REGION_SHIPPING_RATES: Record<BrazilRegion, number> = {
  Norte: 49.9,
  Nordeste: 39.9,
  'Centro-Oeste': 34.9,
  Sudeste: 24.9,
  Sul: 29.9,
}

export const BRAZIL_REGIONS: BrazilRegion[] = [
  'Sudeste',
  'Sul',
  'Centro-Oeste',
  'Nordeste',
  'Norte',
]

export const BRAZIL_STATES: { uf: string; name: string; region: BrazilRegion }[] = [
  { uf: 'AC', name: 'Acre', region: 'Norte' },
  { uf: 'AL', name: 'Alagoas', region: 'Nordeste' },
  { uf: 'AP', name: 'Amapá', region: 'Norte' },
  { uf: 'AM', name: 'Amazonas', region: 'Norte' },
  { uf: 'BA', name: 'Bahia', region: 'Nordeste' },
  { uf: 'CE', name: 'Ceará', region: 'Nordeste' },
  { uf: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste' },
  { uf: 'ES', name: 'Espírito Santo', region: 'Sudeste' },
  { uf: 'GO', name: 'Goiás', region: 'Centro-Oeste' },
  { uf: 'MA', name: 'Maranhão', region: 'Nordeste' },
  { uf: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste' },
  { uf: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste' },
  { uf: 'MG', name: 'Minas Gerais', region: 'Sudeste' },
  { uf: 'PA', name: 'Pará', region: 'Norte' },
  { uf: 'PB', name: 'Paraíba', region: 'Nordeste' },
  { uf: 'PR', name: 'Paraná', region: 'Sul' },
  { uf: 'PE', name: 'Pernambuco', region: 'Nordeste' },
  { uf: 'PI', name: 'Piauí', region: 'Nordeste' },
  { uf: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste' },
  { uf: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste' },
  { uf: 'RS', name: 'Rio Grande do Sul', region: 'Sul' },
  { uf: 'RO', name: 'Rondônia', region: 'Norte' },
  { uf: 'RR', name: 'Roraima', region: 'Norte' },
  { uf: 'SC', name: 'Santa Catarina', region: 'Sul' },
  { uf: 'SP', name: 'São Paulo', region: 'Sudeste' },
  { uf: 'SE', name: 'Sergipe', region: 'Nordeste' },
  { uf: 'TO', name: 'Tocantins', region: 'Norte' },
]

export const FREE_SHIPPING_THRESHOLD = 299
