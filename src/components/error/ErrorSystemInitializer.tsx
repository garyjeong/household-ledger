'use client'

import { useEffect } from 'react'
import { globalErrorHandler } from '@/lib/error-handler'

/**
 * 전역 에러 처리 시스템 초기화 컴포넌트
 * 브라우저 환경에서 전역 에러 리스너를 설정
 */
export function ErrorSystemInitializer() {
  useEffect(() => {
    // 전역 에러 리스너 설정
    globalErrorHandler.setupGlobalListeners()

    // 개발 환경에서 에러 처리 시스템 초기화 로그
    if (process.env.NODE_ENV === 'development') {
      console.log('🛡️ Error handling system initialized')
    }

    // cleanup 함수 반환 (필요한 경우)
    return () => {
      // 현재는 제거할 리스너가 없음
      // 필요시 addEventListener의 반대인 removeEventListener 호출
    }
  }, [])

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null
}
