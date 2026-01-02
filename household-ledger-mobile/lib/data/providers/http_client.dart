import 'package:dio/dio.dart';
import '../../../config/app_config.dart';
import '../../../core/errors/app_exceptions.dart';
import '../datasources/local/local_storage.dart';

class HttpClient {
  late final Dio _dio;
  final LocalStorage _localStorage;

  HttpClient(this._localStorage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _setupInterceptors();
  }

  void _setupInterceptors() {
    // 인증 인터셉터
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Access Token 자동 추가
          final token = _localStorage.getAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          // 401 에러 시 토큰 갱신 시도
          if (error.response?.statusCode == 401) {
            try {
              final refreshToken = _localStorage.getRefreshToken();
              if (refreshToken != null) {
                // TODO: 토큰 갱신 API 호출
                // final newToken = await refreshToken(refreshToken);
                // _localStorage.saveAccessToken(newToken);
                // 원래 요청 재시도
                // return handler.resolve(await _retry(error.requestOptions));
              }
            } catch (e) {
              // 토큰 갱신 실패 시 로그아웃 처리
              await _localStorage.clearTokens();
              return handler.reject(error);
            }
          }
          return handler.next(error);
        },
      ),
    );

    // 에러 처리 인터셉터
    _dio.interceptors.add(
      InterceptorsWrapper(
        onError: (error, handler) {
          final exception = _handleError(error);
          return handler.reject(
            DioException(
              requestOptions: error.requestOptions,
              error: exception,
            ),
          );
        },
      ),
    );
  }

  AppException _handleError(DioException error) {
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout) {
      return NetworkException('연결 시간이 초과되었습니다');
    }

    if (error.type == DioExceptionType.connectionError) {
      return NetworkException('네트워크 연결을 확인해주세요');
    }

    final statusCode = error.response?.statusCode;
    final message = error.response?.data?['message'] as String? ??
        error.message ??
        '알 수 없는 오류가 발생했습니다';

    switch (statusCode) {
      case 400:
        return ValidationException(message);
      case 401:
        return AuthenticationException(message);
      case 404:
        return NotFoundException(message);
      case 500:
      case 502:
      case 503:
        return ServerException(message);
      default:
        return NetworkException(message, statusCode: statusCode);
    }
  }

  Dio get dio => _dio;
}

