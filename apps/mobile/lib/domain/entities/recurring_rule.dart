enum RecurringFrequency {
  monthly,
  weekly,
  daily,
}

class RecurringRule {
  final int id;
  final int? groupId;
  final int createdBy;
  final DateTime startDate;
  final RecurringFrequency frequency;
  final String dayRule;
  final int amount;
  final int? categoryId;
  final String? merchant;
  final String? memo;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  RecurringRule({
    required this.id,
    this.groupId,
    required this.createdBy,
    required this.startDate,
    required this.frequency,
    required this.dayRule,
    required this.amount,
    this.categoryId,
    this.merchant,
    this.memo,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  RecurringRule copyWith({
    int? id,
    int? groupId,
    int? createdBy,
    DateTime? startDate,
    RecurringFrequency? frequency,
    String? dayRule,
    int? amount,
    int? categoryId,
    String? merchant,
    String? memo,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return RecurringRule(
      id: id ?? this.id,
      groupId: groupId ?? this.groupId,
      createdBy: createdBy ?? this.createdBy,
      startDate: startDate ?? this.startDate,
      frequency: frequency ?? this.frequency,
      dayRule: dayRule ?? this.dayRule,
      amount: amount ?? this.amount,
      categoryId: categoryId ?? this.categoryId,
      merchant: merchant ?? this.merchant,
      memo: memo ?? this.memo,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

