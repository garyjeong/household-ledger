'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from '@/contexts/auth-context'
import { useGroup } from '@/contexts/group-context'
import { GroupSwitcher } from '@/components/layouts/group-switcher'

export default function Home() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const { groups, currentGroup } = useGroup()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-text-700">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-page p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-text-900">
            Household Ledger
          </h1>
          <p className="text-text-700">
            개인 및 그룹 가계부 관리 시스템
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="brand" className="text-sm px-4 py-2">
              🚀 Phase 3 완료!
            </Badge>
            {isAuthenticated && (
              <Badge variant="success" className="text-sm px-4 py-2">
                👋 안녕하세요, {user?.nickname}님!
              </Badge>
            )}
            {currentGroup && (
              <Badge variant="default" className="text-sm px-4 py-2">
                📊 현재 그룹: {currentGroup.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Authentication Status */}
        {!isAuthenticated ? (
          <Card className="border-2 border-dashed border-brand-400 bg-brand-50">
            <CardHeader>
              <CardTitle className="text-center">로그인이 필요합니다</CardTitle>
              <CardDescription className="text-center">
                가계부 기능을 사용하려면 로그인해주세요
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <Link href="/login">로그인</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/signup">회원가입</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-center text-green-800">
                  환영합니다! 🎉
                </CardTitle>
                <CardDescription className="text-center text-green-700">
                  {user?.email}로 로그인되었습니다
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                {groups.length > 0 && (
                  <div className="flex justify-center">
                    <GroupSwitcher />
                  </div>
                )}
                <div className="flex gap-3 justify-center">
                  <Button asChild>
                    <Link href="/groups">그룹 관리</Link>
                  </Button>
                  <Button variant="outline" onClick={logout}>
                    로그아웃
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Group Status */}
            {groups.length === 0 ? (
              <Card className="border-2 border-dashed border-brand-400 bg-brand-50">
                <CardHeader>
                  <CardTitle className="text-center">그룹을 만들어보세요</CardTitle>
                  <CardDescription className="text-center">
                    혼자 또는 다른 사람들과 함께 가계부를 관리할 수 있습니다
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button asChild>
                    <Link href="/groups">
                      첫 번째 그룹 만들기
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    내 그룹 현황
                    <Badge variant="brand">{groups.length}개</Badge>
                  </CardTitle>
                  <CardDescription>
                    참여 중인 그룹들과 현재 선택된 그룹입니다
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentGroup && (
                    <div className="p-4 bg-brand-50 rounded-lg border border-brand-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-brand-700">현재 그룹</h4>
                        <Badge variant="brand">{currentGroup.memberCount}명</Badge>
                      </div>
                      <p className="text-brand-600 font-medium">{currentGroup.name}</p>
                      <p className="text-sm text-brand-600 mt-1">
                        {currentGroup.members.find(m => m.userId === user?.id)?.role === 'OWNER' && '소유자 • '}
                        {new Date(currentGroup.createdAt).toLocaleDateString()} 생성
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-text-900">{groups.length}</p>
                      <p className="text-sm text-text-700">참여 그룹</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-900">
                        {groups.filter(g => g.ownerId === user?.id).length}
                      </p>
                      <p className="text-sm text-text-700">소유 그룹</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-900">
                        {groups.reduce((acc, group) => acc + (group.memberCount || 0), 0)}
                      </p>
                      <p className="text-sm text-text-700">총 멤버</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}</div>

        {/* Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">프로젝트 설정</CardTitle>
              <CardDescription>Next.js + TypeScript + Tailwind CSS</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={100} className="mb-4" />
              <div className="flex gap-2 flex-wrap">
                <Badge variant="success">Next.js 15</Badge>
                <Badge variant="success">TypeScript</Badge>
                <Badge variant="success">Tailwind CSS</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">데이터베이스</CardTitle>
              <CardDescription>Prisma + MySQL 스키마</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={90} className="mb-4" />
              <div className="flex gap-2 flex-wrap">
                <Badge variant="success">Prisma</Badge>
                <Badge variant="default">MySQL</Badge>
                <Badge variant="warning">스키마 완료</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">UI 컴포넌트</CardTitle>
              <CardDescription>Radix UI + 커스텀 디자인</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={60} className="mb-4" />
              <div className="flex gap-2 flex-wrap">
                <Badge variant="success">Button</Badge>
                <Badge variant="success">Card</Badge>
                <Badge variant="success">Badge</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Color Palette Test */}
        <Card>
          <CardHeader>
            <CardTitle>색상 팔레트 테스트</CardTitle>
            <CardDescription>프로젝트 브랜드 색상 확인</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-16 bg-brand-600 rounded-lg flex items-center justify-center text-white font-semibold">
                  Brand 600
                </div>
                <p className="text-sm text-text-700">메인 브랜드</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-chip-lavender rounded-lg flex items-center justify-center text-brand-700 font-semibold">
                  Chip Lavender
                </div>
                <p className="text-sm text-text-700">칩/배지</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-surface-card border border-stroke-200 rounded-lg flex items-center justify-center text-text-900 font-semibold">
                  Surface Card
                </div>
                <p className="text-sm text-text-700">카드 배경</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-gradient-to-r from-brand-600 to-accent-magenta rounded-lg flex items-center justify-center text-white font-semibold">
                  Gradient
                </div>
                <p className="text-sm text-text-700">그라디언트</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>다음 단계</CardTitle>
            <CardDescription>Phase 2: 인증 시스템 구현</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button>JWT 인증 구현</Button>
              <Button variant="outline">회원가입 페이지</Button>
              <Button variant="secondary">로그인 페이지</Button>
            </div>
            <p className="text-sm text-text-700">
              프로젝트 기반 설정이 완료되었습니다! 이제 사용자 인증 시스템을 구축할 차례입니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}