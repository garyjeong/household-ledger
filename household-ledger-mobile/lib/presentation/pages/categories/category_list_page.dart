import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../domain/entities/transaction.dart';
import '../../bloc/category/category_bloc.dart';
import '../../bloc/category/category_event.dart';
import '../../bloc/category/category_state.dart';

class CategoryListPage extends StatefulWidget {
  const CategoryListPage({super.key});

  @override
  State<CategoryListPage> createState() => _CategoryListPageState();
}

class _CategoryListPageState extends State<CategoryListPage> {
  TransactionType? _selectedType;

  @override
  void initState() {
    super.initState();
    context.read<CategoryBloc>().add(const LoadCategories());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('카테고리'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // TODO: 카테고리 생성 화면 (Phase 9에서 구현)
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // 필터
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
                  child: ChoiceChip(
                    label: const Text('전체'),
                    selected: _selectedType == null,
                    onSelected: (selected) {
                      if (selected) {
                        setState(() {
                          _selectedType = null;
                        });
                        context.read<CategoryBloc>().add(
                              const LoadCategories(),
                            );
                      }
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ChoiceChip(
                    label: const Text('지출'),
                    selected: _selectedType == TransactionType.expense,
                    onSelected: (selected) {
                      if (selected) {
                        setState(() {
                          _selectedType = TransactionType.expense;
                        });
                        context.read<CategoryBloc>().add(
                              LoadCategories(type: TransactionType.expense),
                            );
                      }
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ChoiceChip(
                    label: const Text('수입'),
                    selected: _selectedType == TransactionType.income,
                    onSelected: (selected) {
                      if (selected) {
                        setState(() {
                          _selectedType = TransactionType.income;
                        });
                        context.read<CategoryBloc>().add(
                              LoadCategories(type: TransactionType.income),
                            );
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
          // 카테고리 목록
          Expanded(
            child: BlocBuilder<CategoryBloc, CategoryState>(
              builder: (context, state) {
                if (state is CategoryLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (state is CategoryError) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('오류: ${state.message}'),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () {
                            context.read<CategoryBloc>().add(
                                  const LoadCategories(),
                                );
                          },
                          child: const Text('다시 시도'),
                        ),
                      ],
                    ),
                  );
                }

                if (state is CategoryLoaded) {
                  final categories = state.categories;
                  if (categories.isEmpty) {
                    return const Center(
                      child: Text('카테고리가 없습니다'),
                    );
                  }

                  return ListView.builder(
                    itemCount: categories.length,
                    itemBuilder: (context, index) {
                      final category = categories[index];
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: category.color != null
                              ? Color(int.parse(
                                  category.color!.replaceFirst('#', '0xFF')))
                              : Colors.grey,
                        ),
                        title: Text(category.name),
                        subtitle: Text(
                          category.type.toString().split('.').last,
                        ),
                        trailing: category.budgetAmount != null
                            ? Text(
                                '${category.budgetAmount.toString().replaceAllMapped(
                                      RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
                                      (Match m) => '${m[1]},',
                                    )}원')
                            : null,
                        onTap: () {
                          // TODO: 카테고리 수정 화면 (Phase 9에서 구현)
                        },
                      );
                    },
                  );
                }

                return const Center(child: Text('데이터를 불러오는 중...'));
              },
            ),
          ),
        ],
      ),
    );
  }
}

