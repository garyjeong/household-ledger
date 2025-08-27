'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { brandColorPalette } from '@/lib/utils/category'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ColorPickerProps {
  value?: string
  onChange: (color: string) => void
  label?: string
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value || '#6B7280')

  const handlePaletteSelect = (color: string) => {
    onChange(color)
    setCustomColor(color)
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setCustomColor(color)
    onChange(color)
  }

  return (
    <div className='space-y-3'>
      {label && <Label>{label}</Label>}

      {/* 색상 팔레트 */}
      <div className='grid grid-cols-6 gap-2'>
        {brandColorPalette.map(color => (
          <button
            key={color.value}
            type='button'
            onClick={() => handlePaletteSelect(color.value)}
            className={`
              relative w-8 h-8 rounded-lg border-2 transition-all
              ${
                value === color.value
                  ? 'border-gray-900 scale-110'
                  : 'border-gray-200 hover:border-gray-300'
              }
            `}
            style={{ backgroundColor: color.value }}
            title={color.name}
          >
            {value === color.value && (
              <Check className='absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-sm' />
            )}
          </button>
        ))}
      </div>

      {/* 커스텀 색상 입력 */}
      <div className='flex gap-2 items-end'>
        <div className='flex-1'>
          <Label htmlFor='custom-color' className='text-sm text-gray-600'>
            또는 직접 입력
          </Label>
          <Input
            id='custom-color'
            type='text'
            value={customColor}
            onChange={handleCustomColorChange}
            placeholder='#RRGGBB'
            className='font-mono text-sm'
          />
        </div>

        {/* 색상 미리보기 */}
        <div
          className='w-10 h-10 rounded-lg border border-gray-200 flex-shrink-0'
          style={{ backgroundColor: customColor }}
          title='선택된 색상'
        />
      </div>

      {/* HTML5 색상 선택기 */}
      <div className='flex items-center gap-2'>
        <input
          type='color'
          value={customColor}
          onChange={e => {
            const color = e.target.value
            setCustomColor(color)
            onChange(color)
          }}
          className='w-8 h-8 rounded border border-gray-300 cursor-pointer'
          title='색상 선택기'
        />
        <span className='text-sm text-gray-500'>색상 선택기 사용</span>
      </div>
    </div>
  )
}
