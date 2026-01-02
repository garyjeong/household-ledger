class User {
  final int id;
  final String email;
  final String nickname;
  final String? avatarUrl;
  final int? groupId;
  final String? defaultCurrency;
  final Map<String, dynamic>? settings;
  final DateTime createdAt;

  User({
    required this.id,
    required this.email,
    required this.nickname,
    this.avatarUrl,
    this.groupId,
    this.defaultCurrency,
    this.settings,
    required this.createdAt,
  });

  User copyWith({
    int? id,
    String? email,
    String? nickname,
    String? avatarUrl,
    int? groupId,
    String? defaultCurrency,
    Map<String, dynamic>? settings,
    DateTime? createdAt,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      nickname: nickname ?? this.nickname,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      groupId: groupId ?? this.groupId,
      defaultCurrency: defaultCurrency ?? this.defaultCurrency,
      settings: settings ?? this.settings,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

