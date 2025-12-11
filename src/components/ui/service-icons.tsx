'use client'

import React from 'react'

interface IconProps {
  className?: string
  size?: number
}

// Modern, minimal service icons inspired by Zomato, Swiggy, Urban Company style
export const PlumbingIcon: React.FC<IconProps> = ({ className = '', size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M24 8V16" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <path d="M16 16H32V20C32 22.2091 30.2091 24 28 24H20C17.7909 24 16 22.2091 16 20V16Z" stroke="currentColor" strokeWidth="3"/>
    <path d="M20 24V28C20 30.2091 21.7909 32 24 32V32C26.2091 32 28 30.2091 28 28V24" stroke="currentColor" strokeWidth="3"/>
    <path d="M24 32V40" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="24" cy="40" r="3" fill="currentColor"/>
    <path d="M18 12H30" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

export const ElectricalIcon: React.FC<IconProps> = ({ className = '', size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M28 8L18 24H24L20 40L34 22H26L28 8Z" fill="currentColor" fillOpacity="0.15"/>
    <path d="M28 8L18 24H24L20 40L34 22H26L28 8Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
  </svg>
)

export const CleaningIcon: React.FC<IconProps> = ({ className = '', size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M24 6L26 12L32 14L26 16L24 22L22 16L16 14L22 12L24 6Z" fill="currentColor"/>
    <path d="M12 18L13.5 22L18 23.5L13.5 25L12 29L10.5 25L6 23.5L10.5 22L12 18Z" fill="currentColor" fillOpacity="0.6"/>
    <path d="M34 24L35.5 28L40 29.5L35.5 31L34 35L32.5 31L28 29.5L32.5 28L34 24Z" fill="currentColor" fillOpacity="0.6"/>
    <circle cx="24" cy="34" r="8" stroke="currentColor" strokeWidth="3"/>
    <path d="M20 34L23 37L28 31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const CarpentryIcon: React.FC<IconProps> = ({ className = '', size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="8" y="20" width="32" height="4" rx="1" fill="currentColor" fillOpacity="0.2"/>
    <rect x="8" y="20" width="32" height="4" rx="1" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M12 24V38H20V30H28V38H36V24" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M24 10L8 20H40L24 10Z" fill="currentColor" fillOpacity="0.15"/>
    <path d="M24 10L8 20H40L24 10Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
  </svg>
)

export const ACRepairIcon: React.FC<IconProps> = ({ className = '', size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="6" y="12" width="36" height="20" rx="3" fill="currentColor" fillOpacity="0.1"/>
    <rect x="6" y="12" width="36" height="20" rx="3" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M10 26H38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10 30H38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 32V40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M32 32V40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M16 40C16 40 20 38 24 40C28 42 32 40 32 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="34" cy="18" r="3" fill="currentColor"/>
  </svg>
)

export const PaintingIcon: React.FC<IconProps> = ({ className = '', size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M8 12C8 9.79086 9.79086 8 12 8H36C38.2091 8 40 9.79086 40 12V20H8V12Z" fill="currentColor" fillOpacity="0.15"/>
    <path d="M8 12C8 9.79086 9.79086 8 12 8H36C38.2091 8 40 9.79086 40 12V20H8V12Z" stroke="currentColor" strokeWidth="2.5"/>
    <rect x="20" y="20" width="8" height="20" stroke="currentColor" strokeWidth="2.5"/>
    <circle cx="16" cy="14" r="3" fill="currentColor" fillOpacity="0.5"/>
    <circle cx="24" cy="14" r="3" fill="currentColor" fillOpacity="0.7"/>
    <circle cx="32" cy="14" r="3" fill="currentColor"/>
  </svg>
)

export const AppliancesIcon: React.FC<IconProps> = ({ className = '', size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="10" y="8" width="28" height="32" rx="3" fill="currentColor" fillOpacity="0.1"/>
    <rect x="10" y="8" width="28" height="32" rx="3" stroke="currentColor" strokeWidth="2.5"/>
    <line x1="10" y1="28" x2="38" y2="28" stroke="currentColor" strokeWidth="2.5"/>
    <circle cx="24" cy="18" r="6" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M24 14V18L26 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <rect x="16" y="32" width="6" height="4" rx="1" fill="currentColor"/>
    <rect x="26" y="32" width="6" height="4" rx="1" fill="currentColor"/>
  </svg>
)

export const PestControlIcon: React.FC<IconProps> = ({ className = '', size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="24" cy="24" r="14" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M14 14L34 34" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <path d="M24 16V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M20 22H28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <ellipse cx="24" cy="28" rx="4" ry="5" fill="currentColor" fillOpacity="0.3"/>
    <ellipse cx="24" cy="28" rx="4" ry="5" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

// Service icon mapping for easy usage
export const ServiceIcons = {
  plumbing: PlumbingIcon,
  electrical: ElectricalIcon,
  cleaning: CleaningIcon,
  carpentry: CarpentryIcon,
  'ac-repair': ACRepairIcon,
  painting: PaintingIcon,
  appliances: AppliancesIcon,
  'pest-control': PestControlIcon,
}

export type ServiceIconType = keyof typeof ServiceIcons
