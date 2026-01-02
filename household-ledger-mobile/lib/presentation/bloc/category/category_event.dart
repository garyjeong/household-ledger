import 'package:equatable/equatable.dart';
import '../../../domain/entities/category.dart';
import '../../../domain/entities/transaction.dart';

abstract class CategoryEvent extends Equatable {
  const CategoryEvent();

  @override
  List<Object?> get props => [];
}

class LoadCategories extends CategoryEvent {
  final int? groupId;
  final TransactionType? type;

  const LoadCategories({
    this.groupId,
    this.type,
  });

  @override
  List<Object?> get props => [groupId, type];
}

class CreateCategory extends CategoryEvent {
  final Category category;

  const CreateCategory({required this.category});

  @override
  List<Object?> get props => [category];
}

class UpdateCategory extends CategoryEvent {
  final Category category;

  const UpdateCategory({required this.category});

  @override
  List<Object?> get props => [category];
}

class DeleteCategory extends CategoryEvent {
  final int id;

  const DeleteCategory({required this.id});

  @override
  List<Object?> get props => [id];
}

