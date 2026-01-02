class AppConfig {
  // API 설정
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8080',
  );

  static const String apiVersion = 'v2';
  static String get apiBaseUrl => '$baseUrl/api/$apiVersion';

  // WebSocket 설정
  static String get websocketUrl => baseUrl.replaceFirst('http', 'ws');

  // SSE 설정
  static String get sseUrl => '$baseUrl/api/$apiVersion/sse/events';

  // 앱 설정
  static const String appName = 'Household Ledger';
  static const String appVersion = '1.0.0';

  // 로컬 스토리지 키
  static const String keyAccessToken = 'access_token';
  static const String keyRefreshToken = 'refresh_token';
  static const String keyUser = 'user';
  static const String keySettings = 'settings';
}

