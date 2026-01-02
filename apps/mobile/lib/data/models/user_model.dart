import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/user.dart';

part 'user_model.g.dart';

@JsonSerializable()
class UserModel {
  final int id;
  final String email;
  final String nickname;
  @JsonKey(name: 'avatar_url')
  final String? avatarUrl;
  @JsonKey(name: 'group_id')
  final int? groupId;
  @JsonKey(name: 'default_currency')
  final String? defaultCurrency;
  final Map<String, dynamic>? settings;
  @JsonKey(name: 'created_at')
  final String createdAt;

  UserModel({
    required this.id,
    required this.email,
    required this.nickname,
    this.avatarUrl,
    this.groupId,
    this.defaultCurrency,
    this.settings,
    required this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);

  Map<String, dynamic> toJson() => _$UserModelToJson(this);

  User toEntity() {
    return User(
      id: id,
      email: email,
      nickname: nickname,
      avatarUrl: avatarUrl,
      groupId: groupId,
      defaultCurrency: defaultCurrency,
      settings: settings,
      createdAt: DateTime.parse(createdAt),
    );
  }

  factory UserModel.fromEntity(User user) {
    return UserModel(
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      groupId: user.groupId,
      defaultCurrency: user.defaultCurrency,
      settings: user.settings,
      createdAt: user.createdAt.toIso8601String(),
    );
  }
}

