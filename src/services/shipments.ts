import pb from '@/lib/pocketbase/client'
import { Shipment, ShippingStatus } from '@/types/ecommerce'

export async function getShipments(filterStatus?: string): Promise<Shipment[]> {
  try {
    const filter =
      filterStatus && filterStatus !== 'todos' ? `shipping_status = "${filterStatus}"` : undefined

    return await pb.collection('shipments').getFullList<Shipment>({
      filter,
      sort: '-created',
      expand: 'order',
    })
  } catch (error) {
    console.error('Erro ao buscar envios (shipments):', error)
    return []
  }
}

export async function getShipmentByOrderId(orderId: string): Promise<Shipment | null> {
  try {
    const records = await pb.collection('shipments').getFullList<Shipment>({
      filter: `order = "${orderId}"`,
      sort: '-created',
      expand: 'order',
    })
    return records[0] || null
  } catch (error) {
    console.error('Erro ao buscar shipment por orderId:', error)
    return null
  }
}

export async function createShipment(data: {
  order: string
  tracking_code?: string
  carrier?: string
  shipping_status: ShippingStatus
  return_reason?: string
  refund_amount?: number
  shipped_at?: string
  delivered_at?: string
  returned_at?: string
  notes?: string
}): Promise<Shipment> {
  return await pb.collection('shipments').create<Shipment>(data, {
    expand: 'order',
  })
}

export async function updateShipment(
  shipmentId: string,
  data: Partial<Omit<Shipment, 'id' | 'created' | 'updated' | 'expand'>>,
): Promise<Shipment> {
  return await pb.collection('shipments').update<Shipment>(shipmentId, data, {
    expand: 'order',
  })
}

export async function deleteShipment(shipmentId: string): Promise<boolean> {
  await pb.collection('shipments').delete(shipmentId)
  return true
}

/**
 * Registra ou atualiza um envio associado a um pedido.
 * Se já existir shipment para esse pedido, atualiza. Se não existir, cria.
 */
export async function syncOrderShipment(
  orderId: string,
  shippingStatus: ShippingStatus,
  extra?: {
    tracking_code?: string
    carrier?: string
    notes?: string
    shipped_at?: string
    delivered_at?: string
  },
): Promise<Shipment> {
  try {
    const existing = await getShipmentByOrderId(orderId)
    if (existing) {
      const payload: Partial<Shipment> = {
        shipping_status: shippingStatus,
        ...extra,
      }
      return await updateShipment(existing.id, payload)
    } else {
      return await createShipment({
        order: orderId,
        shipping_status: shippingStatus,
        ...extra,
      })
    }
  } catch (error) {
    console.error('Erro ao sincronizar shipment do pedido:', error)
    throw error
  }
}
