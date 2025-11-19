import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jwhwuljovrcvvukkolmd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// 환경 변수 확인
if (!supabaseUrl || supabaseUrl === '') {
  console.error('❌ VITE_SUPABASE_URL이 설정되지 않았습니다.')
}

if (!supabaseAnonKey || supabaseAnonKey === '') {
  console.warn('⚠️ VITE_SUPABASE_ANON_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.')
}

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-client-info': 'shopping-mall',
    },
  },
})

// 환경 변수 설정 확인
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '')

