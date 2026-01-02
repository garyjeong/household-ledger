import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class LoginEvent extends AuthEvent {
  final String email;
  final String password;

  const LoginEvent({
    required this.email,
    required this.password,
  });

  @override
  List<Object?> get props => [email, password];
}

class SignupEvent extends AuthEvent {
  final String email;
  final String password;
  final String nickname;
  final String? inviteCode;

  const SignupEvent({
    required this.email,
    required this.password,
    required this.nickname,
    this.inviteCode,
  });

  @override
  List<Object?> get props => [email, password, nickname, inviteCode];
}

class LogoutEvent extends AuthEvent {
  const LogoutEvent();
}

class RefreshTokenEvent extends AuthEvent {
  final String refreshToken;

  const RefreshTokenEvent({required this.refreshToken});

  @override
  List<Object?> get props => [refreshToken];
}

class CheckAuthEvent extends AuthEvent {
  const CheckAuthEvent();
}

