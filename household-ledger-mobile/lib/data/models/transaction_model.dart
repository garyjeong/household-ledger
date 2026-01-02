import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/transaction.dart';

part 'transaction_model.g.dart';

@JsonSerializable()
class TransactionModel {
  final int id;
  @JsonKey(name: 'group_id')
  final int? groupId;
  @JsonKey(name: 'owner_user_id')
  final int ownerUserId;
  final String type; // "EXPENSE", "INCOME", "TRANSFER"
  final String date;
  final int amount;
  @JsonKey(name: 'currency_code')
  final String? currencyCode;
  @JsonKey(name: 'original_amount')
  final int? originalAmount;
  @JsonKey(name: 'category_id')
  final int? categoryId;
  @JsonKey(name: 'tag_id')
  final int? tagId;
  @JsonKey(name: 'recurring_rule_id')
  final int? recurringRuleId;
  @JsonKey(name: 'receipt_id')
  final int? receiptId;
  final String? merchant;
  final String? memo;
  @JsonKey(name: 'created_at')
  final String createdAt;
  @JsonKey(name: 'updated_at')
  final String updatedAt;

  TransactionModel({
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

  factory TransactionModel.fromJson(Map<String, dynamic> json) =>
      _$TransactionModelFromJson(json);

  Map<String, dynamic> toJson() => _$TransactionModelToJson(this);

  Transaction toEntity() {
    return Transaction(
      id: id,
      groupId: groupId,
      ownerUserId: ownerUserId,
      type: _parseTransactionType(type),
      date: DateTime.parse(date),
      amount: amount,
      currencyCode: currencyCode,
      originalAmount: originalAmount,
      categoryId: categoryId,
      tagId: tagId,
      recurringRuleId: recurringRuleId,
      receiptId: receiptId,
      merchant: merchant,
      memo: memo,
      createdAt: DateTime.parse(createdAt),
      updatedAt: DateTime.parse(updatedAt),
    );
  }

  factory TransactionModel.fromEntity(Transaction transaction) {
    return TransactionModel(
      id: transaction.id,
      groupId: transaction.groupId,
      ownerUserId: transaction.ownerUserId,
      type: _transactionTypeToString(transaction.type),
      date: transaction.date.toIso8601String().split('T')[0],
      amount: transaction.amount,
      currencyCode: transaction.currencyCode,
      originalAmount: transaction.originalAmount,
      categoryId: transaction.categoryId,
      tagId: transaction.tagId,
      recurringRuleId: transaction.recurringRuleId,
      receiptId: transaction.receiptId,
      merchant: transaction.merchant,
      memo: transaction.memo,
      createdAt: transaction.createdAt.toIso8601String(),
      updatedAt: transaction.updatedAt.toIso8601String(),
    );
  }

  static TransactionType _parseTransactionType(String type) {
    switch (type.toUpperCase()) {
      case 'EXPENSE':
        return TransactionType.expense;
      case 'INCOME':
        return TransactionType.income;
      case 'TRANSFER':
        return TransactionType.transfer;
      default:
        return TransactionType.expense;
    }
  }

  static String _transactionTypeToString(TransactionType type) {
    switch (type) {
      case TransactionType.expense:
        return 'EXPENSE';
      case TransactionType.income:
        return 'INCOME';
      case TransactionType.transfer:
        return 'TRANSFER';
    }
  }
}

