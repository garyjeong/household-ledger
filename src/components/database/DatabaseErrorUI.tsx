'use client'

import { useState } from 'react'
import { RefreshCw, Database, AlertTriangle, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  error?: string
  retryCount: number
  onRetry: () => void
}

/**
 * 데이터베이스 연결 실패 시 표시되는 에러 UI
 * Docker 컨테이너 실행 가이드와 문제 해결 방법을 제공
 */
export function DatabaseErrorUI({ error, retryCount, onRetry }: Props) {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

  // Docker 명령어 복사 핸들러
  const copyCommand = async (command: string, label: string) => {
    try {
      await navigator.clipboard.writeText(command)
      setCopiedCommand(label)
      setTimeout(() => setCopiedCommand(null), 2000)
    } catch (err) {
      console.error('Failed to copy command:', err)
    }
  }

  // Docker 관련 명령어들
  const dockerCommands = [
    {
      label: 'Docker 컨테이너 상태 확인',
      command: 'docker ps -a',
      description: '실행 중인 컨테이너 목록을 확인합니다.',
    },
    {
      label: 'MySQL 컨테이너 시작',
      command: 'docker-compose up -d database',
      description: 'MySQL 데이터베이스 컨테이너를 백그라운드에서 시작합니다.',
    },
    {
      label: '모든 서비스 시작',
      command: 'docker-compose up -d',
      description: '모든 Docker 서비스를 시작합니다.',
    },
    {
      label: 'Docker 로그 확인',
      command: 'docker-compose logs database',
      description: '데이터베이스 컨테이너의 로그를 확인합니다.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
        {/* 헤더 */}
        <div className="bg-red-500 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">데이터베이스 연결 실패</h1>
              <p className="text-red-100 text-sm">
                애플리케이션을 시작하기 전에 데이터베이스 연결이 필요합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* 에러 정보 */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-red-800 font-semibold mb-1">연결 오류 세부사항</h3>
                <p className="text-red-700 text-sm font-mono bg-red-100 rounded px-2 py-1">
                  {error || 'Unknown database connection error'}
                </p>
                {retryCount > 0 && (
                  <p className="text-red-600 text-sm mt-2">
                    재시도 횟수: {retryCount}회
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 해결 방법 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                🔧 문제 해결 방법
              </h2>
              
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-medium text-blue-800 mb-1">1. Docker 서비스 확인</h4>
                  <p className="text-blue-700 text-sm">
                    Docker Desktop이 실행 중인지 확인하고, MySQL 컨테이너 상태를 점검하세요.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h4 className="font-medium text-green-800 mb-1">2. 환경 변수 설정</h4>
                  <p className="text-green-700 text-sm">
                    DATABASE_URL 환경 변수가 올바르게 설정되어 있는지 확인하세요.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <h4 className="font-medium text-amber-800 mb-1">3. 네트워크 연결</h4>
                  <p className="text-amber-700 text-sm">
                    방화벽이나 네트워크 설정이 데이터베이스 포트(3306/3307)를 차단하지 않는지 확인하세요.
                  </p>
                </div>
              </div>
            </div>

            {/* Docker 명령어 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                🐳 Docker 명령어
              </h2>
              
              <div className="space-y-3">
                {dockerCommands.map((cmd, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-800 text-sm">
                        {cmd.label}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCommand(cmd.command, cmd.label)}
                        className="h-6 px-2"
                      >
                        {copiedCommand === cmd.label ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                    <code className="text-xs bg-gray-800 text-green-400 px-2 py-1 rounded block mb-1">
                      {cmd.command}
                    </code>
                    <p className="text-xs text-gray-600">{cmd.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 연결 정보 */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-2">💡 예상 데이터베이스 설정</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">호스트:</span>
                <span className="font-mono ml-2 text-gray-800">localhost</span>
              </div>
              <div>
                <span className="text-gray-600">포트:</span>
                <span className="font-mono ml-2 text-gray-800">3307</span>
              </div>
              <div>
                <span className="text-gray-600">데이터베이스:</span>
                <span className="font-mono ml-2 text-gray-800">household_ledger</span>
              </div>
              <div>
                <span className="text-gray-600">사용자:</span>
                <span className="font-mono ml-2 text-gray-800">user / root</span>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              문제가 해결된 후 아래 버튼을 클릭하세요.
            </div>
            <Button onClick={onRetry} className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>다시 연결 시도</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
