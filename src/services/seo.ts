import pb from '@/lib/pocketbase/client'
import { SeoSettings } from '@/types/ecommerce'

export async function getSeoSettings(): Promise<SeoSettings | null> {
  try {
    const records = await pb.collection('seo_settings').getFullList<SeoSettings>({
      sort: '-created',
    })
    if (records.length > 0) {
      return records[0]
    }
    return null
  } catch (error) {
    console.error('Erro ao buscar configurações SEO/loja:', error)
    return null
  }
}

export async function updateSeoSettings(
  id: string,
  data: Partial<Omit<SeoSettings, 'id' | 'created' | 'updated'>>,
): Promise<SeoSettings> {
  return await pb.collection('seo_settings').update<SeoSettings>(id, data)
}
