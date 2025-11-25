'use client'

import * as React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
  onValueChange?: (value: string) => void
  defaultValue?: string
  value?: string
}

export function Select({ 
  children, 
  onValueChange, 
  defaultValue, 
  value,
  className = '',
  ...props 
}: SelectProps) {
  return (
    <select
      value={value}
      defaultValue={defaultValue}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export function SelectTrigger({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props}>{children}</div>
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span>{placeholder}</span>
}

export function SelectContent({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <>{children}</>
}

export function SelectItem({ 
  children, 
  value,
  className = '',
  ...props 
}: React.OptionHTMLAttributes<HTMLOptionElement>) {
  return (
    <option value={value} className={className} {...props}>
      {children}
    </option>
  )
}
