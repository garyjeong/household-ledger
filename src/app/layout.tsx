import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { SWRConfig } from 'swr'
import { AuthProvider } from '@/contexts/auth-context'
import { GroupProvider } from '@/contexts/group-context'
import { AlertProvider } from '@/contexts/alert-context'
import { SentryTestComponent } from '@/components/error/SentryTestComponent'
import { WebVitalsReporter } from '@/components/performance/WebVitalsReporter'
import { swrConfig } from '@/lib/swr-config'

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
      <body className={`${jetbrainsMono.variable} antialiased font-sans`}>
        <SWRConfig value={swrConfig}>
          <AlertProvider>
            <AuthProvider>
              <GroupProvider>{children}</GroupProvider>
            </AuthProvider>
          </AlertProvider>
        </SWRConfig>
        <WebVitalsReporter />
        {process.env.NODE_ENV === 'development' && <SentryTestComponent />}
      </body>
    </html>
  )
}
