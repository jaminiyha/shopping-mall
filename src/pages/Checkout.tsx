import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/toast-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CreditCard, Package } from 'lucide-react'

// Toss Payments 위젯 타입 정의
declare global {
  interface Window {
    PaymentWidget: any
    PaymentWidgetInstance: any
  }
}

interface OrderFormData {
  // 주문자 정보
  ordererName: string
  ordererEmail: string
  ordererPhone: string
  
  // 배송지 정보
  recipientName: string
  recipientPhone: string
  address: string
  addressDetail: string
  postalCode: string
  deliveryMemo: string
}

export default function Checkout() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { cartItems, totalAmount } = useCart()
  
  const [formData, setFormData] = useState<OrderFormData>({
    ordererName: '',
    ordererEmail: user?.email || '',
    ordererPhone: '',
    recipientName: '',
    recipientPhone: '',
    address: '',
    addressDetail: '',
    postalCode: '',
    deliveryMemo: '',
  })
  
  const [isPaymentReady, setIsPaymentReady] = useState(false)
  const paymentWidgetRef = useRef<any>(null)

  // Toss Payments 위젯 초기화
  useEffect(() => {
    if (!user) {
      showToast('로그인이 필요합니다.', 'error')
      navigate('/login')
      return
    }

    if (cartItems.length === 0) {
      showToast('장바구니가 비어있습니다.', 'error')
      navigate('/cart')
      return
    }

    // 이미 스크립트가 로드되어 있는지 확인
    if (window.PaymentWidget) {
      initializePaymentWidget()
      return
    }

    // Toss Payments 스크립트 로드
    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v1/payment-widget'
    script.async = true
    script.onload = () => {
      initializePaymentWidget()
    }
    document.body.appendChild(script)

    return () => {
      // 정리
      if (paymentWidgetRef.current) {
        try {
          paymentWidgetRef.current.destroy()
        } catch (error) {
          console.error('위젯 정리 오류:', error)
        }
      }
    }
  }, [user, cartItems.length, totalAmount])

  const initializePaymentWidget = async () => {
    if (!user || cartItems.length === 0) return
    
    try {
      // 테스트 키 사용
      const clientKey = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq'
      const customerKey = user.id

      // 기존 위젯이 있으면 정리
      if (paymentWidgetRef.current) {
        try {
          paymentWidgetRef.current.destroy()
        } catch (error) {
          console.error('기존 위젯 정리 오류:', error)
        }
      }

      // PaymentWidget 인스턴스 생성
      const paymentWidget = window.PaymentWidget(clientKey, customerKey)
      paymentWidgetRef.current = paymentWidget

      // 결제 금액 설정
      await paymentWidget.renderPaymentMethods(
        '#payment-method',
        { value: totalAmount },
        { variantKey: 'DEFAULT' }
      )

      // 약관 동의 위젯 렌더링
      await paymentWidget.renderAgreement('#agreement', { variantKey: 'AGREEMENT' })

      setIsPaymentReady(true)
    } catch (error) {
      console.error('결제 위젯 초기화 오류:', error)
      showToast('결제 위젯 초기화에 실패했습니다.', 'error')
    }
  }

  const handleInputChange = (field: keyof OrderFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = (): boolean => {
    const requiredFields: (keyof OrderFormData)[] = [
      'ordererName',
      'ordererEmail',
      'ordererPhone',
      'recipientName',
      'recipientPhone',
      'address',
      'addressDetail',
      'postalCode',
    ]

    for (const field of requiredFields) {
      if (!formData[field].trim()) {
        showToast(`${getFieldLabel(field)}을(를) 입력해주세요.`, 'error')
        return false
      }
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.ordererEmail)) {
      showToast('올바른 이메일 형식을 입력해주세요.', 'error')
      return false
    }

    // 전화번호 형식 검증 (숫자만)
    const phoneRegex = /^[0-9-]+$/
    if (!phoneRegex.test(formData.ordererPhone) || !phoneRegex.test(formData.recipientPhone)) {
      showToast('올바른 전화번호 형식을 입력해주세요.', 'error')
      return false
    }

    return true
  }

  const getFieldLabel = (field: keyof OrderFormData): string => {
    const labels: Record<keyof OrderFormData, string> = {
      ordererName: '주문자 이름',
      ordererEmail: '주문자 이메일',
      ordererPhone: '주문자 전화번호',
      recipientName: '수령인 이름',
      recipientPhone: '수령인 전화번호',
      address: '주소',
      addressDetail: '상세 주소',
      postalCode: '우편번호',
      deliveryMemo: '배송 메모',
    }
    return labels[field]
  }

  const handlePayment = async () => {
    if (!validateForm()) {
      return
    }

    if (!isPaymentReady || !paymentWidgetRef.current) {
      showToast('결제 위젯이 준비되지 않았습니다.', 'error')
      return
    }

    try {
      // 결제 요청
      await paymentWidgetRef.current.requestPayment({
        orderId: `order-${Date.now()}`,
        orderName: cartItems.length === 1 
          ? cartItems[0].product?.name || '상품'
          : `${cartItems[0].product?.name || '상품'} 외 ${cartItems.length - 1}개`,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
        customerEmail: formData.ordererEmail,
        customerName: formData.ordererName,
        customerMobilePhone: formData.ordererPhone,
      })
    } catch (error: any) {
      console.error('결제 요청 오류:', error)
      if (error.message) {
        showToast(error.message, 'error')
      } else {
        showToast('결제 요청에 실패했습니다.', 'error')
      }
    }
  }

  if (cartItems.length === 0) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/cart')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            장바구니로 돌아가기
          </Button>
          <h1 className="text-3xl font-bold">결제하기</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 주문 정보 입력 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 주문자 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  주문자 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ordererName">이름 *</Label>
                    <Input
                      id="ordererName"
                      value={formData.ordererName}
                      onChange={(e) => handleInputChange('ordererName', e.target.value)}
                      placeholder="주문자 이름을 입력하세요"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ordererEmail">이메일 *</Label>
                    <Input
                      id="ordererEmail"
                      type="email"
                      value={formData.ordererEmail}
                      onChange={(e) => handleInputChange('ordererEmail', e.target.value)}
                      placeholder="example@email.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="ordererPhone">전화번호 *</Label>
                  <Input
                    id="ordererPhone"
                    value={formData.ordererPhone}
                    onChange={(e) => handleInputChange('ordererPhone', e.target.value)}
                    placeholder="010-1234-5678"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 배송지 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  배송지 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recipientName">수령인 이름 *</Label>
                    <Input
                      id="recipientName"
                      value={formData.recipientName}
                      onChange={(e) => handleInputChange('recipientName', e.target.value)}
                      placeholder="수령인 이름을 입력하세요"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipientPhone">수령인 전화번호 *</Label>
                    <Input
                      id="recipientPhone"
                      value={formData.recipientPhone}
                      onChange={(e) => handleInputChange('recipientPhone', e.target.value)}
                      placeholder="010-1234-5678"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <Label htmlFor="postalCode">우편번호 *</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      placeholder="12345"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">주소 *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="기본 주소를 입력하세요"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="addressDetail">상세 주소 *</Label>
                  <Input
                    id="addressDetail"
                    value={formData.addressDetail}
                    onChange={(e) => handleInputChange('addressDetail', e.target.value)}
                    placeholder="상세 주소를 입력하세요"
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryMemo">배송 메모 (선택)</Label>
                  <Input
                    id="deliveryMemo"
                    value={formData.deliveryMemo}
                    onChange={(e) => handleInputChange('deliveryMemo', e.target.value)}
                    placeholder="배송 시 요청사항을 입력하세요"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 결제 수단 선택 */}
            <Card>
              <CardHeader>
                <CardTitle>결제 수단</CardTitle>
              </CardHeader>
              <CardContent>
                <div id="payment-method" className="min-h-[200px]">
                  {!isPaymentReady && (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      결제 위젯을 불러오는 중...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 약관 동의 */}
            <Card>
              <CardHeader>
                <CardTitle>약관 동의</CardTitle>
              </CardHeader>
              <CardContent>
                <div id="agreement" className="min-h-[100px]">
                  {!isPaymentReady && (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      약관 위젯을 불러오는 중...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 주문 요약 */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>주문 요약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">상품 개수</span>
                    <span className="font-medium">
                      {cartItems.reduce((sum, item) => sum + item.quantity, 0)}개
                    </span>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {cartItems.map((item) => {
                      const product = item.product
                      if (!product) return null
                      return (
                        <div key={item.id} className="text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground truncate flex-1">
                              {product.name}
                            </span>
                            <span className="ml-2">
                              {item.quantity}개
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(product.price * item.quantity).toLocaleString()}원
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>총 결제 금액</span>
                      <span className="text-primary">
                        {totalAmount.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handlePayment}
                  size="lg"
                  className="w-full"
                  disabled={!isPaymentReady}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  결제 하기
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

