import 'package:equatable/equatable.dart';
import '../../../domain/entities/category.dart';

abstract class CategoryState extends Equatable {
  const CategoryState();

  @override
  List<Object?> get props => [];
}

class CategoryInitial extends CategoryState {
  const CategoryInitial();
}

class CategoryLoading extends CategoryState {
  const CategoryLoading();
}

class CategoryLoaded extends CategoryState {
  final List<Category> categories;

  const CategoryLoaded({required this.categories});

  @override
  List<Object?> get props => [categories];
}

class CategoryCreated extends CategoryState {
  final Category category;

  const CategoryCreated({required this.category});

  @override
  List<Object?> get props => [category];
}

class CategoryUpdated extends CategoryState {
  final Category category;

  const CategoryUpdated({required this.category});

  @override
  List<Object?> get props => [category];
}

class CategoryDeleted extends CategoryState {
  final int id;

  const CategoryDeleted({required this.id});

  @override
  List<Object?> get props => [id];
}

class CategoryError extends CategoryState {
  final String message;

  const CategoryError({required this.message});

  @override
  List<Object?> get props => [message];
}

