import '../entities/category.dart';
import '../entities/transaction.dart';

abstract class CategoryRepository {
  Future<List<Category>> getCategories({
    int? groupId,
    TransactionType? type,
  });

  Future<Category> getCategory(int id);

  Future<Category> createCategory(Category category);

  Future<Category> updateCategory(Category category);

  Future<void> deleteCategory(int id);
}

