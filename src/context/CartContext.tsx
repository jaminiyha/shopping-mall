import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { CartItem } from '@/types/product'

interface CartContextType {
  cartItems: CartItem[]
  cartCount: number
  totalAmount: number
  loading: boolean
  addToCart: (productId: string, quantity?: number) => Promise<void>
  removeFromCart: (cartItemId: string) => Promise<void>
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// 로컬스토리지 키
const CART_STORAGE_KEY = 'shopping-mall-cart'

// 비로그인 사용자를 위한 로컬스토리지 장바구니 아이템 타입
interface LocalCartItem {
  productId: string
  quantity: number
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  // 로컬스토리지에서 장바구니 로드
  const loadLocalCart = (): LocalCartItem[] => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  // 로컬스토리지에 장바구니 저장
  const saveLocalCart = (items: LocalCartItem[]) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.error('로컬스토리지 저장 오류:', error)
    }
  }

  // Supabase에서 장바구니 가져오기
  const fetchCart = useCallback(async () => {
    if (!user) {
      // 비로그인 사용자는 로컬스토리지에서 로드
      const localItems = loadLocalCart()
      if (localItems.length === 0) {
        setCartItems([])
        setLoading(false)
        return
      }

      // 로컬스토리지 아이템을 Product 정보와 함께 가져오기
      const itemsWithProducts: CartItem[] = []
      for (const localItem of localItems) {
        const { data: product } = await supabase
          .from('products')
          .select('*')
          .eq('id', localItem.productId)
          .single()

        if (product) {
          itemsWithProducts.push({
            id: `local-${localItem.productId}`,
            user_id: '',
            product_id: localItem.productId,
            quantity: localItem.quantity,
            created_at: '',
            product: product,
          })
        }
      }
      setCartItems(itemsWithProducts)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cart')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCartItems((data as CartItem[]) || [])
    } catch (error) {
      console.error('장바구니 로드 오류:', error)
      setCartItems([])
    } finally {
      setLoading(false)
    }
  }, [user])

  // 로컬스토리지 장바구니를 Supabase로 동기화
  const syncLocalCartToSupabase = useCallback(async () => {
    if (!user) return

    const localItems = loadLocalCart()
    if (localItems.length === 0) {
      await fetchCart()
      return
    }

    try {
      for (const localItem of localItems) {
        // 기존 장바구니 항목 확인
        const { data: existingItem, error: checkError } = await supabase
          .from('cart')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', localItem.productId)
          .maybeSingle()

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116은 "결과가 없음" 에러이므로 무시
          throw checkError
        }

        if (existingItem) {
          // 이미 있으면 수량 업데이트
          const { error: updateError } = await supabase
            .from('cart')
            .update({ quantity: existingItem.quantity + localItem.quantity })
            .eq('id', existingItem.id)

          if (updateError) throw updateError
        } else {
          // 없으면 새로 추가
          const { error: insertError } = await supabase
            .from('cart')
            .insert({
              user_id: user.id,
              product_id: localItem.productId,
              quantity: localItem.quantity,
            })

          if (insertError) throw insertError
        }
      }

      // 동기화 완료 후 로컬스토리지 비우기
      localStorage.removeItem(CART_STORAGE_KEY)
      await fetchCart()
    } catch (error) {
      console.error('로컬스토리지 동기화 오류:', error)
      // 동기화 실패해도 장바구니는 로드
      await fetchCart()
    }
  }, [user, fetchCart])

  // 장바구니에 추가
  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user) {
      // 비로그인 사용자는 로컬스토리지에 저장
      const localItems = loadLocalCart()
      const existingIndex = localItems.findIndex(
        (item) => item.productId === productId
      )

      if (existingIndex >= 0) {
        localItems[existingIndex].quantity += quantity
      } else {
        localItems.push({ productId, quantity })
      }

      saveLocalCart(localItems)
      await fetchCart()
      return
    }

    try {
      // 기존 장바구니 항목 확인
      const { data: existingItem, error: checkError } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116은 "결과가 없음" 에러이므로 무시
        throw checkError
      }

      if (existingItem) {
        // 이미 있으면 수량 증가
        const { error } = await supabase
          .from('cart')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id)

        if (error) throw error
      } else {
        // 없으면 새로 추가
        const { error } = await supabase
          .from('cart')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity,
          })

        if (error) throw error
      }

      await fetchCart()
    } catch (error) {
      console.error('장바구니 추가 오류:', error)
      throw error
    }
  }

  // 장바구니에서 삭제
  const removeFromCart = async (cartItemId: string) => {
    if (!user) {
      // 비로그인 사용자는 로컬스토리지에서 삭제
      const localItems = loadLocalCart()
      const productId = cartItemId.replace('local-', '')
      const filtered = localItems.filter(
        (item) => item.productId !== productId
      )
      saveLocalCart(filtered)
      await fetchCart()
      return
    }

    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('id', cartItemId)

      if (error) throw error
      await fetchCart()
    } catch (error) {
      console.error('장바구니 삭제 오류:', error)
      throw error
    }
  }

  // 수량 변경
  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(cartItemId)
      return
    }

    if (!user) {
      // 비로그인 사용자는 로컬스토리지 업데이트
      const localItems = loadLocalCart()
      const productId = cartItemId.replace('local-', '')
      const item = localItems.find((item) => item.productId === productId)
      if (item) {
        item.quantity = quantity
        saveLocalCart(localItems)
        await fetchCart()
      }
      return
    }

    try {
      const { error } = await supabase
        .from('cart')
        .update({ quantity })
        .eq('id', cartItemId)

      if (error) throw error
      await fetchCart()
    } catch (error) {
      console.error('수량 변경 오류:', error)
      throw error
    }
  }

  // 장바구니 비우기
  const clearCart = async () => {
    if (!user) {
      localStorage.removeItem(CART_STORAGE_KEY)
      setCartItems([])
      return
    }

    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error
      await fetchCart()
    } catch (error) {
      console.error('장바구니 비우기 오류:', error)
      throw error
    }
  }

  // 장바구니 새로고침
  const refreshCart = async () => {
    await fetchCart()
  }

  // 초기 로드 및 로그인 시 동기화
  useEffect(() => {
    const loadCartData = async () => {
      if (user) {
        // 로그인 시 로컬스토리지와 Supabase 동기화
        await syncLocalCartToSupabase()
      } else {
        await fetchCart()
      }
    }

    loadCartData()
  }, [user, fetchCart, syncLocalCartToSupabase])

  // 장바구니 개수 계산
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  // 총 금액 계산
  const totalAmount = cartItems.reduce((sum, item) => {
    const product = item.product
    if (!product) return sum
    return sum + product.price * item.quantity
  }, 0)

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        totalAmount,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

