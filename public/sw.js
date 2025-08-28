/**
 * Service Worker for Push Notifications
 * T-026: 설정 하위 메뉴 - 프로필 관리 (알림 설정)
 */

const CACHE_NAME = 'household-ledger-v1'
const NOTIFICATION_TAG = 'household-ledger-notification'

// Service Worker 설치
self.addEventListener('install', _event => {
  // Service Worker 설치됨
  self.skipWaiting()
})

// Service Worker 활성화
self.addEventListener('activate', event => {
  // Service Worker 활성화됨
  event.waitUntil(self.clients.claim())
})

// 푸시 이벤트 처리
self.addEventListener('push', event => {
  // 푸시 메시지 수신

  let notificationData = {
    title: '우리집 가계부',
    body: '새로운 알림이 있습니다.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: NOTIFICATION_TAG,
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: '확인',
        icon: '/icons/action-open.png',
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icons/action-close.png',
      },
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
    case 'UPDATE_NOTIFICATION_TOKEN':
      // 알림 토큰 업데이트 처리
      // 알림 토큰 업데이트
      break
    default:
    // 알 수 없는 메시지 타입
  }
})
