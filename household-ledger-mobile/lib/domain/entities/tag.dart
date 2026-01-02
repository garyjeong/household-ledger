class Tag {
  final int id;
  final int? groupId;
  final int createdBy;
  final String name;
  final DateTime createdAt;
  final DateTime updatedAt;

  Tag({
    required this.id,
    this.groupId,
    required this.createdBy,
    required this.name,
    required this.createdAt,
    required this.updatedAt,
  });

  Tag copyWith({
    int? id,
    int? groupId,
    int? createdBy,
    String? name,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Tag(
      id: id ?? this.id,
      groupId: groupId ?? this.groupId,
      createdBy: createdBy ?? this.createdBy,
      name: name ?? this.name,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

