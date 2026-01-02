enum TransactionType {
  expense,
  income,
  transfer,
}

class Transaction {
  final int id;
  final int? groupId;
  final int ownerUserId;
  final TransactionType type;
  final DateTime date;
  final int amount;
  final String? currencyCode;
  final int? originalAmount;
  final int? categoryId;
  final int? tagId;
  final int? recurringRuleId;
  final int? receiptId;
  final String? merchant;
  final String? memo;
  final DateTime createdAt;
  final DateTime updatedAt;

  Transaction({
    required this.id,
    this.groupId,
    required this.ownerUserId,
    required this.type,
    required this.date,
    required this.amount,
    this.currencyCode,
    this.originalAmount,
    this.categoryId,
    this.tagId,
    this.recurringRuleId,
    this.receiptId,
    this.merchant,
    this.memo,
    required this.createdAt,
    required this.updatedAt,
  });

  Transaction copyWith({
    int? id,
    int? groupId,
    int? ownerUserId,
    TransactionType? type,
    DateTime? date,
    int? amount,
    String? currencyCode,
    int? originalAmount,
    int? categoryId,
    int? tagId,
    int? recurringRuleId,
    int? receiptId,
    String? merchant,
    String? memo,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Transaction(
      id: id ?? this.id,
      groupId: groupId ?? this.groupId,
      ownerUserId: ownerUserId ?? this.ownerUserId,
      type: type ?? this.type,
      date: date ?? this.date,
      amount: amount ?? this.amount,
      currencyCode: currencyCode ?? this.currencyCode,
      originalAmount: originalAmount ?? this.originalAmount,
      categoryId: categoryId ?? this.categoryId,
      tagId: tagId ?? this.tagId,
      recurringRuleId: recurringRuleId ?? this.recurringRuleId,
      receiptId: receiptId ?? this.receiptId,
      merchant: merchant ?? this.merchant,
      memo: memo ?? this.memo,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

