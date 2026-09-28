import pb from '@/lib/pocketbase/client'
import { Category } from '@/types/ecommerce'

export async function getCategories(): Promise<Category[]> {
  try {
    const records = await pb.collection('categories').getFullList<Category>({
      sort: 'name',
    })
    return records
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return []
  }
}

export async function createCategory(data: {
  name: string
  slug: string
  image?: File
}): Promise<Category> {
  const formData = new FormData()
  formData.append('name', data.name)
  formData.append('slug', data.slug)
  if (data.image) {
    formData.append('image', data.image)
  }
  return await pb.collection('categories').create<Category>(formData)
}

export async function updateCategory(
  id: string,
  data: { name?: string; slug?: string; image?: File },
): Promise<Category> {
  const formData = new FormData()
  if (data.name) formData.append('name', data.name)
  if (data.slug) formData.append('slug', data.slug)
  if (data.image) formData.append('image', data.image)
  return await pb.collection('categories').update<Category>(id, formData)
}

export async function deleteCategory(id: string): Promise<boolean> {
  await pb.collection('categories').delete(id)
  return true
}
