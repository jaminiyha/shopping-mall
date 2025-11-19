import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/context/toast-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"

export default function Login() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
  }>({})

  // 이메일 형식 검증
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // 실시간 검증
    const newErrors = { ...errors }

    if (field === "email" && typeof value === "string") {
      if (value && !validateEmail(value)) {
        newErrors.email = "올바른 이메일 형식이 아닙니다"
      } else {
        delete newErrors.email
      }
    }

    if (field === "password" && typeof value === "string") {
      if (value && value.length < 6) {
        newErrors.password = "비밀번호는 최소 6자 이상이어야 합니다"
      } else {
        delete newErrors.password
      }
    }

    setErrors(newErrors)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 최종 검증
    const finalErrors: typeof errors = {}

    if (!formData.email || !validateEmail(formData.email)) {
      finalErrors.email = "올바른 이메일 형식이 아닙니다"
    }

    if (!formData.password || formData.password.length < 6) {
      finalErrors.password = "비밀번호를 입력해주세요"
    }

    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors)
      toast({
        title: "입력 오류",
        description: "모든 필드를 올바르게 입력해주세요",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        throw error
      }

      if (!data.user) {
        throw new Error("로그인에 실패했습니다")
      }

      toast({
        title: "로그인 성공",
        description: "로그인되었습니다.",
        variant: "success",
      })

      // 이전 페이지 또는 홈으로 리다이렉트
      const from = (location.state as { from?: string })?.from || "/"
      navigate(from, { replace: true })
    } catch (error: any) {
      console.error("로그인 오류:", error)
      toast({
        title: "로그인 실패",
        description: error.message || "이메일 또는 비밀번호가 올바르지 않습니다",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">로그인</CardTitle>
          <CardDescription className="text-center">
            계정에 로그인하세요
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={errors.email ? "border-destructive" : ""}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className={errors.password ? "border-destructive" : ""}
                disabled={loading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={formData.rememberMe}
                onChange={(e) => handleChange("rememberMe", e.target.checked)}
                disabled={loading}
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-normal cursor-pointer"
              >
                로그인 상태 유지
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                "로그인"
              )}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                계정이 없으신가요?{" "}
              </span>
              <Link
                to="/signup"
                className="text-primary hover:underline font-medium"
              >
                회원가입
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

