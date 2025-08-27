'use client'

import React, { useState, useEffect, memo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Zap,
  Eye,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { webVitalsUtils } from '@/components/performance/WebVitalsReporter'

interface VitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  unit: string
  description: string
  threshold: { good: number; poor: number }
}

const VITALS_CONFIG: Record<string, Omit<VitalMetric, 'value' | 'rating'>> = {
  LCP: {
    name: 'Largest Contentful Paint',
    unit: 'ms',
    description: '페이지의 주요 콘텐츠가 로드되는 시간',
    threshold: { good: 2500, poor: 4000 },
  },
  // FID는 web-vitals v5에서 제거되어 INP로 대체됨
  CLS: {
    name: 'Cumulative Layout Shift',
    unit: '',
    description: '예상치 못한 레이아웃 이동 점수',
    threshold: { good: 0.1, poor: 0.25 },
  },
  FCP: {
    name: 'First Contentful Paint',
    unit: 'ms',
    description: '첫 번째 콘텐츠가 화면에 표시되는 시간',
    threshold: { good: 1800, poor: 3000 },
  },
  TTFB: {
    name: 'Time to First Byte',
    unit: 'ms',
    description: '서버에서 첫 번째 바이트를 받는 시간',
    threshold: { good: 800, poor: 1800 },
  },
  INP: {
    name: 'Interaction to Next Paint',
    unit: 'ms',
    description: '상호작용 후 다음 페인트까지의 시간',
    threshold: { good: 200, poor: 500 },
  },
}

const PerformanceDashboard = memo(function PerformanceDashboard() {
  const [vitals, setVitals] = useState<VitalMetric[]>([])
  const [distribution, setDistribution] = useState<Record<string, Record<string, number>>>({})
  const [isLoading, setIsLoading] = useState(true)

  const loadVitalsData = () => {
    setIsLoading(true)

    try {
      // 저장된 Web Vitals 데이터 로드
      const storedVitals = webVitalsUtils.getStoredVitals()
      const averageVitals = webVitalsUtils.getAverageVitals()
      const vitalDistribution = webVitalsUtils.getVitalsDistribution()

      // 메트릭 데이터 구성
      const vitalMetrics: VitalMetric[] = Object.entries(VITALS_CONFIG).map(([key, config]) => {
        const value = averageVitals[key] || 0
        const { good, poor } = config.threshold

        let rating: 'good' | 'needs-improvement' | 'poor' = 'good'
        if (value > poor) rating = 'poor'
        else if (value > good) rating = 'needs-improvement'

        return {
          ...config,
          value,
          rating,
        }
      })

      setVitals(vitalMetrics)
      setDistribution(vitalDistribution)
    } catch (error) {
      console.error('Failed to load vitals data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadVitalsData()

    // 주기적으로 데이터 새로고침 (30초마다)
    const interval = setInterval(loadVitalsData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'text-green-600 bg-green-50'
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-50'
      case 'poor':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'good':
        return <TrendingUp className='w-4 h-4' />
      case 'needs-improvement':
        return <AlertTriangle className='w-4 h-4' />
      case 'poor':
        return <TrendingDown className='w-4 h-4' />
      default:
        return <Activity className='w-4 h-4' />
    }
  }

  const getVitalIcon = (name: string) => {
    if (name.includes('Paint')) return <Eye className='w-5 h-5' />
    if (name.includes('Delay') || name.includes('Interaction')) return <Zap className='w-5 h-5' />
    if (name.includes('Shift')) return <Activity className='w-5 h-5' />
    return <Clock className='w-5 h-5' />
  }

  const formatValue = (value: number, unit: string) => {
    if (unit === 'ms') {
      return `${Math.round(value)}ms`
    }
    if (unit === '') {
      return value.toFixed(3)
    }
    return `${value}${unit}`
  }

  const clearData = () => {
    webVitalsUtils.clearStoredVitals()
    setVitals([])
    setDistribution({})
  }

  if (process.env.NODE_ENV !== 'development') {
    return null // 개발 환경에서만 표시
  }

  return (
    <div className='space-y-6 p-6 bg-slate-50 min-h-screen'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-slate-900'>성능 모니터링 대시보드</h1>
          <p className='text-slate-600 mt-1'>Web Vitals 및 성능 지표 실시간 모니터링</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={loadVitalsData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button variant='outline' size='sm' onClick={clearData}>
            데이터 초기화
          </Button>
        </div>
      </div>

      {/* Web Vitals 카드들 */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {vitals.map(vital => (
          <Card key={vital.name} className='relative overflow-hidden'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <div className='flex items-center space-x-2'>
                {getVitalIcon(vital.name)}
                <CardTitle className='text-sm font-medium'>{vital.name}</CardTitle>
              </div>
              <Badge variant='secondary' className={getRatingColor(vital.rating)}>
                <span className='flex items-center gap-1'>
                  {getRatingIcon(vital.rating)}
                  {vital.rating}
                </span>
              </Badge>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{formatValue(vital.value, vital.unit)}</div>
              <p className='text-xs text-slate-600 mt-1'>{vital.description}</p>
              <div className='mt-3 text-xs text-slate-500'>
                <span className='text-green-600'>
                  좋음: ≤{formatValue(vital.threshold.good, vital.unit)}
                </span>
                <span className='mx-2'>|</span>
                <span className='text-red-600'>
                  나쁨: &gt;{formatValue(vital.threshold.poor, vital.unit)}
                </span>
              </div>

              {/* 분포 차트 (간단한 막대) */}
              {distribution[vital.name] && (
                <div className='mt-3'>
                  <div className='text-xs text-slate-600 mb-1'>최근 측정 분포</div>
                  <div className='flex h-2 rounded-full overflow-hidden bg-slate-200'>
                    {Object.entries(distribution[vital.name]).map(([rating, count]) => {
                      const total = Object.values(distribution[vital.name]).reduce(
                        (a, b) => a + b,
                        0
                      )
                      const percentage = total > 0 ? (count / total) * 100 : 0

                      return (
                        <div
                          key={rating}
                          className={`h-full ${
                            rating === 'good'
                              ? 'bg-green-500'
                              : rating === 'needs-improvement'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                          title={`${rating}: ${count}회 (${percentage.toFixed(1)}%)`}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 성능 개선 권장사항 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='w-5 h-5' />
            성능 개선 권장사항
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {vitals.filter(v => v.rating !== 'good').length === 0 ? (
              <p className='text-green-600'>🎉 모든 Web Vitals 지표가 양호합니다!</p>
            ) : (
              vitals
                .filter(v => v.rating !== 'good')
                .map(vital => (
                  <div
                    key={vital.name}
                    className='p-3 bg-yellow-50 rounded-lg border border-yellow-200'
                  >
                    <div className='flex items-start gap-2'>
                      <AlertTriangle className='w-5 h-5 text-yellow-600 mt-0.5' />
                      <div>
                        <div className='font-medium text-yellow-800'>{vital.name} 개선 필요</div>
                        <div className='text-sm text-yellow-700 mt-1'>
                          현재: {formatValue(vital.value, vital.unit)}
                          (목표: ≤{formatValue(vital.threshold.good, vital.unit)})
                        </div>
                        <div className='text-xs text-yellow-600 mt-2'>
                          {getRecommendation(vital.name)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

// 성능 개선 권장사항
function getRecommendation(vitalName: string): string {
  switch (vitalName) {
    case 'Largest Contentful Paint':
      return '이미지 최적화, 서버 응답 시간 개선, 리소스 사전 로드를 고려해보세요.'
    case 'First Input Delay':
      return 'JavaScript 번들 크기 줄이기, 코드 분할, Web Worker 사용을 검토해보세요.'
    case 'Cumulative Layout Shift':
      return '이미지/광고 크기 지정, 폰트 최적화, 동적 콘텐츠 개선을 진행해보세요.'
    case 'First Contentful Paint':
      return '중요한 리소스 사전 로드, 서버 응답 시간 최적화를 고려해보세요.'
    case 'Time to First Byte':
      return '서버 최적화, CDN 사용, 캐싱 전략 개선을 검토해보세요.'
    case 'Interaction to Next Paint':
      return '장시간 실행되는 작업 분할, 메인 스레드 차단 최소화를 진행해보세요.'
    default:
      return '성능 최적화 가이드를 참고하여 개선해보세요.'
  }
}

export { PerformanceDashboard }
export default PerformanceDashboard
