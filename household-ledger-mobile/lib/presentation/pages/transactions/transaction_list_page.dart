import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../bloc/transaction/transaction_bloc.dart';
import '../../bloc/transaction/transaction_event.dart';
import '../../bloc/transaction/transaction_state.dart';

class TransactionListPage extends StatefulWidget {
  const TransactionListPage({super.key});

  @override
  State<TransactionListPage> createState() => _TransactionListPageState();
}

class _TransactionListPageState extends State<TransactionListPage> {
  final _scrollController = ScrollController();
  int _offset = 0;
  bool _isLoadingMore = false;

  @override
  void initState() {
    super.initState();
    context.read<TransactionBloc>().add(
          const LoadTransactions(limit: 50, offset: 0),
        );
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent * 0.8 &&
        !_isLoadingMore) {
      setState(() {
        _isLoadingMore = true;
        _offset += 50;
      });
      context.read<TransactionBloc>().add(
            LoadTransactions(limit: 50, offset: _offset),
          );
    }
  }

  String _formatAmount(int amount) {
    return '${amount.toString().replaceAllMapped(
          RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        )}원';
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  Color _getTransactionTypeColor(transactionType) {
    switch (transactionType.toString()) {
      case 'TransactionType.expense':
        return Colors.red;
      case 'TransactionType.income':
        return Colors.green;
      case 'TransactionType.transfer':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('거래 내역'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // TODO: 거래 추가 화면으로 이동 (Phase 8에서 구현)
            },
          ),
        ],
      ),
      body: BlocBuilder<TransactionBloc, TransactionState>(
        builder: (context, state) {
          if (state is TransactionLoading && _offset == 0) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is TransactionError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('오류: ${state.message}'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _offset = 0;
                      });
                      context.read<TransactionBloc>().add(
                            const LoadTransactions(limit: 50, offset: 0),
                          );
                    },
                    child: const Text('다시 시도'),
                  ),
                ],
              ),
            );
          }

          if (state is TransactionLoaded) {
            final transactions = state.transactions;
            if (transactions.isEmpty) {
              return const Center(
                child: Text('거래 내역이 없습니다'),
              );
            }

            return ListView.builder(
              controller: _scrollController,
              itemCount: transactions.length + (_isLoadingMore ? 1 : 0),
              itemBuilder: (context, index) {
                if (index >= transactions.length) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16.0),
                      child: CircularProgressIndicator(),
                    ),
                  );
                }

                final transaction = transactions[index];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor:
                        _getTransactionTypeColor(transaction.type),
                    child: Icon(
                      transaction.type.toString() ==
                              'TransactionType.expense'
                          ? Icons.arrow_downward
                          : transaction.type.toString() ==
                                  'TransactionType.income'
                              ? Icons.arrow_upward
                              : Icons.swap_horiz,
                      color: Colors.white,
                    ),
                  ),
                  title: Text(
                    transaction.merchant ?? '거래',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(
                    _formatDate(transaction.date),
                  ),
                  trailing: Text(
                    _formatAmount(transaction.amount),
                    style: TextStyle(
                      color: _getTransactionTypeColor(transaction.type),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  onTap: () {
                    // TODO: 거래 상세 화면으로 이동 (Phase 8에서 구현)
                  },
                );
              },
            );
          }

          return const Center(child: Text('데이터를 불러오는 중...'));
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: 빠른 거래 추가 모달 (Phase 8에서 구현)
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}

