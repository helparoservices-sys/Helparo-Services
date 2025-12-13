import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  onLoad?: () => void
}

/**
 * Optimized Image Component with lazy loading and blur placeholder
 * Uses Next.js Image component with automatic optimization
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fill = false,
  sizes,
  objectFit = 'cover',
  onLoad
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={fill ? undefined : { width, height }}
      >
        <div className="text-center text-gray-400">
          <svg 
            className="w-12 h-12 mx-auto mb-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <span className="text-sm">Image not found</span>
        </div>
      </div>
    )
  }

  const imageProps: Record<string, unknown> = {
    src,
    alt,
    className: `${className} ${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300`,
    onLoad: handleLoad,
    onError: handleError,
    priority,
    quality: 85,
    placeholder: 'blur' as const,
    blurDataURL: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg==',
  }

  if (fill) {
    imageProps.fill = true
    imageProps.style = { objectFit }
    imageProps.sizes = sizes || '100vw'
  } else {
    imageProps.width = width
    imageProps.height = height
  }

  return (
    <>
      <Image {...imageProps} alt={alt} />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </>
  )
}

/**
 * Avatar Image with fallback to initials
 */
export function AvatarImage({
  src,
  alt,
  name,
  size = 40,
  className = ''
}: {
  src?: string | null
  alt: string
  name?: string
  size?: number
  className?: string
}) {
  const [hasError, setHasError] = useState(false)

  const getInitials = (fullName?: string) => {
    if (!fullName) return '?'
    const names = fullName.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return fullName[0].toUpperCase()
  }

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-primary text-white font-semibold ${className}`}
        style={{ width: size, height: size, borderRadius: '50%' }}
      >
        {getInitials(name || alt)}
      </div>
    )
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        onError={() => setHasError(true)}
        quality={90}
      />
    </div>
  )
}

/**
 * Progressive Image - loads a low quality placeholder first
 */
export function ProgressiveImage({
  src,
  placeholderSrc,
  alt,
  width,
  height,
  className = ''
}: {
  src: string
  placeholderSrc?: string
  alt: string
  width: number
  height: number
  className?: string
}) {
  const [imgSrc, setImgSrc] = useState(placeholderSrc || src)
  const [isLoading, setIsLoading] = useState(true)

  const customLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
    return `${src}?w=${width}&q=${quality || 75}`
  }

  return (
    <div className="relative" style={{ width, height }}>
      <Image
        loader={customLoader}
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoading && placeholderSrc ? 'blur-sm scale-105' : ''} transition-all duration-500`}
        onLoadingComplete={() => {
          if (placeholderSrc && imgSrc === placeholderSrc) {
            setImgSrc(src)
          }
          setIsLoading(false)
        }}
        quality={isLoading ? 10 : 85}
      />
    </div>
  )
}
