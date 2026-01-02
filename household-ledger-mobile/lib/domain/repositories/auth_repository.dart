import '../entities/user.dart';

abstract class AuthRepository {
  Future<User> signup({
    required String email,
    required String password,
    required String nickname,
    String? inviteCode,
  });

  Future<Map<String, String>> login({
    required String email,
    required String password,
  });

  Future<String> refreshToken(String refreshToken);

  Future<void> logout();

  Future<User?> getCurrentUser();
}

