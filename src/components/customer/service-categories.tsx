'use client'

import Link from 'next/link'
import Image from 'next/image'

// Service categories with meaningful images/icons
export const serviceCategories = [
  {
    id: 'plumbing',
    name: 'Plumbing',
    slug: 'plumber',
    emoji: '🔧',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=200&h=200&fit=crop',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    id: 'electrical',
    name: 'Electrical',
    slug: 'electrician',
    emoji: '⚡',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200&h=200&fit=crop',
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    slug: 'cleaning',
    emoji: '🧹',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&h=200&fit=crop',
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    id: 'carpentry',
    name: 'Carpentry',
    slug: 'carpenter',
    emoji: '🪚',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&h=200&fit=crop',
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50',
    textColor: 'text-orange-600',
  },
  {
    id: 'ac-repair',
    name: 'AC Repair',
    slug: 'ac-repair',
    emoji: '❄️',
    image: 'https://images.unsplash.com/photo-1631545806609-6578de5a7f8b?w=200&h=200&fit=crop',
    color: 'bg-cyan-500',
    lightColor: 'bg-cyan-50',
    textColor: 'text-cyan-600',
  },
  {
    id: 'painting',
    name: 'Painting',
    slug: 'painter',
    emoji: '🎨',
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=200&h=200&fit=crop',
    color: 'bg-pink-500',
    lightColor: 'bg-pink-50',
    textColor: 'text-pink-600',
  },
  {
    id: 'pest-control',
    name: 'Pest Control',
    slug: 'pest-control',
    emoji: '🐛',
    image: 'https://images.unsplash.com/photo-1632935190508-d2962da38c68?w=200&h=200&fit=crop',
    color: 'bg-red-500',
    lightColor: 'bg-red-50',
    textColor: 'text-red-600',
  },
  {
    id: 'appliance',
    name: 'Appliance',
    slug: 'appliance-repair',
    emoji: '🔌',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop',
    color: 'bg-violet-500',
    lightColor: 'bg-violet-50',
    textColor: 'text-violet-600',
  },
]

interface ServiceCategoriesProps {
  variant?: 'circles' | 'cards' | 'compact'
  showLabels?: boolean
  selectedId?: string
  onSelect?: (id: string) => void
  className?: string
}

export function ServiceCategories({
  variant = 'circles',
  showLabels = true,
  selectedId,
  onSelect,
  className = '',
}: ServiceCategoriesProps) {
  
  if (variant === 'circles') {
    return (
      <div className={`flex gap-4 overflow-x-auto pb-2 scrollbar-hide ${className}`}>
        {serviceCategories.map((category) => {
          const isSelected = selectedId === category.id
          return (
            <button
              key={category.id}
              onClick={() => onSelect?.(category.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-2 transition-all ${
                onSelect ? 'cursor-pointer hover:scale-105' : ''
              }`}
            >
              {/* Circle with emoji/icon */}
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md transition-all ${
                  isSelected
                    ? `${category.color} ring-4 ring-offset-2 ring-${category.color.replace('bg-', '')}/50`
                    : category.lightColor
                }`}
              >
                <span className="text-2xl">{category.emoji}</span>
              </div>
              {/* Label */}
              {showLabels && (
                <span className={`text-xs font-medium text-center ${
                  isSelected ? category.textColor : 'text-gray-600'
                }`}>
                  {category.name}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide ${className}`}>
        {serviceCategories.map((category) => {
          const isSelected = selectedId === category.id
          return (
            <button
              key={category.id}
              onClick={() => onSelect?.(category.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
                isSelected
                  ? `${category.color} text-white shadow-lg`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-base">{category.emoji}</span>
              <span className="text-sm font-medium whitespace-nowrap">{category.name}</span>
            </button>
          )
        })}
      </div>
    )
  }

  // Cards variant
  return (
    <div className={`grid grid-cols-4 gap-3 ${className}`}>
      {serviceCategories.map((category) => {
        const isSelected = selectedId === category.id
        return (
          <Link
            key={category.id}
            href={`/services/${category.slug}`}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:scale-105 ${
              isSelected
                ? `${category.lightColor} ring-2 ${category.textColor.replace('text-', 'ring-')}`
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className={`w-12 h-12 ${category.color} rounded-xl flex items-center justify-center shadow-lg`}>
              <span className="text-xl">{category.emoji}</span>
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">{category.name}</span>
          </Link>
        )
      })}
    </div>
  )
}

// Horizontal scrollable categories for homepage-style display
export function ServiceCategoriesHorizontal({ className = '' }: { className?: string }) {
  return (
    <div className={`${className}`}>
      <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
        {serviceCategories.map((category) => (
          <Link
            key={category.id}
            href={`/services/${category.slug}`}
            className="flex-shrink-0 flex flex-col items-center gap-3 group"
          >
            {/* Image Circle */}
            <div className="relative">
              <div className={`w-20 h-20 rounded-full ${category.lightColor} p-1 transition-all group-hover:scale-105 group-hover:shadow-lg`}>
                <div className={`w-full h-full rounded-full ${category.color} flex items-center justify-center overflow-hidden`}>
                  <span className="text-3xl drop-shadow-md">{category.emoji}</span>
                </div>
              </div>
              {/* Active indicator ring */}
              <div className={`absolute inset-0 rounded-full border-2 border-transparent group-hover:border-${category.color.replace('bg-', '')} transition-colors`} />
            </div>
            {/* Label */}
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// Beautiful gradient cards with images - like Swiggy/Zomato
export function ServiceCategoriesGrid({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 ${className}`}>
      {serviceCategories.map((category) => (
        <Link
          key={category.id}
          href={`/services/${category.slug}`}
          className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
        >
          {/* Gradient background */}
          <div className={`absolute inset-0 ${category.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
          
          {/* Content */}
          <div className="relative p-4 flex flex-col items-center text-center">
            {/* Icon/Emoji circle */}
            <div className={`w-14 h-14 ${category.lightColor} rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
              <span className="text-2xl">{category.emoji}</span>
            </div>
            
            {/* Name */}
            <h3 className="font-semibold text-gray-900 text-sm mb-1">{category.name}</h3>
            
            {/* Subtle indicator */}
            <div className={`w-8 h-1 ${category.color} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          </div>
        </Link>
      ))}
    </div>
  )
}
