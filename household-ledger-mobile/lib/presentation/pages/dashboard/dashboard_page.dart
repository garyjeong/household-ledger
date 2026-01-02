import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/router/app_routes.dart';
import '../../bloc/statistics/statistics_bloc.dart';
import '../../bloc/statistics/statistics_event.dart';
import '../../bloc/statistics/statistics_state.dart';
import '../../widgets/common/bottom_nav_bar.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    // 통계 로드
    final now = DateTime.now();
    final startDate = DateTime(now.year, now.month, 1);
    context.read<StatisticsBloc>().add(
          LoadStatistics(
            startDate: startDate,
            endDate: now,
          ),
        );
  }

  void _onNavTap(int index) {
    setState(() {
      _currentIndex = index;
    });
    switch (index) {
      case 0:
        // 대시보드 (현재 페이지)
        break;
      case 1:
        context.go(AppRoutes.transactions);
        break;
      case 2:
        context.go(AppRoutes.statistics);
        break;
      case 3:
        context.go(AppRoutes.profile);
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Household Ledger'),
      ),
      body: BlocBuilder<StatisticsBloc, StatisticsState>(
        builder: (context, state) {
          if (state is StatisticsLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is StatisticsError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('오류: ${state.message}'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      final now = DateTime.now();
                      final startDate = DateTime(now.year, now.month, 1);
                      context.read<StatisticsBloc>().add(
                            LoadStatistics(
                              startDate: startDate,
                              endDate: now,
                            ),
                          );
                    },
                    child: const Text('다시 시도'),
                  ),
                ],
              ),
            );
          }

          if (state is StatisticsLoaded) {
            final stats = state.statistics;
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 요약 카드
                  Row(
                    children: [
                      Expanded(
                        child: _SummaryCard(
                          title: '수입',
                          amount: stats.totalIncome,
                          color: Colors.green,
                          icon: Icons.arrow_upward,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _SummaryCard(
                          title: '지출',
                          amount: stats.totalExpense,
                          color: Colors.red,
                          icon: Icons.arrow_downward,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _SummaryCard(
                    title: '순이익',
                    amount: stats.netProfit,
                    color: stats.netProfit >= 0 ? Colors.blue : Colors.orange,
                    icon: Icons.account_balance,
                  ),
                  const SizedBox(height: 24),
                  // 최근 거래 섹션
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '최근 거래',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      TextButton(
                        onPressed: () {
                          context.go(AppRoutes.transactions);
                        },
                        child: const Text('전체 보기'),
                      ),
                    ],
                  ),
                  // TODO: 최근 거래 목록 (Phase 8에서 구현)
                  const SizedBox(height: 100),
                ],
              ),
            );
          }

          return const Center(child: Text('데이터를 불러오는 중...'));
        },
      ),
      bottomNavigationBar: BottomNavBar(
        currentIndex: _currentIndex,
        onTap: _onNavTap,
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String title;
  final int amount;
  final Color color;
  final IconData icon;

  const _SummaryCard({
    required this.title,
    required this.amount,
    required this.color,
    required this.icon,
  });

  String _formatAmount(int amount) {
    return '${amount.toString().replaceAllMapped(
          RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        )}원';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              _formatAmount(amount),
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: color,
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

