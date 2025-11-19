import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { useCart } from "@/context/CartContext"
import { useToast } from "@/context/toast-context"
import type { Product } from "@/types/product"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, ArrowLeft } from "lucide-react"

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchProduct()
    }
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error
      setProduct(data)
    } catch (error) {
      console.error("상품 상세 정보 로드 오류:", error)
      showToast("상품 정보를 불러올 수 없습니다.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return

    try {
      await addToCart(product.id, 1)
      showToast("장바구니에 추가되었습니다.", "success")
    } catch (error) {
      console.error("장바구니 추가 오류:", error)
      showToast("장바구니 추가에 실패했습니다.", "error")
    }
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

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">상품을 찾을 수 없습니다.</p>
          <Button onClick={() => navigate("/products")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            상품 목록으로
          </Button>
        </div>
      </div>
    )
  }

  const isOutOfStock = product.stock === 0

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/products")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        목록으로 돌아가기
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 상품 이미지 */}
        <Card className="overflow-hidden">
          <div className="relative w-full aspect-square bg-muted">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <span>이미지 없음</span>
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="destructive" className="text-xl px-6 py-3">
                  품절
                </Badge>
              </div>
            )}
          </div>
        </Card>

        {/* 상품 정보 */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              {product.category && (
                <Badge variant="outline" className="text-sm">
                  {product.category}
                </Badge>
              )}
              <Badge
                variant={isOutOfStock ? "destructive" : "secondary"}
                className="text-sm"
              >
                {isOutOfStock ? "품절" : `재고: ${product.stock}개`}
              </Badge>
            </div>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <div className="text-3xl font-bold text-primary mb-6">
              {product.price.toLocaleString()}원
            </div>
          </div>

          {product.description && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-3">상품 설명</h2>
                <p className="text-muted-foreground whitespace-pre-line">
                  {product.description}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              size="lg"
              className="w-full"
              variant={isOutOfStock ? "secondary" : "default"}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {isOutOfStock ? "품절" : "장바구니 담기"}
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">상품 정보</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">상품명</dt>
                  <dd className="font-medium">{product.name}</dd>
                </div>
                {product.category && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">카테고리</dt>
                    <dd className="font-medium">{product.category}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">가격</dt>
                  <dd className="font-medium">{product.price.toLocaleString()}원</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">재고</dt>
                  <dd className="font-medium">{product.stock}개</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

