import { useNavigate } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/toast-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react'

export default function Cart() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const {
    cartItems,
    cartCount,
    totalAmount,
    loading,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart()

  const handleQuantityChange = async (
    cartItemId: string,
    newQuantity: number
  ) => {
    if (newQuantity < 1) {
      await removeFromCart(cartItemId)
      showToast('상품이 장바구니에서 제거되었습니다.', 'success')
      return
    }

    try {
      await updateQuantity(cartItemId, newQuantity)
      showToast('수량이 변경되었습니다.', 'success')
    } catch (error) {
      showToast('수량 변경에 실패했습니다.', 'error')
    }
  }

  const handleRemove = async (cartItemId: string) => {
    try {
      await removeFromCart(cartItemId)
      showToast('상품이 장바구니에서 제거되었습니다.', 'success')
    } catch (error) {
      showToast('상품 제거에 실패했습니다.', 'error')
    }
  }

  const handleClearCart = async () => {
    if (!confirm('장바구니를 비우시겠습니까?')) return

    try {
      await clearCart()
      showToast('장바구니가 비워졌습니다.', 'success')
    } catch (error) {
      showToast('장바구니 비우기에 실패했습니다.', 'error')
    }
  }

  const handleCheckout = () => {
    if (!user) {
      showToast('로그인이 필요합니다.', 'error')
      navigate('/login')
      return
    }

    if (cartItems.length === 0) {
      showToast('장바구니가 비어있습니다.', 'error')
      return
    }

    navigate('/checkout')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">장바구니</h1>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground mb-4">
                장바구니가 비어있습니다.
              </p>
              <Button onClick={() => navigate('/products')}>
                상품 둘러보기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">장바구니</h1>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              총 {cartCount}개
            </Badge>
            <Button
              variant="outline"
              onClick={handleClearCart}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              전체 삭제
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 장바구니 목록 */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const product = item.product
              if (!product) return null

              const itemTotal = product.price * item.quantity
              const isOutOfStock = product.stock === 0

              return (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* 상품 이미지 */}
                      <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            이미지 없음
                          </div>
                        )}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge variant="destructive" className="text-xs">
                              품절
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* 상품 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1 truncate">
                              {product.name}
                            </h3>
                            {product.category && (
                              <Badge variant="outline" className="text-xs mb-2">
                                {product.category}
                              </Badge>
                            )}
                            <p className="text-lg font-bold text-primary">
                              {product.price.toLocaleString()}원
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              합계: {itemTotal.toLocaleString()}원
                            </p>
                          </div>

                          {/* 삭제 버튼 */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* 수량 조절 */}
                        <div className="flex items-center gap-3 mt-4">
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-none"
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-none"
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity + 1)
                              }
                              disabled={
                                isOutOfStock || item.quantity >= product.stock
                              }
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {product.stock > 0 && (
                            <span className="text-sm text-muted-foreground">
                              재고: {product.stock}개
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* 주문 요약 */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>주문 요약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">상품 개수</span>
                    <span className="font-medium">{cartCount}개</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">상품 금액</span>
                    <span className="font-medium">
                      {totalAmount.toLocaleString()}원
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>총 금액</span>
                      <span className="text-primary">
                        {totalAmount.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  size="lg"
                  className="w-full"
                  disabled={cartItems.some((item) => item.product?.stock === 0)}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  결제하기
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate('/products')}
                  className="w-full"
                >
                  쇼핑 계속하기
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

