import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:json_annotation/json_annotation.dart';
import '../../../config/app_config.dart';
import '../models/user_model.dart';

part 'auth_api.g.dart';

@RestApi(baseUrl: AppConfig.apiBaseUrl)
abstract class AuthApi {
  factory AuthApi(Dio dio, {String baseUrl}) = _AuthApi;

  @POST('/auth/signup')
  Future<AuthResponse> signup(@Body() SignupRequest request);

  @POST('/auth/login')
  Future<AuthResponse> login(@Body() LoginRequest request);

  @POST('/auth/refresh')
  Future<RefreshTokenResponse> refreshToken(@Body() RefreshTokenRequest request);
}

class SignupRequest {
  final String email;
  final String password;
  final String nickname;
  @JsonKey(name: 'invite_code')
  final String? inviteCode;

  SignupRequest({
    required this.email,
    required this.password,
    required this.nickname,
    this.inviteCode,
  });

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
        'nickname': nickname,
        if (inviteCode != null) 'invite_code': inviteCode,
      };
}

class LoginRequest {
  final String email;
  final String password;

  LoginRequest({
    required this.email,
    required this.password,
  });

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
      };
}

class RefreshTokenRequest {
  @JsonKey(name: 'refresh_token')
  final String refreshToken;

  RefreshTokenRequest({required this.refreshToken});

  Map<String, dynamic> toJson() => {
        'refresh_token': refreshToken,
      };
}

class AuthResponse {
  final UserModel user;
  @JsonKey(name: 'access_token')
  final String accessToken;
  @JsonKey(name: 'refresh_token')
  final String refreshToken;

  AuthResponse({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) =>
      AuthResponse(
        user: UserModel.fromJson(json['user']),
        accessToken: json['access_token'],
        refreshToken: json['refresh_token'],
      );
}

class RefreshTokenResponse {
  @JsonKey(name: 'access_token')
  final String accessToken;

  RefreshTokenResponse({required this.accessToken});

  factory RefreshTokenResponse.fromJson(Map<String, dynamic> json) =>
      RefreshTokenResponse(accessToken: json['access_token']);
}

