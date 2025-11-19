import { useState } from "react"
import { Link } from "react-router-dom"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { useToast } from "@/context/toast-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export default function SignUp() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<{
    email?: string
    name?: string
    password?: string
    confirmPassword?: string
  }>({})

  // 이메일 형식 검증
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 비밀번호 검증 (최소 8자, 대소문자 + 숫자 포함)
  const validatePassword = (password: string): boolean => {
    if (password.length < 8) return false
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    return hasUpperCase && hasLowerCase && hasNumber
  }

  // 실시간 유효성 검증
  const handleChange = (field: string, value: string) => {
    // 상태 업데이트
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }
      
      // 업데이트된 값으로 실시간 검증
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors }

        if (field === "email") {
          if (value && !validateEmail(value)) {
            newErrors.email = "올바른 이메일 형식이 아닙니다"
          } else {
            delete newErrors.email
          }
        }

        if (field === "name") {
          if (value && value.trim().length < 2) {
            newErrors.name = "이름은 최소 2자 이상이어야 합니다"
          } else {
            delete newErrors.name
          }
        }

        if (field === "password") {
          if (value && !validatePassword(value)) {
            newErrors.password =
              "비밀번호는 최소 8자 이상, 대소문자와 숫자를 포함해야 합니다"
          } else {
            delete newErrors.password
          }
          // 비밀번호 확인도 다시 검증 (업데이트된 password 값 사용)
          if (updated.confirmPassword && value !== updated.confirmPassword) {
            newErrors.confirmPassword = "비밀번호가 일치하지 않습니다"
          } else if (updated.confirmPassword && value === updated.confirmPassword) {
            delete newErrors.confirmPassword
          }
        }

        if (field === "confirmPassword") {
          // 업데이트된 password 값과 비교
          if (value && value !== updated.password) {
            newErrors.confirmPassword = "비밀번호가 일치하지 않습니다"
          } else {
            delete newErrors.confirmPassword
          }
        }

        return newErrors
      })
      
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 최종 검증
    const finalErrors: typeof errors = {}

    // 이메일 검증
    if (!formData.email || formData.email.trim() === "") {
      finalErrors.email = "이메일을 입력해주세요"
    } else if (!validateEmail(formData.email)) {
      finalErrors.email = "올바른 이메일 형식이 아닙니다"
    }

    // 이름 검증
    if (!formData.name || formData.name.trim() === "") {
      finalErrors.name = "이름을 입력해주세요"
    } else if (formData.name.trim().length < 2) {
      finalErrors.name = "이름은 최소 2자 이상이어야 합니다"
    }

    // 비밀번호 검증
    if (!formData.password || formData.password.trim() === "") {
      finalErrors.password = "비밀번호를 입력해주세요"
    } else if (!validatePassword(formData.password)) {
      finalErrors.password =
        "비밀번호는 최소 8자 이상, 대소문자와 숫자를 포함해야 합니다"
    }

    // 비밀번호 확인 검증
    if (!formData.confirmPassword || formData.confirmPassword.trim() === "") {
      finalErrors.confirmPassword = "비밀번호 확인을 입력해주세요"
    } else if (formData.password !== formData.confirmPassword) {
      finalErrors.confirmPassword = "비밀번호가 일치하지 않습니다"
    }

    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors)
      // 구체적인 에러 메시지 표시 (첫 번째 에러만 표시)
      const errorMessages = Object.values(finalErrors).filter(Boolean)
      const firstError = errorMessages[0] || "모든 필드를 올바르게 입력해주세요"
      
      // 디버깅을 위한 콘솔 로그 (개발 환경에서만)
      if (import.meta.env.DEV) {
        console.log("검증 실패:", {
          errors: finalErrors,
          formData: {
            email: formData.email,
            name: formData.name,
            passwordLength: formData.password?.length,
            confirmPasswordLength: formData.confirmPassword?.length,
            passwordsMatch: formData.password === formData.confirmPassword,
          },
        })
      }
      
      toast({
        title: "입력 오류",
        description: firstError,
        variant: "destructive",
      })
      return
    }

    // Supabase 설정 확인
    if (!isSupabaseConfigured) {
      toast({
        title: "설정 오류",
        description: "Supabase 설정이 완료되지 않았습니다. 환경 변수를 확인해주세요.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Supabase 회원가입
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error("회원가입에 실패했습니다")
      }

      // Profiles 테이블에 유저 정보 입력
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          email: formData.email,
          name: formData.name,
        })

      if (profileError) {
        console.error("Profile 생성 오류:", profileError)
        // Profile 생성 실패해도 회원가입은 성공한 상태이므로 경고만 표시
        toast({
          title: "경고",
          description: "프로필 생성 중 오류가 발생했습니다. 관리자에게 문의해주세요.",
          variant: "destructive",
        })
      }

      toast({
        title: "회원가입 성공",
        description: "회원가입이 완료되었습니다. 이메일 인증이 필요합니다.",
        variant: "success",
      })

      // 폼 초기화
      setFormData({
        email: "",
        name: "",
        password: "",
        confirmPassword: "",
      })
      setErrors({})
    } catch (error: any) {
      console.error("회원가입 오류:", error)
      
      // 네트워크 오류 처리
      let errorMessage = "회원가입 중 오류가 발생했습니다"
      
      if (error.message?.includes("Failed to fetch") || error.message?.includes("ERR_NAME_NOT_RESOLVED")) {
        errorMessage = "네트워크 연결을 확인해주세요. 인터넷 연결 상태를 확인하거나 잠시 후 다시 시도해주세요."
      } else if (error.message?.includes("fetch")) {
        errorMessage = "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요."
      } else if (error.message) {
        errorMessage = error.message
      } else if (error.error_description) {
        errorMessage = error.error_description
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      toast({
        title: "회원가입 실패",
        description: errorMessage,
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
          <CardTitle className="text-2xl font-bold text-center">회원가입</CardTitle>
          <CardDescription className="text-center">
            계정을 생성하여 시작하세요
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
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="최소 8자, 대소문자+숫자"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                className={errors.confirmPassword ? "border-destructive" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
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
                  처리 중...
                </>
              ) : (
                "회원가입"
              )}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                이미 계정이 있으신가요?{" "}
              </span>
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                로그인
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

