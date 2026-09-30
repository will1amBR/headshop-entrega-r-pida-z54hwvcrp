import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from 'react'
import {
  BrazilRegion,
  FREE_SHIPPING_THRESHOLD,
  OrderItem,
  Product,
  REGION_SHIPPING_RATES,
} from '@/types/ecommerce'
import { AddedToCartModal } from '@/components/AddedToCartModal'

export interface CartItem extends OrderItem {
  productId: string
  maxStock: number
  category?: string
}

export interface KitDiscountInfo {
  isEligible: boolean
  discountAmount: number
  eligibleItemsTotal: number
  sedaFound: boolean
  cuiaFound: boolean
  tesouraFound: boolean
  tabacoFound: boolean
}

export interface InactivityDiscountInfo {
  isActive: boolean
  discountPercent: number // 2
  discountAmount: number
  expiresAt: number | null
  remainingSeconds: number
}

interface CartContextType {
  items: CartItem[]
  selectedRegion: BrazilRegion | null
  cep: string
  setSelectedRegion: (region: BrazilRegion | null) => void
  setCep: (cep: string) => void
  addItem: (product: Product, quantity?: number, showModal?: boolean) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItemsCount: number
  subtotal: number
  shipping: number
  kitDiscount: KitDiscountInfo
  inactivityDiscount: InactivityDiscountInfo
  total: number
  isFreeShippingEligible: boolean
  freeShippingThreshold: number
  remainingForFreeShipping: number
  openAddToCartModal: (product: Product, quantity?: number) => void
  isOfferModalOpen: boolean
  dismissInactivityOffer: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'headshop_cart_items_v1'
const REGION_STORAGE_KEY = 'headshop_cart_region_v1'
const CEP_STORAGE_KEY = 'headshop_cart_cep_v1'
const INACTIVITY_STORAGE_KEY = 'headshop_inactivity_discount_v1'

const INACTIVITY_TRIGGER_MS = 3 * 60 * 1000 // 3 minutos
const DISCOUNT_DURATION_MS = 5 * 60 * 1000 // 5 minutos (300s)

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

  // Modal de confirmação pós adição ao carrinho
  const [addedModalState, setAddedModalState] = useState<{
    isOpen: boolean
    product: Product | null
    quantity: number
  }>({
    isOpen: false,
    product: null,
    quantity: 1,
  })

  // Estado do desconto de inatividade (persistente por sessão)
  const [inactivityState, setInactivityState] = useState<{
    triggered: boolean
    expiresAt: number | null
  }>(() => {
    try {
      const saved = sessionStorage.getItem(INACTIVITY_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          return parsed
        }
        return { triggered: true, expiresAt: null }
      }
    } catch (_) {
      /* ignore */
    }
    return { triggered: false, expiresAt: null }
  })

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (inactivityState.expiresAt) {
      return Math.max(0, Math.floor((inactivityState.expiresAt - Date.now()) / 1000))
    }
    return 0
  })

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false)
  const lastActivityRef = useRef<number>(Date.now())

  // Sincronizar items, região e CEP
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

  // Timer regressivo de 5 minutos do desconto ativo
  useEffect(() => {
    if (!inactivityState.expiresAt) return

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((inactivityState.expiresAt! - Date.now()) / 1000))
      setRemainingSeconds(remaining)
      if (remaining <= 0) {
        setInactivityState((prev) => ({ ...prev, expiresAt: null }))
        try {
          sessionStorage.setItem(
            INACTIVITY_STORAGE_KEY,
            JSON.stringify({ triggered: true, expiresAt: null }),
          )
        } catch (_) {
          /* ignore */
        }
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [inactivityState.expiresAt])

  // Detecção de inatividade de 3 minutos (dispara apenas 1 vez por sessão)
  const triggerInactivityDiscount = useCallback(() => {
    if (inactivityState.triggered) return

    const expiresAt = Date.now() + DISCOUNT_DURATION_MS
    const newState = { triggered: true, expiresAt }
    setInactivityState(newState)
    setRemainingSeconds(Math.floor(DISCOUNT_DURATION_MS / 1000))
    setIsOfferModalOpen(true)

    try {
      sessionStorage.setItem(INACTIVITY_STORAGE_KEY, JSON.stringify(newState))
    } catch (_) {
      /* ignore */
    }
  }, [inactivityState.triggered])

  useEffect(() => {
    if (inactivityState.triggered) return

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now()
    }

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    activityEvents.forEach((evt) =>
      window.addEventListener(evt, handleUserActivity, { passive: true }),
    )

    const checkInterval = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current
      if (idleTime >= INACTIVITY_TRIGGER_MS) {
        triggerInactivityDiscount()
      }
    }, 10000) // checa a cada 10s

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleUserActivity))
      clearInterval(checkInterval)
    }
  }, [inactivityState.triggered, triggerInactivityDiscount])

  const openAddToCartModal = useCallback((product: Product, quantity: number = 1) => {
    setAddedModalState({
      isOpen: true,
      product,
      quantity,
    })
  }, [])

  const addItem = (product: Product, quantity: number = 1, showModal: boolean = true) => {
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

    if (showModal) {
      openAddToCartModal(product, quantity)
    }
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

  // Kit Promocional: 1 Seda + 1 Cuia + 1 Tesoura + 1 Tabaco/Pote hermético => 5% OFF nesses itens
  const kitDiscount = useMemo<KitDiscountInfo>(() => {
    let sedaFound = false
    let cuiaFound = false
    let tesouraFound = false
    let tabacoFound = false
    let kitItemsSum = 0

    for (const item of items) {
      const name = item.name.toLowerCase()
      if (
        !sedaFound &&
        name.includes('seda') &&
        !name.includes('porta') &&
        !name.includes('cone')
      ) {
        sedaFound = true
        kitItemsSum += item.unit_price
      } else if (!cuiaFound && name.includes('cuia')) {
        cuiaFound = true
        kitItemsSum += item.unit_price
      } else if (!tesouraFound && name.includes('tesoura')) {
        tesouraFound = true
        kitItemsSum += item.unit_price
      } else if (
        !tabacoFound &&
        (name.includes('tabaco') ||
          name.includes('fumo') ||
          name.includes('pote') ||
          name.includes('kumbaya'))
      ) {
        tabacoFound = true
        kitItemsSum += item.unit_price
      }
    }

    const isEligible = sedaFound && cuiaFound && tesouraFound && tabacoFound
    const discountAmount = isEligible ? Number((kitItemsSum * 0.05).toFixed(2)) : 0

    return {
      isEligible,
      discountAmount,
      eligibleItemsTotal: Number(kitItemsSum.toFixed(2)),
      sedaFound,
      cuiaFound,
      tesouraFound,
      tabacoFound,
    }
  }, [items])

  // Desconto de inatividade: 2% sobre o subtotal se ativo
  const inactivityDiscount = useMemo<InactivityDiscountInfo>(() => {
    const isStillActive = Boolean(
      inactivityState.expiresAt && Date.now() < inactivityState.expiresAt && subtotal > 0,
    )
    const discountAmount = isStillActive ? Number((subtotal * 0.02).toFixed(2)) : 0

    return {
      isActive: isStillActive,
      discountPercent: 2,
      discountAmount,
      expiresAt: inactivityState.expiresAt,
      remainingSeconds: isStillActive ? remainingSeconds : 0,
    }
  }, [inactivityState.expiresAt, remainingSeconds, subtotal])

  const total = useMemo(() => {
    const rawTotal =
      subtotal + shipping - kitDiscount.discountAmount - inactivityDiscount.discountAmount
    return Number(Math.max(0, rawTotal).toFixed(2))
  }, [subtotal, shipping, kitDiscount.discountAmount, inactivityDiscount.discountAmount])

  const dismissInactivityOffer = () => {
    setIsOfferModalOpen(false)
  }

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
        kitDiscount,
        inactivityDiscount,
        total,
        isFreeShippingEligible,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        remainingForFreeShipping,
        openAddToCartModal,
        isOfferModalOpen,
        dismissInactivityOffer,
      }}
    >
      {children}

      {/* Modal global de confirmação pós adição ao carrinho */}
      <AddedToCartModal
        isOpen={addedModalState.isOpen}
        onClose={() => setAddedModalState((prev) => ({ ...prev, isOpen: false }))}
        product={addedModalState.product}
        quantity={addedModalState.quantity}
      />
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
