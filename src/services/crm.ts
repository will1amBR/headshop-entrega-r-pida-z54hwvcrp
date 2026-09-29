import { Order, CustomerProfile } from '@/types/ecommerce'
import { cleanPhone } from '@/lib/formatters'

/**
 * Constrói perfis analíticos de clientes CRM a partir dos pedidos registrados.
 * Agrupa por telefone limpo (ou e-mail/nome), computa métricas históricas de LTV,
 * frequência, ticket médio, recência e histórico detalhado de compras.
 */
export function buildCustomerProfilesFromOrders(orders: Order[]): CustomerProfile[] {
  const map = new Map<string, Order[]>()

  for (const o of orders) {
    const rawKey =
      cleanPhone(o.phone) || o.email?.toLowerCase().trim() || o.customer_name.trim().toLowerCase()
    if (!rawKey) continue

    const list = map.get(rawKey) || []
    list.push(o)
    map.set(rawKey, list)
  }

  const profiles: CustomerProfile[] = []

  for (const [key, clientOrders] of map.entries()) {
    // Ordenar pedidos por data desc
    const sorted = [...clientOrders].sort((a, b) => {
      const ta = new Date(a.created).getTime()
      const tb = new Date(b.created).getTime()
      return tb - ta
    })

    const latest = sorted[0]
    const oldest = sorted[sorted.length - 1]

    // Pedidos válidos para receita (não cancelados)
    const validOrders = sorted.filter((o) => o.status !== 'cancelado')
    const totalSpent = validOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    const ordersCount = sorted.length
    const averageTicket = validOrders.length > 0 ? totalSpent / validOrders.length : 0

    profiles.push({
      id: key,
      name: latest.customer_name || 'Cliente',
      phone: latest.phone,
      email: latest.email,
      city: latest.city || '',
      state: latest.state || '',
      region: latest.region || 'Sudeste',
      ordersCount,
      totalSpent,
      averageTicket,
      lastOrderDate: latest.created,
      firstOrderDate: oldest.created,
      orders: sorted,
    })
  }

  // Ordenar por total gasto desc por padrão
  return profiles.sort((a, b) => b.totalSpent - a.totalSpent)
}

/**
 * Retorna contagem e lista de clientes segmentados por perfil de público
 */
export function segmentCustomers(
  profiles: CustomerProfile[],
  audienceKey?: string,
): { count: number; customers: CustomerProfile[] } {
  if (!audienceKey || audienceKey === 'todos') {
    return { count: profiles.length, customers: profiles }
  }

  const now = new Date().getTime()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

  let filtered: CustomerProfile[] = []

  switch (audienceKey) {
    case 'ativos':
      // Comprou nos últimos 30 dias
      filtered = profiles.filter((p) => {
        const last = new Date(p.lastOrderDate).getTime()
        return now - last <= thirtyDaysMs
      })
      break

    case 'inativos_30d':
      // Sem compras há mais de 30 dias
      filtered = profiles.filter((p) => {
        const last = new Date(p.lastOrderDate).getTime()
        return now - last > thirtyDaysMs
      })
      break

    case 'recorrentes_2plus':
      // Mais de 1 pedido
      filtered = profiles.filter((p) => p.ordersCount >= 2)
      break

    case 'gastos_altos':
      // Total gasto acima de R$ 200
      filtered = profiles.filter((p) => p.totalSpent >= 200)
      break

    case 'sudeste':
      filtered = profiles.filter((p) => p.region === 'Sudeste')
      break

    case 'novos':
      // Apenas 1 pedido
      filtered = profiles.filter((p) => p.ordersCount === 1)
      break

    default:
      filtered = profiles
  }

  return { count: filtered.length, customers: filtered }
}
