import '../../domain/entities/category.dart';
import '../../domain/entities/transaction.dart';
import '../../domain/repositories/category_repository.dart' as domain;
import '../datasources/remote/category_api.dart';
import '../../core/errors/app_exceptions.dart';
import '../models/category_model.dart';

class CategoryRepositoryImpl implements domain.CategoryRepository {
  final CategoryApi _categoryApi;

  CategoryRepositoryImpl({required CategoryApi categoryApi})
      : _categoryApi = categoryApi;

  @override
  Future<List<Category>> getCategories({
    int? groupId,
    TransactionType? type,
  }) async {
    try {
      final categories = await _categoryApi.getCategories(
        groupId,
        type != null ? _transactionTypeToString(type) : null,
      );
      return categories.map((e) => e.toEntity()).toList();
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('카테고리 목록 조회에 실패했습니다: $e');
    }
  }

  @override
  Future<Category> getCategory(int id) async {
    try {
      final category = await _categoryApi.getCategory(id);
      return category.toEntity();
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('카테고리 조회에 실패했습니다: $e');
    }
  }

  @override
  Future<Category> createCategory(Category category) async {
    try {
      final request = CategoryCreateRequest(
        groupId: category.groupId,
        name: category.name,
        type: _transactionTypeToString(category.type),
        color: category.color,
        isDefault: category.isDefault,
        budgetAmount: category.budgetAmount,
      );
      final created = await _categoryApi.createCategory(request);
      return created.toEntity();
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('카테고리 생성에 실패했습니다: $e');
    }
  }

  @override
  Future<Category> updateCategory(Category category) async {
    try {
      final request = CategoryCreateRequest(
        groupId: category.groupId,
        name: category.name,
        type: _transactionTypeToString(category.type),
        color: category.color,
        isDefault: category.isDefault,
        budgetAmount: category.budgetAmount,
      );
      final updated = await _categoryApi.updateCategory(category.id, request);
      return updated.toEntity();
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('카테고리 수정에 실패했습니다: $e');
    }
  }

  @override
  Future<void> deleteCategory(int id) async {
    try {
      await _categoryApi.deleteCategory(id);
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('카테고리 삭제에 실패했습니다: $e');
    }
  }

  String _transactionTypeToString(TransactionType type) {
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

