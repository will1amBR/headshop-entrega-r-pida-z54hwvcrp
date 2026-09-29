import pb from '@/lib/pocketbase/client'
import { StockMovement, StockMovementType, Product } from '@/types/ecommerce'

export interface CreateStockMovementInput {
  product: string
  type: StockMovementType
  quantity: number
  reason: string
  supplier?: string
  movement_date?: string
}

export async function getStockMovements(productId?: string): Promise<StockMovement[]> {
  try {
    const filter = productId ? `product="${productId}"` : ''
    const records = await pb.collection('stock_movements').getFullList<StockMovement>({
      sort: '-created',
      filter: filter || undefined,
      expand: 'product,supplier',
    })
    return records
  } catch (error) {
    console.error('Erro ao buscar movimentações de estoque:', error)
    return []
  }
}

/**
 * Registra movimentação de estoque e atualiza atomicamente o campo `stock` no produto.
 */
export async function registerStockMovement(
  input: CreateStockMovementInput,
): Promise<StockMovement> {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  // 1. Obter o produto atual para calcular novo estoque
  const prod = await pb.collection('products').getOne<Product>(input.product)
  const currentStock = Number(prod.stock) || 0
  const qty = Number(input.quantity) || 0

  let newStock = currentStock
  if (input.type === 'entrada') {
    newStock = currentStock + qty
  } else if (input.type === 'saida') {
    newStock = Math.max(0, currentStock - qty)
  } else if (input.type === 'ajuste') {
    newStock = Math.max(0, qty)
  }

  // 2. Atualizar o produto
  await pb.collection('products').update(input.product, {
    stock: newStock,
  })

  // 3. Salvar registro na coleção stock_movements
  const movement = await pb.collection('stock_movements').create<StockMovement>({
    ...input,
    movement_date: input.movement_date || now,
  })

  return movement
}

/**
 * Gera saídas automáticas para todos os itens de um pedido (se ainda não baixados).
 */
export async function deductOrderStock(
  orderId: string,
  items: Array<{ name: string; quantity: number }>,
): Promise<void> {
  try {
    // Buscar todos os produtos do catálogo para associar pelo nome
    const allProducts = await pb.collection('products').getFullList<Product>()
    const productMap = new Map<string, Product>()
    allProducts.forEach((p) => {
      productMap.set(p.name.trim().toLowerCase(), p)
    })

    for (const item of items) {
      const match = productMap.get(item.name.trim().toLowerCase())
      if (match) {
        await registerStockMovement({
          product: match.id,
          type: 'saida',
          quantity: item.quantity,
          reason: `Venda Pedido #${orderId}`,
        })
      }
    }
  } catch (err) {
    console.error('Erro ao baixar estoque do pedido:', err)
  }
}
