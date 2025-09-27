/**
 * Service Worker for Push Notifications
 * T-026: 설정 하위 메뉴 - 프로필 관리 (알림 설정)
 */

const CACHE_NAME = 'household-ledger-v4'
const NOTIFICATION_TAG = 'household-ledger-notification'

// 오프라인 프리캐시 자원 목록 (정적/공개 자원만 포함)
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/sw.js',
  '/favicon.ico',
  // static assets in public/
  '/file.svg',
  '/globe.svg',
  '/next.svg',
  '/vercel.svg',
  '/window.svg',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-512-maskable.png',
]

// Service Worker 설치
self.addEventListener('install', event => {
  // 기본 설치 단계: 즉시 활성화 대기 종료
  self.skipWaiting()
  // 프리캐시 수행
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .catch(() => {})
  )
})

// Service Worker 활성화
self.addEventListener('activate', event => {
  // 구 캐시 정리 및 즉시 제어권 획득
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
      // Navigation Preload 활성화(가능한 브라우저에서)
      if ('navigationPreload' in self.registration) {
        try {
          await self.registration.navigationPreload.enable()
        } catch (_e) {}
      }
      await self.clients.claim()
    })()
  )
})

// 네트워크 우선(HTML/문서), 캐시 우선(정적 파일) + S-W-R 전략
self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)

  // API는 캐시하지 않음
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // 문서(HTML) 요청: Network-first with navigation preload, 실패 시 캐시/오프라인 fallback
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.waitUntil((async () => undefined)())
    event.respondWith(
      (async () => {
        try {
          // Navigation preload 응답 사용(가능하면) → 아닐 경우 네트워크 페치
          const preload = event.preloadResponse ? await event.preloadResponse : undefined
          const fresh = preload || (await fetch(request))
          // 성공 시 캐시에 백그라운드로 저장
          const cache = await caches.open(CACHE_NAME)
          cache.put(request, fresh.clone())
          return fresh
        } catch (_err) {
          const cache = await caches.open(CACHE_NAME)
          const cached = await cache.match(request)
          if (cached) return cached
          // 최후 fallback: 루트 캐시 시도
          const root = await cache.match('/')
          // 오프라인 전용 간단한 문서 응답(Fallback)
          return (
            root ||
            new Response('<!doctype html><meta charset="utf-8" /><title>오프라인</title><style>body{font-family:sans-serif;padding:24px;line-height:1.6}</style><h1>오프라인 상태</h1><p>네트워크에 연결되지 않았습니다.</p><p>기본 페이지는 오프라인에서 제한적으로 표시될 수 있습니다.</p>', {
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            })
          )
        }
      })()
    )
    return
  }

  // 정적 자산: Stale-While-Revalidate
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.webp')
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME)
        const cached = await cache.match(request)
        const fetchPromise = fetch(request)
          .then(response => {
            // 성공한 응답만 캐시 저장
            if (response && response.status === 200) {
              cache.put(request, response.clone())
            }
            return response
          })
          .catch(() => cached || Promise.reject(new Error('offline')))
        return cached || fetchPromise
      })()
    )
  }
})

// 푸시 이벤트 처리
self.addEventListener('push', event => {
  // 푸시 메시지 수신

  let notificationData = {
    title: '우리집 가계부',
    body: '새로운 알림이 있습니다.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: NOTIFICATION_TAG,
    requireInteraction: false,
    // 액션 아이콘은 리소스 누락으로 제거
    actions: [
      { action: 'open', title: '확인' },
      { action: 'close', title: '닫기' },
    ],
    data: {
      url: '/',
      timestamp: Date.now(),
    },
  }

  // 푸시 데이터가 있으면 파싱
  if (event.data) {
    try {
      const pushData = event.data.json()
      notificationData = {
        ...notificationData,
        ...pushData,
      }
    } catch (error) {
      console.error('푸시 데이터 파싱 실패:', error)
      // 텍스트 데이터인 경우
      notificationData.body = event.data.text() || notificationData.body
    }
  }

  const promiseChain = self.registration.showNotification(notificationData.title, notificationData)

  event.waitUntil(promiseChain)
})

// 알림 클릭 이벤트 처리
self.addEventListener('notificationclick', event => {
  // 알림 클릭됨

  const notification = event.notification
  const action = event.action

  if (action === 'close') {
    notification.close()
    return
  }

  // 기본 동작 또는 'open' 액션
  const urlToOpen = notification.data?.url || '/'

  const promiseChain = clients
    .matchAll({
      type: 'window',
      includeUncontrolled: true,
    })
    .then(clientList => {
      // 이미 열린 탭이 있는지 확인
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: notification.data,
          })
          return client.focus()
        }
      }

      // 새 탭 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })

  notification.close()
  event.waitUntil(promiseChain)
})

// 알림 닫기 이벤트 처리
self.addEventListener('notificationclose', event => {
  // 알림 닫힘

  // 분석을 위한 이벤트 추적
  if (self.analytics) {
    self.analytics.track('notification_dismissed', {
      tag: event.notification.tag,
      timestamp: Date.now(),
    })
  }
})

// 백그라운드 동기화 (옵션)
self.addEventListener('sync', event => {
  // 백그라운드 동기화

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

// 백그라운드 동기화 함수
async function doBackgroundSync() {
  try {
    // 오프라인 상태에서 수집된 데이터 동기화
    // 백그라운드 동기화 실행
    // 실제 동기화 로직은 여기에 구현
    // 예: 오프라인 상태에서 입력된 거래 데이터 업로드
  } catch (error) {
    console.error('백그라운드 동기화 실패:', error)
  }
}

// 메시지 처리 (앱과의 통신)
self.addEventListener('message', event => {
  // Service Worker 메시지 수신

  const { type, data: _data } = event.data

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME })
      break
    case 'CLEAR_CACHES':
      event.waitUntil(
        (async () => {
          const keys = await caches.keys()
          await Promise.all(keys.map(k => caches.delete(k)))
        })()
      )
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ cleared: true })
      }
      break
    case 'PRECACHE':
      event.waitUntil(
        caches
          .open(CACHE_NAME)
          .then(cache => cache.addAll(PRECACHE_URLS))
          .catch(() => {})
      )
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ precached: true })
      }
      break
    case 'UPDATE_NOTIFICATION_TOKEN':
      // 알림 토큰 업데이트 처리
      // 알림 토큰 업데이트
      break
    default:
    // 알 수 없는 메시지 타입
  }
})
