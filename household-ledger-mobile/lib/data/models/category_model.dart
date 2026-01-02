import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/category.dart';
import '../../domain/entities/transaction.dart';

part 'category_model.g.dart';

@JsonSerializable()
class CategoryModel {
  final int id;
  @JsonKey(name: 'group_id')
  final int? groupId;
  @JsonKey(name: 'created_by')
  final int createdBy;
  final String name;
  final String type; // "EXPENSE", "INCOME", "TRANSFER"
  final String? color;
  @JsonKey(name: 'is_default')
  final bool isDefault;
  @JsonKey(name: 'budget_amount')
  final int? budgetAmount;
  @JsonKey(name: 'created_at')
  final String createdAt;
  @JsonKey(name: 'updated_at')
  final String updatedAt;

  CategoryModel({
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

  factory CategoryModel.fromJson(Map<String, dynamic> json) =>
      _$CategoryModelFromJson(json);

  Map<String, dynamic> toJson() => _$CategoryModelToJson(this);

  Category toEntity() {
    return Category(
      id: id,
      groupId: groupId,
      createdBy: createdBy,
      name: name,
      type: _parseTransactionType(type),
      color: color,
      isDefault: isDefault,
      budgetAmount: budgetAmount,
      createdAt: DateTime.parse(createdAt),
      updatedAt: DateTime.parse(updatedAt),
    );
  }

  factory CategoryModel.fromEntity(Category category) {
    return CategoryModel(
      id: category.id,
      groupId: category.groupId,
      createdBy: category.createdBy,
      name: category.name,
      type: _transactionTypeToString(category.type),
      color: category.color,
      isDefault: category.isDefault,
      budgetAmount: category.budgetAmount,
      createdAt: category.createdAt.toIso8601String(),
      updatedAt: category.updatedAt.toIso8601String(),
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

