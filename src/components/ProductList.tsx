import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/types/product"
import ProductCard from "./ProductCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (selectedCategory === null) {
      setFilteredProducts(products)
    } else {
      setFilteredProducts(
        products.filter((product) => product.category === selectedCategory)
      )
    }
  }, [selectedCategory, products])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      if (data) {
        setProducts(data)
        setFilteredProducts(data)
        // 카테고리 추출
        const uniqueCategories = Array.from(
          new Set(data.map((p) => p.category).filter(Boolean))
        ) as string[]
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error("상품 목록 로드 오류:", error)
    } finally {
      setLoading(false)
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-6">상품 목록</h2>
        
        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            size="sm"
          >
            전체
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              size="sm"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* 결과 개수 표시 */}
        <div className="mb-4">
          <Badge variant="secondary">
            총 {filteredProducts.length}개의 상품
          </Badge>
        </div>
      </div>

      {/* 상품 그리드 */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {selectedCategory
              ? "해당 카테고리의 상품이 없습니다."
              : "등록된 상품이 없습니다."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

