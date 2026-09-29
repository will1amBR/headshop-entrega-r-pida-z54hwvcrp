import pb from '@/lib/pocketbase/client'
import { Campaign, CampaignStatus } from '@/types/ecommerce'

export async function getCampaigns(): Promise<Campaign[]> {
  try {
    return await pb.collection('campaigns').getFullList<Campaign>({
      sort: '-created',
    })
  } catch (err) {
    console.error('Erro ao buscar campanhas:', err)
    return []
  }
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  try {
    return await pb.collection('campaigns').getOne<Campaign>(id)
  } catch (err) {
    console.error('Erro ao buscar campanha por id:', err)
    return null
  }
}

export async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
  const payload = {
    name: data.name || 'Nova Campanha',
    type: data.type || 'Geral',
    description: data.description || '',
    target_audience: data.target_audience || 'todos',
    status: (data.status as CampaignStatus) || 'rascunho',
    start_date: data.start_date || new Date().toISOString().split('T')[0],
    end_date: data.end_date || '',
    discount_code: data.discount_code || '',
    message_template: data.message_template || '',
    clicks_count: data.clicks_count || 0,
  }
  return await pb.collection('campaigns').create<Campaign>(payload)
}

export async function updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
  return await pb.collection('campaigns').update<Campaign>(id, data)
}

export async function deleteCampaign(id: string): Promise<boolean> {
  await pb.collection('campaigns').delete(id)
  return true
}

export async function incrementCampaignClicks(id: string): Promise<void> {
  try {
    const existing = await pb.collection('campaigns').getOne<Campaign>(id)
    const currentClicks = existing.clicks_count || 0
    await pb.collection('campaigns').update(id, { clicks_count: currentClicks + 1 })
  } catch (e) {
    console.warn('Não foi possível incrementar cliques da campanha:', e)
  }
}
