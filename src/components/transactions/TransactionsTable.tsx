/**
 * TanStack Table 기반 거래 테이블 컴포넌트
 * T-021 요구사항: TanStack Table 활용 테이블 UI 구현
 */

'use client'

import React, { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
  PaginationState,
} from '@tanstack/react-table'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/currency-api'

interface Transaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  date: string
  amount: number
  description: string
  memo?: string
  currency?: string
  convertedAmount?: number
  category?: {
    id: string
    name: string
    color: string
  }
  account?: {
    id: string
    name: string
    type: string
  }
  tags?: string[]
}

interface TransactionsTableProps {
  data: Transaction[]
  isLoading?: boolean
  totalCount?: number
  pagination?: {
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  onPaginationChange?: (pagination: PaginationState) => void
  onEdit?: (transaction: Transaction) => void
  onDelete?: (id: string) => void
  className?: string
}

const columnHelper = createColumnHelper<Transaction>()

/**
 * TanStack Table 기반 거래 테이블 컴포넌트
 */
export function TransactionsTable({
  data,
  isLoading = false,
  totalCount = 0,
  pagination,
  onPaginationChange,
  onEdit,
  onDelete,
  className = '',
}: TransactionsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // 테이블 컬럼 정의
  const columns = useMemo(
    () => [
      // 날짜 컬럼
      columnHelper.accessor('date', {
        id: 'date',
        header: ({ column }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-8 p-0 font-medium'
          >
            날짜
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className='ml-2 h-3 w-3' />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className='ml-2 h-3 w-3' />
            ) : (
              <ArrowUpDown className='ml-2 h-3 w-3' />
            )}
          </Button>
        ),
        cell: ({ getValue }) => {
          const date = new Date(getValue())
          return (
            <div className='text-sm'>
              <div className='font-medium'>{date.toLocaleDateString('ko-KR')}</div>
            </div>
          )
        },
        sortingFn: 'datetime',
        size: 100,
      }),

      // 카테고리 컬럼
      columnHelper.accessor('category', {
        id: 'category',
        header: '카테고리',
        cell: ({ getValue }) => {
          const category = getValue()
          return category ? (
            <div className='flex items-center gap-2'>
              <div
                className='w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold'
                style={{ backgroundColor: category.color }}
              >
                {category.name[0]}
              </div>
              <span className='text-sm font-medium'>{category.name}</span>
            </div>
          ) : (
            <span className='text-gray-400 text-sm'>미분류</span>
          )
        },
        size: 150,
      }),

      // 내용 컬럼
      columnHelper.accessor('description', {
        id: 'description',
        header: '내용',
        cell: ({ row, getValue }) => {
          const description = getValue()
          const memo = row.original.memo
          const tags = row.original.tags || []

          return (
            <div className='space-y-1'>
              <div className='font-medium text-gray-900'>{description}</div>
              {memo && <div className='text-sm text-gray-500 truncate max-w-[200px]'>{memo}</div>}
              {tags.length > 0 && (
                <div className='flex gap-1 flex-wrap'>
                  {tags.slice(0, 2).map(tag => (
                    <Badge key={tag} variant='outline' className='text-xs'>
                      {tag}
                    </Badge>
                  ))}
                  {tags.length > 2 && (
                    <Badge variant='outline' className='text-xs'>
                      +{tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )
        },
        size: 250,
      }),

      // 계좌 컬럼 제거

      // 금액 컬럼
      columnHelper.accessor('amount', {
        id: 'amount',
        header: ({ column }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-8 p-0 font-medium'
          >
            금액
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className='ml-2 h-3 w-3' />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className='ml-2 h-3 w-3' />
            ) : (
              <ArrowUpDown className='ml-2 h-3 w-3' />
            )}
          </Button>
        ),
        cell: ({ row, getValue }) => {
          const amount = getValue()
          const transaction = row.original
          const currency = transaction.currency || 'KRW'
          const convertedAmount = transaction.convertedAmount
          const isIncome = transaction.type === 'INCOME'

          return (
            <div className='text-right'>
              <div className={`text-lg font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                {isIncome ? '+' : '-'}
                {formatCurrency(amount, currency)}
              </div>
              {currency !== 'KRW' && convertedAmount && (
                <div className='text-xs text-gray-500 flex items-center justify-end gap-1'>
                  <Globe className='h-3 w-3' />≈ {formatCurrency(convertedAmount, 'KRW')}
                </div>
              )}
              {currency !== 'KRW' && (
                <Badge variant='outline' className='text-xs mt-1'>
                  {currency}
                </Badge>
              )}
            </div>
          )
        },
        sortingFn: 'alphanumeric',
        size: 150,
      }),

      // 액션 컬럼
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const transaction = row.original
          return (
            <div className='flex items-center gap-1'>
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-8 p-0'
                onClick={() => onEdit?.(transaction)}
              >
                <Edit className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-8 p-0 text-red-600 hover:text-red-700'
                onClick={() => onDelete?.(transaction.id)}
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          )
        },
        size: 80,
      }),
    ],
    [onEdit, onDelete]
  )

  // 테이블 인스턴스 생성
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      pagination: pagination
        ? {
            pageIndex: pagination.page - 1,
            pageSize: pagination.limit,
          }
        : undefined,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: onPaginationChange
      ? state => {
          if (typeof state === 'function') {
            const newState = state(table.getState().pagination)
            onPaginationChange({
              pageIndex: newState.pageIndex,
              pageSize: newState.pageSize,
            })
          } else {
            onPaginationChange(state)
          }
        }
      : undefined,
    manualPagination: !!pagination,
    pageCount: pagination?.totalPages ?? -1,
  })

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>거래 목록 ({totalCount.toLocaleString()}건)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        {/* 테이블 */}
        <div className='relative overflow-auto'>
          <table className='w-full'>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className='border-b bg-gray-50/50'>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className='px-4 py-3 text-left font-medium text-gray-900'
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className='px-4 py-12 text-center'>
                    <div className='flex items-center justify-center gap-2 text-gray-500'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400'></div>
                      로딩 중...
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className='px-4 py-12 text-center text-gray-500'>
                    거래 내역이 없습니다
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className='border-b hover:bg-gray-50/50 transition-colors'>
                    {row.getVisibleCells().map(cell => (
                      <td
                        key={cell.id}
                        className='px-4 py-3'
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {pagination && (
          <div className='flex items-center justify-between px-4 py-4 bg-gray-50/50 border-t'>
            <div className='text-sm text-gray-700'>
              {pagination.page}페이지 / 총 {pagination.totalPages}페이지
              {totalCount > 0 && (
                <span className='ml-2'>
                  ({((pagination.page - 1) * pagination.limit + 1).toLocaleString()}-
                  {Math.min(pagination.page * pagination.limit, totalCount).toLocaleString()} /{' '}
                  {totalCount.toLocaleString()}건)
                </span>
              )}
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  onPaginationChange?.({
                    pageIndex: 0,
                    pageSize: pagination.limit,
                  })
                }
                disabled={!pagination.hasPrev}
              >
                <ChevronsLeft className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  onPaginationChange?.({
                    pageIndex: pagination.page - 2,
                    pageSize: pagination.limit,
                  })
                }
                disabled={!pagination.hasPrev}
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  onPaginationChange?.({
                    pageIndex: pagination.page,
                    pageSize: pagination.limit,
                  })
                }
                disabled={!pagination.hasNext}
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  onPaginationChange?.({
                    pageIndex: pagination.totalPages - 1,
                    pageSize: pagination.limit,
                  })
                }
                disabled={!pagination.hasNext}
              >
                <ChevronsRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
