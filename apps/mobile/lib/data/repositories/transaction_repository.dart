import '../../domain/entities/transaction.dart';
import '../../domain/repositories/transaction_repository.dart' as domain;
import '../datasources/remote/transaction_api.dart';
import '../../core/errors/app_exceptions.dart';
import '../models/transaction_model.dart';

class TransactionRepositoryImpl implements domain.TransactionRepository {
  final TransactionApi _transactionApi;

  TransactionRepositoryImpl({required TransactionApi transactionApi})
      : _transactionApi = transactionApi;

  @override
  Future<List<Transaction>> getTransactions({
    int? groupId,
    DateTime? startDate,
    DateTime? endDate,
    int? categoryId,
    String? search,
    int limit = 50,
    int offset = 0,
  }) async {
    try {
      final response = await _transactionApi.getTransactions(
        groupId,
        startDate?.toIso8601String().split('T')[0],
        endDate?.toIso8601String().split('T')[0],
        categoryId,
        search,
        limit,
        offset,
      );
      return response.items.map((e) => e.toEntity()).toList();
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('거래 목록 조회에 실패했습니다: $e');
    }
  }

  @override
  Future<Transaction> getTransaction(int id) async {
    try {
      final response = await _transactionApi.getTransaction(id);
      return response.transaction.toEntity();
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('거래 조회에 실패했습니다: $e');
    }
  }

  @override
  Future<Transaction> createTransaction(Transaction transaction) async {
    try {
      final request = TransactionCreateRequest(
        groupId: transaction.groupId,
        amount: transaction.amount,
        currencyCode: transaction.currencyCode,
        originalAmount: transaction.originalAmount,
        categoryId: transaction.categoryId,
        tagId: transaction.tagId,
        merchant: transaction.merchant,
        memo: transaction.memo,
        type: _transactionTypeToString(transaction.type),
        date: transaction.date.toIso8601String().split('T')[0],
      );
      final response = await _transactionApi.createTransaction(request);
      return response.transaction.toEntity();
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('거래 생성에 실패했습니다: $e');
    }
  }

  @override
  Future<Transaction> updateTransaction(Transaction transaction) async {
    try {
      final request = TransactionCreateRequest(
        groupId: transaction.groupId,
        amount: transaction.amount,
        currencyCode: transaction.currencyCode,
        originalAmount: transaction.originalAmount,
        categoryId: transaction.categoryId,
        tagId: transaction.tagId,
        merchant: transaction.merchant,
        memo: transaction.memo,
        type: _transactionTypeToString(transaction.type),
        date: transaction.date.toIso8601String().split('T')[0],
      );
      final response = await _transactionApi.updateTransaction(
        transaction.id,
        request,
      );
      return response.transaction.toEntity();
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('거래 수정에 실패했습니다: $e');
    }
  }

  @override
  Future<void> deleteTransaction(int id) async {
    try {
      await _transactionApi.deleteTransaction(id);
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('거래 삭제에 실패했습니다: $e');
    }
  }

  @override
  Future<Transaction> quickAddTransaction({
    required int amount,
    required TransactionType type,
    required DateTime date,
    String? categoryName,
    String? merchant,
  }) async {
    try {
      final request = QuickAddRequest(
        amount: amount,
        type: _transactionTypeToString(type),
        date: date.toIso8601String().split('T')[0],
        categoryName: categoryName,
        merchant: merchant,
      );
      final response = await _transactionApi.quickAddTransaction(request);
      return response.transaction.toEntity();
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('빠른 거래 추가에 실패했습니다: $e');
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

