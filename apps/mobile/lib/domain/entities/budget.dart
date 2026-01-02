enum OwnerType {
  user,
  group,
}

enum BudgetStatus {
  active,
  closed,
  draft,
}

class Budget {
  final int id;
  final OwnerType ownerType;
  final int ownerId;
  final String period; // YYYY-MM
  final int totalAmount;
  final BudgetStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;

  Budget({
    required this.id,
    required this.ownerType,
    required this.ownerId,
    required this.period,
    required this.totalAmount,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  Budget copyWith({
    int? id,
    OwnerType? ownerType,
    int? ownerId,
    String? period,
    int? totalAmount,
    BudgetStatus? status,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Budget(
      id: id ?? this.id,
      ownerType: ownerType ?? this.ownerType,
      ownerId: ownerId ?? this.ownerId,
      period: period ?? this.period,
      totalAmount: totalAmount ?? this.totalAmount,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

