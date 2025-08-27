'use client'

import React, { useState, memo } from 'react'
import Image, { ImageProps } from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  // 추가 props
  fallbackSrc?: string
  showLoading?: boolean
  className?: string
  containerClassName?: string

  // 성능 최적화 옵션
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string

  // 에러 핸들링
  onLoadingComplete?: () => void
  onError?: (error: any) => void
}

const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  fallbackSrc,
  showLoading = true,
  className,
  containerClassName,
  onLoadingComplete,
  onError,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)

  const handleLoad = () => {
    setIsLoading(false)
    onLoadingComplete?.()
  }

  const handleError = (error: any) => {
    setIsLoading(false)
    setHasError(true)

    // fallback 이미지가 있고 현재 이미지가 fallback이 아닌 경우
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc)
      setHasError(false)
      return
    }

    onError?.(error)
  }

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {/* 로딩 상태 */}
      {isLoading && showLoading && (
        <div className='absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse'>
          <div className='w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin' />
        </div>
      )}

      {/* 에러 상태 */}
      {hasError && !fallbackSrc && (
        <div className='absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-500'>
          <div className='text-center'>
            <div className='text-2xl mb-2'>📷</div>
            <div className='text-sm'>이미지를 불러올 수 없습니다</div>
          </div>
        </div>
      )}

      {/* 실제 이미지 */}
      {!hasError && (
        <Image
          src={imageSrc}
          alt={alt}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          // 성능 최적화를 위한 기본 설정
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
          {...props}
        />
      )}
    </div>
  )
})

OptimizedImage.displayName = 'OptimizedImage'

export { OptimizedImage }
export default OptimizedImage

// 아바타용 최적화된 이미지 컴포넌트
export const Avatar = memo(function Avatar({
  src,
  alt = 'Avatar',
  size = 40,
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height'> & {
  size?: number
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full object-cover', className)}
      containerClassName='rounded-full'
      fallbackSrc='/images/default-avatar.png' // 기본 아바타 이미지
      placeholder='blur'
      blurDataURL='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
      {...props}
    />
  )
})

// 로고용 최적화된 이미지 컴포넌트
export const Logo = memo(function Logo({
  src = '/images/logo.png',
  alt = '우리집 가계부 로고',
  width = 120,
  height = 40,
  className,
  priority = true,
  ...props
}: Partial<OptimizedImageProps>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn('object-contain', className)}
      priority={priority}
      placeholder='empty'
      {...props}
    />
  )
})
