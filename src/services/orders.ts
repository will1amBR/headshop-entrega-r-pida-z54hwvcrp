import pb from '@/lib/pocketbase/client'
import { Order, OrderStatus } from '@/types/ecommerce'

export async function createOrder(data: {
  customer_name: string
  phone: string
  email?: string
  address: string
  city: string
  state: string
  cep?: string
  region: string
  items: Array<{ name: string; quantity: number; unit_price: number }>
  subtotal: number
  shipping: number
  total: number
  status?: OrderStatus
}): Promise<Order> {
  const payload = {
    ...data,
    status: data.status || 'novo',
  }
  return await pb.collection('orders').create<Order>(payload)
}

export async function getOrders(filterStatus?: string): Promise<Order[]> {
  try {
    const filter =
      filterStatus && filterStatus !== 'todos' ? `status = "${filterStatus}"` : undefined
    return await pb.collection('orders').getFullList<Order>({
      filter,
      sort: '-created',
    })
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error)
    return []
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  return await pb.collection('orders').update<Order>(orderId, { status })
}

export async function deleteOrder(orderId: string): Promise<boolean> {
  await pb.collection('orders').delete(orderId)
  return true
}
