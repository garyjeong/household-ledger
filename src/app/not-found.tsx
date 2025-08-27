'use client'

import { Home, Search, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md text-center'>
        <CardHeader>
          <div className='mx-auto mb-4 p-3 bg-gray-100 rounded-full w-fit'>
            <Search className='h-8 w-8 text-gray-600' />
          </div>
          <CardTitle className='text-2xl text-gray-900'>404</CardTitle>
          <p className='text-gray-600'>페이지를 찾을 수 없습니다</p>
        </CardHeader>

        <CardContent className='space-y-4'>
          <p className='text-gray-700'>요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.</p>

          <div className='space-y-3'>
            <Button
              onClick={() => window.history.back()}
              variant='outline'
              className='w-full flex items-center justify-center gap-2'
            >
              <ArrowLeft className='h-4 w-4' />
              이전 페이지로
            </Button>

            <Button
              onClick={() => (window.location.href = '/')}
              className='w-full flex items-center justify-center gap-2'
            >
              <Home className='h-4 w-4' />
              홈으로 가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
