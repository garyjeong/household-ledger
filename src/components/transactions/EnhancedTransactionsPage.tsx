/**
 * Enhanced Transactions Page
 * T-019 요구사항에 맞게 개선된 거래 관리 페이지
 */

'use client'

import React, { useState } from 'react'
import {
  Search,
  Filter,
  Plus,
  Download,
  Globe,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react'
import { PaginationState } from '@tanstack/react-table'
import { ResponsiveLayout } from '@/components/couple-ledger/DesktopSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  useTransactions,
  useDeleteTransaction,
} from '@/hooks/use-transactions'
import { useExchangeRates } from '@/hooks/use-exchange-rates'
import { formatCurrency } from '@/lib/currency-api'
import { useGroup } from '@/contexts/group-context'
import { useAlert } from '@/contexts/alert-context'
import { TransactionsTable } from './TransactionsTable'

interface TransactionFilters {
  search: string
  category: string
  type: 'all' | 'INCOME' | 'EXPENSE'
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year'
  currency: 'all' | string
}

const initialFilters: TransactionFilters = {
  search: '',
  category: 'all',
  type: 'all',
  dateRange: 'month',
  currency: 'all',
}

/**
 * 향상된 거래내역 페이지
 */
export function EnhancedTransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  const { currentGroup } = useGroup()
  const { showSuccess, showError } = useAlert()

  // React Query hooks
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useTransactions({
    type: filters.type !== 'all' ? filters.type : undefined,
    search: filters.search || undefined,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  })

  const { data: exchangeRates, isLoading: ratesLoading } = useExchangeRates()
  const deleteTransactionMutation = useDeleteTransaction()

  const transactions = transactionsData?.transactions || []
  const totalCount = transactionsData?.pagination?.totalCount || 0

  // 필터 업데이트
  const updateFilter = (key: keyof TransactionFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // 거래 삭제
  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('이 거래를 삭제하시겠습니까?')) return
    await deleteTransactionMutation.mutateAsync(id)
  }

  // 페이지네이션 변경 핸들러
  const handlePaginationChange = (newPagination: PaginationState) => {
    setPagination(newPagination)
  }

  if (!currentGroup) {
    return (
      <ResponsiveLayout>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <p className='text-gray-500'>그룹을 선택해주세요</p>
          </div>
        </div>
      </ResponsiveLayout>
    )
  }

  return (
    <>
      <ResponsiveLayout>
        <div className='w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 space-y-4'>
          {/* 헤더 - 월별 대시보드와 동일한 스타일 적용 */}
          <div className='sticky top-0 z-20 bg-white mb-2'>
            <div className='pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200 rounded-lg p-4 shadow-sm'>
              <div>
                <h1 className='text-3xl font-bold text-slate-900 tracking-tight'>거래내역</h1>
                <p className='text-slate-600 mt-1'>모든 수입과 지출을 확인하세요</p>
                {ratesLoading && (
                  <div className='flex items-center gap-2 text-sm text-blue-600 mt-1'>
                    <RefreshCw className='h-3 w-3 animate-spin' />
                    환율 정보 업데이트 중...
                  </div>
                )}
              </div>

              <div className='flex gap-2' />
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className='space-y-6'>
            {/* 통계 카드 */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>총 수입</CardTitle>
                <TrendingUp className='h-4 w-4 text-green-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-green-600'>
                  {formatCurrency(
                    transactions
                      .filter((t: any) => t.type === 'INCOME')
                      .reduce(
                        (sum: number, t: any) => sum + Number(t.convertedAmount ?? t.amount),
                        0
                      ),
                    'KRW'
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>총 지출</CardTitle>
                <TrendingDown className='h-4 w-4 text-red-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-red-600'>
                  {formatCurrency(
                    transactions
                      .filter((t: any) => t.type === 'EXPENSE')
                      .reduce(
                        (sum: number, t: any) => sum + Number(t.convertedAmount ?? t.amount),
                        0
                      ),
                    'KRW'
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>순 잔액</CardTitle>
                <Globe className='h-4 w-4 text-blue-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-blue-600'>
                  {formatCurrency(
                    transactions.reduce((sum: number, t: any) => {
                      const amount = Number(t.convertedAmount ?? t.amount)
                      return sum + (t.type === 'INCOME' ? amount : -amount)
                    }, 0),
                    'KRW'
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

            {/* 필터 영역 */}
            <Card>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Filter className='h-5 w-5' />
                필터
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                {/* 검색 */}
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder='거래 검색...'
                    value={filters.search}
                    onChange={e => updateFilter('search', e.target.value)}
                    className='pl-10'
                  />
                </div>

                {/* 타입 필터 */}
                <select
                  value={filters.type}
                  onChange={e => updateFilter('type', e.target.value)}
                  className='px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm'
                >
                  <option value='all'>모든 거래</option>
                  <option value='INCOME'>수입</option>
                  <option value='EXPENSE'>지출</option>
                </select>

                {/* 기간 필터 */}
                <select
                  value={filters.dateRange}
                  onChange={e => updateFilter('dateRange', e.target.value)}
                  className='px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm'
                >
                  <option value='all'>전체 기간</option>
                  <option value='today'>오늘</option>
                  <option value='week'>지난 7일</option>
                  <option value='month'>이번 달</option>
                  <option value='year'>올해</option>
                </select>

                {/* 통화 필터 */}
                <select
                  value={filters.currency}
                  onChange={e => updateFilter('currency', e.target.value)}
                  className='px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm'
                >
                  <option value='all'>모든 통화</option>
                  <option value='KRW'>KRW (원)</option>
                  <option value='USD'>USD (달러)</option>
                  <option value='EUR'>EUR (유로)</option>
                  <option value='JPY'>JPY (엔)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* 거래 목록 - TanStack Table */}
          <TransactionsTable
            data={transactions}
            isLoading={transactionsLoading}
            totalCount={transactions.length}
            pagination={
              transactionsData?.pagination
                ? {
                    page: transactionsData.pagination.page,
                    limit: transactionsData.pagination.limit,
                    totalPages: transactionsData.pagination.totalPages,
                    hasNext: transactionsData.pagination.hasNext,
                    hasPrev: transactionsData.pagination.hasPrev,
                  }
                : undefined
            }
            onPaginationChange={handlePaginationChange}
            onEdit={undefined}
            onDelete={handleDeleteTransaction}
          />
          </div>
        </div>
      </ResponsiveLayout>
    </>
  )
}
