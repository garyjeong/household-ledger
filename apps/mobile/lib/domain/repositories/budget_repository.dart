import '../entities/budget.dart';

abstract class BudgetRepository {
  Future<List<Budget>> getBudgets({
    OwnerType? ownerType,
    int? ownerId,
    String? period,
  });

  Future<Budget> getBudget(int id);

  Future<Budget> createBudget(Budget budget);

  Future<Budget> updateBudget(Budget budget);

  Future<void> deleteBudget(int id);
}

