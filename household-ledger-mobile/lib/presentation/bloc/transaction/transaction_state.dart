import 'package:equatable/equatable.dart';
import '../../../domain/entities/transaction.dart';

abstract class TransactionState extends Equatable {
  const TransactionState();

  @override
  List<Object?> get props => [];
}

class TransactionInitial extends TransactionState {
  const TransactionInitial();
}

class TransactionLoading extends TransactionState {
  const TransactionLoading();
}

class TransactionLoaded extends TransactionState {
  final List<Transaction> transactions;
  final bool hasMore;

  const TransactionLoaded({
    required this.transactions,
    this.hasMore = true,
  });

  @override
  List<Object?> get props => [transactions, hasMore];
}

class TransactionCreated extends TransactionState {
  final Transaction transaction;

  const TransactionCreated({required this.transaction});

  @override
  List<Object?> get props => [transaction];
}

class TransactionUpdated extends TransactionState {
  final Transaction transaction;

  const TransactionUpdated({required this.transaction});

  @override
  List<Object?> get props => [transaction];
}

class TransactionDeleted extends TransactionState {
  final int id;

  const TransactionDeleted({required this.id});

  @override
  List<Object?> get props => [id];
}

class TransactionError extends TransactionState {
  final String message;

  const TransactionError({required this.message});

  @override
  List<Object?> get props => [message];
}

