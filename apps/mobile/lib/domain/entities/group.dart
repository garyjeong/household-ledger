class Group {
  final int id;
  final String name;
  final int ownerId;
  final DateTime createdAt;

  Group({
    required this.id,
    required this.name,
    required this.ownerId,
    required this.createdAt,
  });

  Group copyWith({
    int? id,
    String? name,
    int? ownerId,
    DateTime? createdAt,
  }) {
    return Group(
      id: id ?? this.id,
      name: name ?? this.name,
      ownerId: ownerId ?? this.ownerId,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

