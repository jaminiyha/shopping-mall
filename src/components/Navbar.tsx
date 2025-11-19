import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Package, LogOut, UserCircle } from "lucide-react"

export default function Navbar() {
  const { user, loading, signOut } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate("/")
  }

  const getUserInitials = (email: string | undefined) => {
    if (!email) return "U"
    return email.charAt(0).toUpperCase()
  }

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* 좌측: 로고 및 메뉴 */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold">쇼핑몰</span>
            </Link>
            <Link to="/products" className="text-sm font-medium hover:text-primary transition-colors">
              상품 목록
            </Link>
          </div>

          {/* 우측: 인증 상태에 따른 UI */}
          <div className="flex items-center space-x-4">
            {/* 장바구니 아이콘 (로그인 여부와 관계없이 표시) */}
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link to="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {loading ? (
              // 로딩 중
              <div className="h-10 w-20 animate-pulse bg-muted rounded" />
            ) : !user ? (
              // 로그인 전
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">로그인</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">회원가입</Link>
                </Button>
              </div>
            ) : (
              // 로그인 후
              <div className="flex items-center space-x-4">

                {/* 프로필 드롭다운 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                        <AvatarFallback>
                          {getUserInitials(user.email)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center cursor-pointer">
                        <UserCircle className="mr-2 h-4 w-4" />
                        내정보
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="flex items-center cursor-pointer">
                        <Package className="mr-2 h-4 w-4" />
                        주문 내역
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/cart" className="flex items-center cursor-pointer">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        장바구니
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

