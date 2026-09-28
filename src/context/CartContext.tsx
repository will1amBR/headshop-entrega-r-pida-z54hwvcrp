import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import {
  BrazilRegion,
  FREE_SHIPPING_THRESHOLD,
  OrderItem,
  Product,
  REGION_SHIPPING_RATES,
} from '@/types/ecommerce'
import { toast } from '@/hooks/use-toast'

export interface CartItem extends OrderItem {
  productId: string
  maxStock: number
  category?: string
}

interface CartContextType {
  items: CartItem[]
  selectedRegion: BrazilRegion | null
  cep: string
  setSelectedRegion: (region: BrazilRegion | null) => void
  setCep: (cep: string) => void
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItemsCount: number
  subtotal: number
  shipping: number
  total: number
  isFreeShippingEligible: boolean
  freeShippingThreshold: number
  remainingForFreeShipping: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'headshop_cart_items_v1'
const REGION_STORAGE_KEY = 'headshop_cart_region_v1'
const CEP_STORAGE_KEY = 'headshop_cart_cep_v1'

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch (_) {
      return []
    }
  })

  const [selectedRegion, setSelectedRegion] = useState<BrazilRegion | null>(() => {
    try {
      const saved = localStorage.getItem(REGION_STORAGE_KEY)
      return (saved as BrazilRegion) || null
    } catch (_) {
      return null
    }
  })

  const [cep, setCep] = useState<string>(() => {
    try {
      return localStorage.getItem(CEP_STORAGE_KEY) || ''
    } catch (_) {
      return ''
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch (e) {
      console.error('Erro ao salvar carrinho no localStorage', e)
    }
  }, [items])

  useEffect(() => {
    try {
      if (selectedRegion) {
        localStorage.setItem(REGION_STORAGE_KEY, selectedRegion)
      } else {
        localStorage.removeItem(REGION_STORAGE_KEY)
      }
    } catch (e) {
      console.error('Erro ao salvar região no localStorage', e)
    }
  }, [selectedRegion])

  useEffect(() => {
    try {
      localStorage.setItem(CEP_STORAGE_KEY, cep)
    } catch (e) {
      console.error('Erro ao salvar CEP no localStorage', e)
    }
  }, [cep])

  const addItem = (product: Product, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.productId === product.id)
      const stock = product.stock > 0 ? product.stock : 99

      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity
        const newQty = Math.min(stock, currentQty + quantity)
        const updated = [...prevItems]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        }
        return updated
      } else {
        const newItem: CartItem = {
          productId: product.id,
          name: product.name,
          quantity: Math.min(stock, Math.max(1, quantity)),
          unit_price: product.price,
          maxStock: stock,
          category: product.category,
          image: product.image,
        }
        return [...prevItems, newItem]
      }
    })

    toast({
      title: '✓ Adicionado ao carrinho',
      description: `${product.name} foi adicionado com sucesso.`,
      duration: 2500,
    })
  }

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const clamped = Math.min(item.maxStock || 99, quantity)
          return { ...item, quantity: clamped }
        }
        return item
      }),
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const totalItemsCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  }, [items])

  const subtotal = useMemo(() => {
    return Number(items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0).toFixed(2))
  }, [items])

  const isFreeShippingEligible = subtotal >= FREE_SHIPPING_THRESHOLD
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)

  const shipping = useMemo(() => {
    if (!selectedRegion || items.length === 0) return 0
    if (isFreeShippingEligible) return 0
    return REGION_SHIPPING_RATES[selectedRegion] || 0
  }, [selectedRegion, isFreeShippingEligible, items.length])

  const total = useMemo(() => {
    return Number((subtotal + shipping).toFixed(2))
  }, [subtotal, shipping])

  return (
    <CartContext.Provider
      value={{
        items,
        selectedRegion,
        cep,
        setSelectedRegion,
        setCep,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItemsCount,
        subtotal,
        shipping,
        total,
        isFreeShippingEligible,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        remainingForFreeShipping,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider')
  }
  return context
}
