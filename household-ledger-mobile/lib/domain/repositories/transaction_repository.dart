import '../entities/transaction.dart';

abstract class TransactionRepository {
  Future<List<Transaction>> getTransactions({
    int? groupId,
    DateTime? startDate,
    DateTime? endDate,
    int? categoryId,
    String? search,
    int limit = 50,
    int offset = 0,
  });

  Future<Transaction> getTransaction(int id);

  Future<Transaction> createTransaction(Transaction transaction);

  Future<Transaction> updateTransaction(Transaction transaction);

  Future<void> deleteTransaction(int id);

  Future<Transaction> quickAddTransaction({
    required int amount,
    required TransactionType type,
    required DateTime date,
    String? categoryName,
    String? merchant,
  });
}

