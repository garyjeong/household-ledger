import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart' as domain;
import '../datasources/remote/auth_api.dart';
import '../datasources/local/local_storage.dart';
import '../../core/errors/app_exceptions.dart';

class AuthRepositoryImpl implements domain.AuthRepository {
  final AuthApi _authApi;
  final LocalStorage _localStorage;

  AuthRepositoryImpl({
    required AuthApi authApi,
    required LocalStorage localStorage,
  })  : _authApi = authApi,
        _localStorage = localStorage;

  @override
  Future<User> signup({
    required String email,
    required String password,
    required String nickname,
    String? inviteCode,
  }) async {
    try {
      final request = SignupRequest(
        email: email,
        password: password,
        nickname: nickname,
        inviteCode: inviteCode,
      );
      final response = await _authApi.signup(request);
      
      // 토큰 저장
      await _localStorage.saveAccessToken(response.accessToken);
      await _localStorage.saveRefreshToken(response.refreshToken);
      
      return response.user.toEntity();
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('회원가입에 실패했습니다: $e');
    }
  }

  @override
  Future<Map<String, String>> login({
    required String email,
    required String password,
  }) async {
    try {
      final request = LoginRequest(email: email, password: password);
      final response = await _authApi.login(request);
      
      // 토큰 저장
      await _localStorage.saveAccessToken(response.accessToken);
      await _localStorage.saveRefreshToken(response.refreshToken);
      
      return {
        'access_token': response.accessToken,
        'refresh_token': response.refreshToken,
      };
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('로그인에 실패했습니다: $e');
    }
  }

  @override
  Future<String> refreshToken(String refreshToken) async {
    try {
      final request = RefreshTokenRequest(refreshToken: refreshToken);
      final response = await _authApi.refreshToken(request);
      
      await _localStorage.saveAccessToken(response.accessToken);
      
      return response.accessToken;
    } catch (e) {
      if (e is AppException) rethrow;
      throw AuthenticationException('토큰 갱신에 실패했습니다: $e');
    }
  }

  @override
  Future<void> logout() async {
    await _localStorage.clearTokens();
    await _localStorage.clearUser();
  }

  @override
  Future<User?> getCurrentUser() async {
    final userData = _localStorage.getUser();
    if (userData == null) return null;
    // TODO: JSON 파싱 구현
    return null;
  }
}

