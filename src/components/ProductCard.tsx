import { Link } from "react-router-dom"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"
import type { Product } from "@/types/product"
import { useCart } from "@/context/CartContext"
import { useToast } from "@/context/toast-context"

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()
  const { showToast } = useToast()

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      await addToCart(product.id, 1)
      showToast("장바구니에 추가되었습니다.", "success")
    } catch (error) {
      console.error("장바구니 추가 오류:", error)
      showToast("장바구니 추가에 실패했습니다.", "error")
    }
  }

  const isOutOfStock = product.stock === 0

  return (
    <Link to={`/products/${product.id}`} className="block h-full">
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
        <CardHeader className="p-0">
          <div className="relative w-full aspect-square overflow-hidden rounded-t-lg bg-muted">
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
                <Badge variant="destructive" className="text-lg px-4 py-2">
                  품절
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            )}
            {product.category && (
              <Badge variant="outline" className="text-xs">
                {product.category}
              </Badge>
            )}
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {product.price.toLocaleString()}원
              </span>
              <span className="text-sm text-muted-foreground">
                재고: {product.stock}개
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-full"
            variant={isOutOfStock ? "secondary" : "default"}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isOutOfStock ? "품절" : "장바구니 담기"}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}

