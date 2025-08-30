'use client'

import { useEffect } from 'react'
import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals'


interface WebVitalsData {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  id: string
  navigationType: string
  delta: number
}

// Web Vitals 임계값 정의 (Google 권장 기준)
const VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  // FID는 web-vitals v5에서 제거되어 INP로 대체됨
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint
}

// 등급 계산 함수
function calculateRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = VITALS_THRESHOLDS[name as keyof typeof VITALS_THRESHOLDS]
  if (!thresholds) return 'good'

  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.poor) return 'needs-improvement'
  return 'poor'
}

// 성능 데이터를 콘솔에 로그
function logPerformanceData(metric: Metric) {
  const webVitalsData: WebVitalsData = {
    name: metric.name,
    value: metric.value,
    rating: calculateRating(metric.name, metric.value),
    id: metric.id,
    navigationType: metric.navigationType || 'unknown',
    delta: metric.delta,
  }

  // 콘솔에 성능 메트릭 로그
  console.info(`📊 Performance [${metric.name}]:`, webVitalsData)

  // 성능 임계값 초과시 경고 로그
  if (webVitalsData.rating === 'poor') {
    console.warn(`⚠️ Poor Web Vital: ${metric.name}`, webVitalsData)
  }
}

// 로컬 스토리지에 성능 데이터 저장 (디버깅용)
function saveToLocalStorage(metric: Metric) {
  if (typeof window === 'undefined') return

  try {
    const webVitalsData: WebVitalsData = {
      name: metric.name,
      value: metric.value,
      rating: calculateRating(metric.name, metric.value),
      id: metric.id,
      navigationType: metric.navigationType || 'unknown',
      delta: metric.delta,
    }

    const existing = JSON.parse(localStorage.getItem('web-vitals') || '[]')
    const updated = [
      ...existing.filter((item: WebVitalsData) => item.name !== metric.name),
      { ...webVitalsData, timestamp: Date.now() },
    ]

    // 최대 50개 항목만 유지
    const limited = updated.slice(-50)
    localStorage.setItem('web-vitals', JSON.stringify(limited))
  } catch (error) {
    console.warn('Failed to save Web Vitals to localStorage:', error)
  }
}

// Google Analytics로 전송 (선택사항)
function sendToAnalytics(metric: Metric) {
  // @ts-expect-error - gtag is loaded by Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    // @ts-expect-error - gtag is loaded by Google Analytics
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    })
  }
}

// 통합 리포팅 함수
function reportWebVital(metric: Metric) {
  console.info(`📊 Web Vital [${metric.name}]:`, {
    value: `${metric.value}${metric.name === 'CLS' ? '' : 'ms'}`,
    rating: calculateRating(metric.name, metric.value),
    id: metric.id,
    navigationType: metric.navigationType,
    delta: metric.delta,
  })

  // 다양한 목적지로 데이터 전송
  logPerformanceData(metric)
  saveToLocalStorage(metric)
  sendToAnalytics(metric)
}

// Web Vitals 성능 요약 표시 (개발 모드)
function showPerformanceSummary() {
  if (process.env.NODE_ENV !== 'development') return

  setTimeout(() => {
    const vitals = JSON.parse(localStorage.getItem('web-vitals') || '[]')
    if (vitals.length > 0) {
      console.group('📊 Web Vitals Summary')
      vitals.forEach((vital: WebVitalsData & { timestamp: number }) => {
        const emoji =
          vital.rating === 'good' ? '✅' : vital.rating === 'needs-improvement' ? '⚠️' : '❌'
        console.log(
          `${emoji} ${vital.name}: ${vital.value}${vital.name === 'CLS' ? '' : 'ms'} (${vital.rating})`
        )
      })
      console.groupEnd()
    }
  }, 3000) // 3초 후 요약 표시
}

export function WebVitalsReporter() {
  useEffect(() => {
    // Web Vitals 메트릭 구독
    onCLS(reportWebVital) // 누적 레이아웃 이동
    onFCP(reportWebVital) // 첫 콘텐츠풀 페인트
    // onFID는 web-vitals v5에서 제거되어 INP로 대체됨
    onLCP(reportWebVital) // 최대 콘텐츠풀 페인트
    onTTFB(reportWebVital) // 첫 바이트까지의 시간
    onINP(reportWebVital) // 다음 페인트까지의 상호작용

    // 개발 모드에서 성능 요약 표시
    if (process.env.NODE_ENV === 'development') {
      showPerformanceSummary()
    }
  }, [])

  // 컴포넌트는 시각적 요소 없음 (모니터링만)
  return null
}

// 성능 데이터 접근 헬퍼 함수들
export const webVitalsUtils = {
  // 저장된 성능 데이터 조회
  getStoredVitals: (): WebVitalsData[] => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem('web-vitals') || '[]')
    } catch {
      return []
    }
  },

  // 성능 데이터 초기화
  clearStoredVitals: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('web-vitals')
    }
  },

  // 평균 성능 계산
  getAverageVitals: (): Record<string, number> => {
    const vitals = webVitalsUtils.getStoredVitals()
    const grouped = vitals.reduce(
      (acc, vital) => {
        if (!acc[vital.name]) acc[vital.name] = []
        acc[vital.name].push(vital.value)
        return acc
      },
      {} as Record<string, number[]>
    )

    return Object.entries(grouped).reduce(
      (acc, [name, values]) => {
        acc[name] = values.reduce((sum, val) => sum + val, 0) / values.length
        return acc
      },
      {} as Record<string, number>
    )
  },

  // 성능 등급 분포 계산
  getVitalsDistribution: (): Record<string, Record<string, number>> => {
    const vitals = webVitalsUtils.getStoredVitals()
    const distribution = {} as Record<string, Record<string, number>>

    vitals.forEach(vital => {
      if (!distribution[vital.name]) {
        distribution[vital.name] = { good: 0, 'needs-improvement': 0, poor: 0 }
      }
      distribution[vital.name][vital.rating]++
    })

    return distribution
  },
}

export default WebVitalsReporter
