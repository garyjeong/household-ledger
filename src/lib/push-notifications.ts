/**
 * 푸시 알림 관련 유틸리티 함수
 * T-026: 설정 하위 메뉴 - 프로필 관리 (알림 설정)
 */

// PushSubscription type is available globally in Service Worker context
interface CustomPushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

// VAPID Public Key (환경 변수로 설정 권장)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY'

/**
 * 브라우저 알림 지원 여부 확인
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}

/**
 * 현재 알림 권한 상태 확인
 */
export function getNotificationPermission(): NotificationPermission | null {
  if (!isNotificationSupported()) return null
  return Notification.permission
}

/**
 * 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    throw new Error('이 브라우저는 푸시 알림을 지원하지 않습니다')
  }

  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (error) {
    console.error('알림 권한 요청 실패:', error)
    throw new Error('알림 권한 요청에 실패했습니다')
  }
}

/**
 * Service Worker 등록
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!isNotificationSupported()) {
    throw new Error('이 브라우저는 Service Worker를 지원하지 않습니다')
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    // console.log('Service Worker 등록 성공:', registration)
    return registration
  } catch (error) {
    console.error('Service Worker 등록 실패:', error)
    throw new Error('Service Worker 등록에 실패했습니다')
  }
}

/**
 * 푸시 구독 생성
 */
export async function createPushSubscription(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription> {
  try {
    // VAPID 공개 키를 Uint8Array로 변환
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
    })

    // console.log('푸시 구독 생성 성공:', subscription)
    return subscription
  } catch (error) {
    console.error('푸시 구독 생성 실패:', error)
    throw new Error('푸시 구독 생성에 실패했습니다')
  }
}

/**
 * 기존 푸시 구독 조회
 */
export async function getPushSubscription(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.getSubscription()
    return subscription
  } catch (error) {
    console.error('푸시 구독 조회 실패:', error)
    return null
  }
}

/**
 * 푸시 구독 해제
 */
export async function unsubscribePush(subscription: PushSubscription): Promise<boolean> {
  try {
    const result = await subscription.unsubscribe()
    // console.log('푸시 구독 해제:', result)
    return result
  } catch (error) {
    console.error('푸시 구독 해제 실패:', error)
    return false
  }
}

/**
 * PushSubscription을 서버에서 사용할 수 있는 형태로 변환
 */
export function subscriptionToCustomFormat(subscription: PushSubscription): CustomPushSubscription {
  const p256dh = subscription.getKey('p256dh')
  const auth = subscription.getKey('auth')

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: p256dh ? arrayBufferToBase64(p256dh) : '',
      auth: auth ? arrayBufferToBase64(auth) : '',
    },
  }
}

/**
 * 전체 푸시 알림 설정 프로세스
 */
export async function setupPushNotifications(): Promise<{
  registration: ServiceWorkerRegistration
  subscription: CustomPushSubscription
}> {
  // 1. 알림 지원 여부 확인
  if (!isNotificationSupported()) {
    throw new Error('이 브라우저는 푸시 알림을 지원하지 않습니다')
  }

  // 2. 알림 권한 확인/요청
  let permission = getNotificationPermission()
  if (permission === 'default') {
    permission = await requestNotificationPermission()
  }

  if (permission !== 'granted') {
    throw new Error('알림 권한이 거부되었습니다')
  }

  // 3. Service Worker 등록
  const registration = await registerServiceWorker()

  // 4. 기존 구독 확인
  let pushSubscription = await getPushSubscription(registration)

  // 5. 구독이 없으면 새로 생성
  if (!pushSubscription) {
    pushSubscription = await createPushSubscription(registration)
  }

  // 6. 사용자 정의 형태로 변환
  const customSubscription = subscriptionToCustomFormat(pushSubscription)

  return {
    registration,
    subscription: customSubscription,
  }
}

/**
 * 푸시 알림 완전 해제
 */
export async function disablePushNotifications(): Promise<void> {
  if (!isNotificationSupported()) {
    return
  }

  try {
    // Service Worker 등록 조회
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) {
      return
    }

    // 푸시 구독 조회 및 해제
    const subscription = await getPushSubscription(registration)
    if (subscription) {
      await unsubscribePush(subscription)
    }

    // console.log('푸시 알림이 완전히 해제되었습니다')
  } catch (error) {
    console.error('푸시 알림 해제 실패:', error)
    throw new Error('푸시 알림 해제에 실패했습니다')
  }
}

/**
 * Base64 URL 문자열을 Uint8Array로 변환
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = (typeof window !== 'undefined' ? window.atob : global.atob || atob)(base64)
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length))

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * ArrayBuffer를 Base64 문자열로 변환
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

/**
 * 테스트 알림 표시
 */
export function showTestNotification(title = '알림 테스트', options: NotificationOptions = {}) {
  if (!isNotificationSupported()) {
    throw new Error('이 브라우저는 알림을 지원하지 않습니다')
  }

  if (getNotificationPermission() !== 'granted') {
    throw new Error('알림 권한이 필요합니다')
  }

  const defaultOptions: NotificationOptions = {
    body: '푸시 알림이 정상적으로 작동합니다.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'test-notification',
    requireInteraction: false,
    ...options,
  }

  try {
    const notification = new Notification(title, defaultOptions)

    // 3초 후 자동 닫기
    setTimeout(() => {
      notification.close()
    }, 3000)

    return notification
  } catch (error) {
    console.error('테스트 알림 표시 실패:', error)
    throw new Error('알림 표시에 실패했습니다')
  }
}
