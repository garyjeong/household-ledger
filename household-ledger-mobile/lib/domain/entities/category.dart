import 'transaction.dart';

class Category {
  final int id;
  final int? groupId;
  final int createdBy;
  final String name;
  final TransactionType type;
  final String? color;
  final bool isDefault;
  final int? budgetAmount;
  final DateTime createdAt;
  final DateTime updatedAt;

  Category({
    required this.id,
    this.groupId,
    required this.createdBy,
    required this.name,
    required this.type,
    this.color,
    required this.isDefault,
    this.budgetAmount,
    required this.createdAt,
    required this.updatedAt,
  });

  Category copyWith({
    int? id,
    int? groupId,
    int? createdBy,
    String? name,
    TransactionType? type,
    String? color,
    bool? isDefault,
    int? budgetAmount,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Category(
      id: id ?? this.id,
      groupId: groupId ?? this.groupId,
      createdBy: createdBy ?? this.createdBy,
      name: name ?? this.name,
      type: type ?? this.type,
      color: color ?? this.color,
      isDefault: isDefault ?? this.isDefault,
      budgetAmount: budgetAmount ?? this.budgetAmount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

