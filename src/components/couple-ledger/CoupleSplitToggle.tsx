'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent } from '@/components/ui/card'
import { Person, SplitRule } from '@/types/couple-ledger'
import { User, Users, UserCheck } from 'lucide-react'

interface CoupleSplitToggleProps {
  selectedPerson: Person
  onPersonChange: (person: Person) => void
  splitRule: SplitRule
  onSplitChange: (rule: SplitRule) => void
  defaultSplit: number
  myName: string
  partnerName: string
}

export function CoupleSplitToggle({
  selectedPerson,
  onPersonChange,
  splitRule,
  onSplitChange,
  defaultSplit,
  myName,
  partnerName,
}: CoupleSplitToggleProps) {
  const handleSplitChange = (value: number[]) => {
    const mePercent = value[0]
    const partnerPercent = 100 - mePercent
    onSplitChange({ me: mePercent, partner: partnerPercent })
  }

  const personOptions = [
    {
      value: 'me' as Person,
      label: myName,
      icon: User,
      description: '내 개인 지출',
    },
    {
      value: 'shared' as Person,
      label: '공동',
      icon: Users,
      description: '둘이 함께 사용',
    },
    {
      value: 'partner' as Person,
      label: partnerName,
      icon: UserCheck,
      description: '배우자 지출',
    },
  ]

  return (
    <div className="space-y-4">
      {/* 개인/공동/배우자 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">지출 구분</label>
        <div className="grid grid-cols-3 gap-2">
          {personOptions.map(option => {
            const Icon = option.icon
            const isSelected = selectedPerson === option.value
            
            return (
              <Button
                key={option.value}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPersonChange(option.value)}
                className={`flex flex-col h-auto p-3 transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:bg-muted/50 border-border'
                }`}
              >
                <Icon className="h-4 w-4 mb-1" />
                <span className="text-xs font-medium">{option.label}</span>
                <span className="text-xs opacity-75 mt-1">{option.description}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* 공동 지출일 때만 분할 비율 설정 */}
      {selectedPerson === 'shared' && (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">분할 비율</span>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <span>{myName}: {splitRule.me}%</span>
                  <span>|</span>
                  <span>{partnerName}: {splitRule.partner}%</span>
                </div>
              </div>

              {/* 분할 비율 슬라이더 */}
              <div className="space-y-3">
                <Slider
                  value={[splitRule.me]}
                  onValueChange={handleSplitChange}
                  min={0}
                  max={100}
                  step={10}
                  className="w-full"
                />
                
                {/* 미리 정의된 분할 비율 버튼 */}
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { me: 100, partner: 0, label: '100:0' },
                    { me: 70, partner: 30, label: '70:30' },
                    { me: 50, partner: 50, label: '50:50' },
                    { me: 30, partner: 70, label: '30:70' },
                    { me: 0, partner: 100, label: '0:100' },
                  ].map(ratio => (
                    <Button
                      key={ratio.label}
                      variant="outline"
                      size="sm"
                      onClick={() => onSplitChange(ratio)}
                      className={`text-xs h-8 ${
                        splitRule.me === ratio.me && splitRule.partner === ratio.partner
                          ? 'bg-primary/10 border-primary text-primary'
                          : ''
                      }`}
                    >
                      {ratio.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between text-xs text-text-secondary">
                <span>{myName} {splitRule.me}% 부담</span>
                <span>{partnerName} {splitRule.partner}% 부담</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
