/**
 * 이미지 최적화 및 처리 유틸리티
 */

// 이미지 리사이징을 위한 크기 옵션
export const IMAGE_SIZES = {
  avatar: { width: 40, height: 40 },
  avatarLarge: { width: 80, height: 80 },
  thumbnail: { width: 150, height: 150 },
  card: { width: 300, height: 200 },
  hero: { width: 1200, height: 600 },
  fullWidth: { width: 1920, height: 1080 },
} as const

// 이미지 품질 설정
export const IMAGE_QUALITY = {
  low: 50,
  medium: 75,
  high: 90,
  max: 100,
} as const

// Next.js Image 컴포넌트용 sizes 속성 생성
export function generateImageSizes(breakpoints: { [key: string]: string }) {
  return Object.entries(breakpoints)
    .map(([media, size]) => `(${media}) ${size}`)
    .join(', ')
}

// 일반적인 반응형 이미지 sizes
export const RESPONSIVE_SIZES = {
  // 전체 너비 이미지
  fullWidth: '100vw',

  // 일반적인 컨텐츠 이미지
  content: generateImageSizes({
    'max-width: 640px': '100vw',
    'max-width: 768px': '90vw',
    'max-width: 1024px': '80vw',
    'max-width: 1280px': '70vw',
  }),

  // 카드형 이미지
  card: generateImageSizes({
    'max-width: 640px': '100vw',
    'max-width: 768px': '50vw',
    'max-width: 1024px': '33vw',
    'max-width: 1280px': '25vw',
  }),

  // 썸네일 이미지
  thumbnail: generateImageSizes({
    'max-width: 640px': '25vw',
    'max-width: 768px': '20vw',
    'max-width: 1024px': '15vw',
  }),
}

// blur placeholder 생성 (작은 이미지를 base64로 인코딩)
export function generateBlurDataURL(width: number = 10, height: number = 10): string {
  // 단색 blur placeholder 생성
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  // 그라데이션 배경 생성
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#f1f5f9') // slate-100
  gradient.addColorStop(1, '#e2e8f0') // slate-200

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  return canvas.toDataURL('image/jpeg', 0.1)
}

// 서버사이드에서 사용할 blur placeholder (고정 값)
export const BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='

// 이미지 URL에서 최적화된 버전 생성 (CDN 사용 시)
export function optimizeImageURL(
  src: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif' | 'jpeg' | 'png'
  } = {}
): string {
  // 이미 Next.js 최적화 URL인 경우 그대로 반환
  if (src.includes('/_next/image')) {
    return src
  }

  // 외부 CDN URL 최적화 (예: Cloudinary, Vercel 등)
  if (src.includes('cloudinary.com')) {
    return optimizeCloudinaryURL(src, options)
  }

  // 기본 Next.js 이미지 최적화 URL 생성
  const params = new URLSearchParams()
  params.set('url', src)

  if (options.width) params.set('w', options.width.toString())
  if (options.quality) params.set('q', options.quality.toString())

  return `/_next/image?${params.toString()}`
}

// Cloudinary URL 최적화
function optimizeCloudinaryURL(
  src: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif' | 'jpeg' | 'png'
  }
): string {
  const transformations = []

  if (options.width && options.height) {
    transformations.push(`c_fill,w_${options.width},h_${options.height}`)
  } else if (options.width) {
    transformations.push(`c_scale,w_${options.width}`)
  } else if (options.height) {
    transformations.push(`c_scale,h_${options.height}`)
  }

  if (options.quality) {
    transformations.push(`q_${options.quality}`)
  }

  if (options.format) {
    transformations.push(`f_${options.format}`)
  }

  // 자동 품질 및 포맷 최적화
  transformations.push('f_auto', 'q_auto')

  const transformString = transformations.join(',')

  // Cloudinary URL 구조: https://res.cloudinary.com/cloud/image/upload/transformations/image_path
  return src.replace(/\/upload\//, `/upload/${transformString}/`)
}

// 이미지 프리로딩
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

// 다중 이미지 프리로딩
export async function preloadImages(srcs: string[]): Promise<void> {
  try {
    await Promise.all(srcs.map(preloadImage))
  } catch (error) {
    console.warn('Some images failed to preload:', error)
  }
}

// 이미지 지연 로딩 교차점 관찰자 설정
export function createImageObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px', // 50px 전에 미리 로드
    threshold: 0.1,
    ...options,
  }

  return new IntersectionObserver(entries => {
    entries.forEach(callback)
  }, defaultOptions)
}

// 이미지 압축 (클라이언트 사이드)
export function compressImage(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
  } = {}
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    img.onload = () => {
      const { maxWidth = 1200, maxHeight = 1200, quality = 0.8, format = 'jpeg' } = options

      // 비율 유지하며 크기 계산
      let { width, height } = img
      const ratio = Math.min(maxWidth / width, maxHeight / height)

      if (ratio < 1) {
        width *= ratio
        height *= ratio
      }

      canvas.width = width
      canvas.height = height

      // 이미지 그리기
      ctx.drawImage(img, 0, 0, width, height)

      // Blob으로 변환
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        `image/${format}`,
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

// 파일 크기를 사람이 읽기 쉬운 형태로 변환
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 이미지 형식 검증
export function validateImageFormat(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  return allowedTypes.includes(file.type)
}

// 이미지 크기 검증
export function validateImageSize(file: File, maxSize: number = 5 * 1024 * 1024): boolean {
  return file.size <= maxSize
}
