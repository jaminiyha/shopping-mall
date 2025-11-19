import { useState, useRef } from "react"
import { Link } from "react-router-dom"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Navigation, Pagination, EffectFade } from "swiper/modules"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import type { Swiper as SwiperType } from "swiper"

import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import "swiper/css/effect-fade"

const slides = [
  {
    id: 1,
    title: "겨울 신상 최대 80% 할인",
    buttonText: "쇼핑하기",
    buttonLink: "/products",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop",
  },
  {
    id: 2,
    title: "무료 배송 이벤트",
    buttonText: "자세히 보기",
    buttonLink: "/shipping",
    image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1920&h=1080&fit=crop",
  },
  {
    id: 3,
    title: "회원가입 시 10% 쿠폰",
    buttonText: "가입하기",
    buttonLink: "/signup",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&h=1080&fit=crop",
  },
]

export default function HeroSection() {
  const [isPlaying, setIsPlaying] = useState(true)
  const swiperRef = useRef<SwiperType | null>(null)

  const handlePlayPause = () => {
    if (swiperRef.current) {
      if (isPlaying) {
        swiperRef.current.autoplay?.stop()
        setIsPlaying(false)
      } else {
        swiperRef.current.autoplay?.start()
        setIsPlaying(true)
      }
    }
  }

  return (
    <div className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden">
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
        modules={[Autoplay, Navigation, Pagination, EffectFade]}
        effect="fade"
        fadeEffect={{
          crossFade: true,
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        navigation={{
          nextEl: ".swiper-button-next-custom",
          prevEl: ".swiper-button-prev-custom",
        }}
        pagination={{
          clickable: true,
          el: ".swiper-pagination-custom",
          bulletClass: "swiper-pagination-bullet-custom",
          bulletActiveClass: "swiper-pagination-bullet-active-custom",
        }}
        loop={true}
        className="w-full h-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id} className="relative">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${slide.image})`,
              }}
            >
              <div className="absolute inset-0 bg-black/40" />
            </div>
            <div className="relative z-10 h-full flex items-center justify-center">
              <div className="text-center px-4 max-w-4xl mx-auto">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
                  {slide.title}
                </h2>
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-white text-gray-900 hover:bg-gray-100 font-semibold"
                  asChild
                >
                  <Link to={slide.buttonLink}>{slide.buttonText}</Link>
                </Button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* 좌우 화살표 네비게이션 */}
      <button
        className="swiper-button-prev-custom absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-900 rounded-full p-3 shadow-lg transition-all"
        aria-label="이전 슬라이드"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        className="swiper-button-next-custom absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-900 rounded-full p-3 shadow-lg transition-all"
        aria-label="다음 슬라이드"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* 일시정지/재생 버튼 */}
      <button
        onClick={handlePlayPause}
        className="absolute top-4 right-4 z-20 bg-white/80 hover:bg-white text-gray-900 rounded-full p-3 shadow-lg transition-all"
        aria-label={isPlaying ? "일시정지" : "재생"}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </button>

      {/* 하단 인디케이터 */}
      <div className="swiper-pagination-custom absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2" />
    </div>
  )
}

