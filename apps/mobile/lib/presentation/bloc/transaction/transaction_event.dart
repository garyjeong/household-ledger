import 'package:equatable/equatable.dart';
import '../../../domain/entities/transaction.dart';

abstract class TransactionEvent extends Equatable {
  const TransactionEvent();

  @override
  List<Object?> get props => [];
}

class LoadTransactions extends TransactionEvent {
  final int? groupId;
  final DateTime? startDate;
  final DateTime? endDate;
  final int? categoryId;
  final String? search;
  final int limit;
  final int offset;

  const LoadTransactions({
    this.groupId,
    this.startDate,
    this.endDate,
    this.categoryId,
    this.search,
    this.limit = 50,
    this.offset = 0,
  });

  @override
  List<Object?> get props =>
      [groupId, startDate, endDate, categoryId, search, limit, offset];
}

class CreateTransaction extends TransactionEvent {
  final Transaction transaction;

  const CreateTransaction({required this.transaction});

  @override
  List<Object?> get props => [transaction];
}

class UpdateTransaction extends TransactionEvent {
  final Transaction transaction;

  const UpdateTransaction({required this.transaction});

  @override
  List<Object?> get props => [transaction];
}

class DeleteTransaction extends TransactionEvent {
  final int id;

  const DeleteTransaction({required this.id});

  @override
  List<Object?> get props => [id];
}

class QuickAddTransaction extends TransactionEvent {
  final int amount;
  final TransactionType type;
  final DateTime date;
  final String? categoryName;
  final String? merchant;

  const QuickAddTransaction({
    required this.amount,
    required this.type,
    required this.date,
    this.categoryName,
    this.merchant,
  });

  @override
  List<Object?> get props => [amount, type, date, categoryName, merchant];
}

