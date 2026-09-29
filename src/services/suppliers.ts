import pb from '@/lib/pocketbase/client'
import {
  Supplier,
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderItem,
  Product,
} from '@/types/ecommerce'
import { registerStockMovement } from './stock'

export async function getSuppliers(): Promise<Supplier[]> {
  try {
    const records = await pb.collection('suppliers').getFullList<Supplier>({
      sort: 'name',
    })
    return records
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error)
    return []
  }
}

export async function createSupplier(
  data: Omit<Supplier, 'id' | 'created' | 'updated'>,
): Promise<Supplier> {
  const record = await pb.collection('suppliers').create<Supplier>(data)
  return record
}

export async function updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {
  const record = await pb.collection('suppliers').update<Supplier>(id, data)
  return record
}

export async function deleteSupplier(id: string): Promise<boolean> {
  await pb.collection('suppliers').delete(id)
  return true
}

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  try {
    const records = await pb.collection('purchase_orders').getFullList<PurchaseOrder>({
      sort: '-created',
      expand: 'supplier',
    })
    return records
  } catch (error) {
    console.error('Erro ao buscar pedidos de recompra:', error)
    return []
  }
}

export async function createPurchaseOrder(data: {
  supplier: string
  items: PurchaseOrderItem[]
  status?: PurchaseOrderStatus
  total: number
  expected_date?: string
  notes?: string
}): Promise<PurchaseOrder> {
  const record = await pb.collection('purchase_orders').create<PurchaseOrder>({
    ...data,
    status: data.status || 'rascunho',
  })
  return record
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: PurchaseOrderStatus,
): Promise<PurchaseOrder> {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const updateData: Partial<PurchaseOrder> = { status }

  if (status === 'recebido') {
    updateData.received_at = now
  }

  const record = await pb.collection('purchase_orders').update<PurchaseOrder>(id, updateData)

  // Ao marcar como recebido, gerar automaticamente as entradas de estoque
  if (status === 'recebido' && Array.isArray(record.items)) {
    for (const it of record.items) {
      if (it.product_id && it.quantity > 0) {
        try {
          await registerStockMovement({
            product: it.product_id,
            type: 'entrada',
            quantity: it.quantity,
            reason: `Recompra #${id.slice(-6).toUpperCase()} Recebida`,
            supplier: record.supplier,
          })
        } catch (e) {
          console.error('Erro ao gerar entrada de estoque da recompra:', e)
        }
      }
    }
  }

  return record
}

/**
 * Regra: Sugerir recompra para produtos com estoque abaixo de min_stock.
 * Quantidade sugerida = (min_stock * 2) - stock atual.
 */
export interface RecompraSuggestion {
  product: Product
  currentStock: number
  minStock: number
  suggestedQty: number
  estimatedUnitCost: number
  estimatedSubtotal: number
}

export function calculateRecompraSuggestions(products: Product[]): RecompraSuggestion[] {
  const suggestions: RecompraSuggestion[] = []

  products.forEach((p) => {
    const min = p.min_stock ?? 10
    const stock = p.stock ?? 0
    if (stock < min) {
      const suggestedQty = Math.max(1, min * 2 - stock)
      const cost = p.cost_price || Math.round((p.price || 50) * 0.4 * 100) / 100
      suggestions.push({
        product: p,
        currentStock: stock,
        minStock: min,
        suggestedQty,
        estimatedUnitCost: cost,
        estimatedSubtotal: Math.round(suggestedQty * cost * 100) / 100,
      })
    }
  })

  return suggestions
}
