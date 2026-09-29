import pb from '@/lib/pocketbase/client'
import { Product } from '@/types/ecommerce'

export async function getProducts(options?: {
  activeOnly?: boolean
  featuredOnly?: boolean
  category?: string
  search?: string
  sort?: string
}): Promise<Product[]> {
  try {
    const filters: string[] = []

    if (options?.activeOnly !== false) {
      // Por padrão na loja traz apenas produtos ativos
      filters.push('active = true')
    }

    if (options?.featuredOnly) {
      filters.push('featured = true')
    }

    if (options?.category && options.category !== 'todos') {
      filters.push(`category = "${options.category}"`)
    }

    if (options?.search) {
      filters.push(`name ~ "${options.search}"`)
    }

    const filterString = filters.join(' && ')

    const records = await pb.collection('products').getFullList<Product>({
      filter: filterString || undefined,
      sort: options?.sort || '-created',
      expand: 'category',
    })

    return records
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return []
  }
}

export async function getAllProductsAdmin(): Promise<Product[]> {
  try {
    return await pb.collection('products').getFullList<Product>({
      sort: '-created',
      expand: 'category',
    })
  } catch (error) {
    console.error('Erro ao buscar produtos admin:', error)
    return []
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    return await pb.collection('products').getOne<Product>(id, {
      expand: 'category',
    })
  } catch (error) {
    console.error('Erro ao buscar produto por id:', error)
    return null
  }
}

export async function createProduct(data: {
  name: string
  description: string
  price: number
  stock: number
  cost_price?: number
  min_stock?: number
  featured: boolean
  active: boolean
  category: string
  ncm?: string
  image?: File
}): Promise<Product> {
  const formData = new FormData()
  formData.append('name', data.name)
  formData.append('description', data.description)
  formData.append('price', String(data.price))
  formData.append('stock', String(data.stock))
  if (data.cost_price !== undefined) formData.append('cost_price', String(data.cost_price))
  if (data.min_stock !== undefined) formData.append('min_stock', String(data.min_stock))
  formData.append('featured', String(data.featured))
  formData.append('active', String(data.active))
  formData.append('category', data.category)
  if (data.ncm) formData.append('ncm', data.ncm)
  if (data.image) {
    formData.append('image', data.image)
  }
  return await pb.collection('products').create<Product>(formData)
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string
    description: string
    price: number
    stock: number
    cost_price?: number
    min_stock?: number
    featured: boolean
    active: boolean
    category: string
    ncm?: string
    image?: File
  }>,
): Promise<Product> {
  const formData = new FormData()
  if (data.name !== undefined) formData.append('name', data.name)
  if (data.description !== undefined) formData.append('description', data.description)
  if (data.price !== undefined) formData.append('price', String(data.price))
  if (data.stock !== undefined) formData.append('stock', String(data.stock))
  if (data.cost_price !== undefined) formData.append('cost_price', String(data.cost_price))
  if (data.min_stock !== undefined) formData.append('min_stock', String(data.min_stock))
  if (data.featured !== undefined) formData.append('featured', String(data.featured))
  if (data.active !== undefined) formData.append('active', String(data.active))
  if (data.category !== undefined) formData.append('category', data.category)
  if (data.ncm !== undefined) formData.append('ncm', data.ncm)
  if (data.image) formData.append('image', data.image)

  return await pb.collection('products').update<Product>(id, formData)
}

export async function toggleProductActive(id: string, currentActive: boolean): Promise<Product> {
  return await pb.collection('products').update<Product>(id, {
    active: !currentActive,
  })
}

export async function deleteProduct(id: string): Promise<boolean> {
  await pb.collection('products').delete(id)
  return true
}
