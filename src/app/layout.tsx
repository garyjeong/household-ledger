import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { GroupProvider } from '@/contexts/group-context'
import { AlertProvider } from '@/contexts/alert-context'
import { SettingsProvider } from '@/contexts/settings-context'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ToastProvider } from '@/components/error/ToastProvider'

import { WebVitalsReporter } from '@/components/performance/WebVitalsReporter'

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: '우리집 가계부',
  description: '개인 및 그룹 가계부 관리 시스템',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='ko'>
      <body className={`${jetbrainsMono.variable} antialiased font-sans`} suppressHydrationWarning>
        <QueryProvider>
          <ToastProvider>
            <AlertProvider>
              <AuthProvider>
                <SettingsProvider>
                  <GroupProvider>{children}</GroupProvider>
                </SettingsProvider>
              </AuthProvider>
            </AlertProvider>
          </ToastProvider>
        </QueryProvider>
        <WebVitalsReporter />
      </body>
    </html>
  )
}
