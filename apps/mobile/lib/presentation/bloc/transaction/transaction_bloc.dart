import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../domain/repositories/transaction_repository.dart';
import 'transaction_event.dart';
import 'transaction_state.dart';

class TransactionBloc extends Bloc<TransactionEvent, TransactionState> {
  final TransactionRepository _repository;

  TransactionBloc({required TransactionRepository repository})
      : _repository = repository,
        super(const TransactionInitial()) {
    on<LoadTransactions>(_onLoadTransactions);
    on<CreateTransaction>(_onCreateTransaction);
    on<UpdateTransaction>(_onUpdateTransaction);
    on<DeleteTransaction>(_onDeleteTransaction);
    on<QuickAddTransaction>(_onQuickAddTransaction);
  }

  Future<void> _onLoadTransactions(
    LoadTransactions event,
    Emitter<TransactionState> emit,
  ) async {
    emit(const TransactionLoading());
    try {
      final transactions = await _repository.getTransactions(
        groupId: event.groupId,
        startDate: event.startDate,
        endDate: event.endDate,
        categoryId: event.categoryId,
        search: event.search,
        limit: event.limit,
        offset: event.offset,
      );
      emit(TransactionLoaded(
        transactions: transactions,
        hasMore: transactions.length >= event.limit,
      ));
    } catch (e) {
      emit(TransactionError(message: e.toString()));
    }
  }

  Future<void> _onCreateTransaction(
    CreateTransaction event,
    Emitter<TransactionState> emit,
  ) async {
    try {
      final transaction = await _repository.createTransaction(event.transaction);
      emit(TransactionCreated(transaction: transaction));
      // 거래 목록 새로고침
      add(const LoadTransactions());
    } catch (e) {
      emit(TransactionError(message: e.toString()));
    }
  }

  Future<void> _onUpdateTransaction(
    UpdateTransaction event,
    Emitter<TransactionState> emit,
  ) async {
    try {
      final transaction = await _repository.updateTransaction(event.transaction);
      emit(TransactionUpdated(transaction: transaction));
      // 거래 목록 새로고침
      add(const LoadTransactions());
    } catch (e) {
      emit(TransactionError(message: e.toString()));
    }
  }

  Future<void> _onDeleteTransaction(
    DeleteTransaction event,
    Emitter<TransactionState> emit,
  ) async {
    try {
      await _repository.deleteTransaction(event.id);
      emit(TransactionDeleted(id: event.id));
      // 거래 목록 새로고침
      add(const LoadTransactions());
    } catch (e) {
      emit(TransactionError(message: e.toString()));
    }
  }

  Future<void> _onQuickAddTransaction(
    QuickAddTransaction event,
    Emitter<TransactionState> emit,
  ) async {
    try {
      final transaction = await _repository.quickAddTransaction(
        amount: event.amount,
        type: event.type,
        date: event.date,
        categoryName: event.categoryName,
        merchant: event.merchant,
      );
      emit(TransactionCreated(transaction: transaction));
      // 거래 목록 새로고침
      add(const LoadTransactions());
    } catch (e) {
      emit(TransactionError(message: e.toString()));
    }
  }
}

