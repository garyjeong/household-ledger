class CategoryStat {
  final int categoryId;
  final String categoryName;
  final int amount;
  final int transactionCount;

  CategoryStat({
    required this.categoryId,
    required this.categoryName,
    required this.amount,
    required this.transactionCount,
  });
}

class Statistics {
  final int totalIncome;
  final int totalExpense;
  final int netProfit;
  final int transactionCount;
  final List<CategoryStat> categoryStats;
  final Map<DateTime, int> dailyTrends;

  Statistics({
    required this.totalIncome,
    required this.totalExpense,
    required this.netProfit,
    required this.transactionCount,
    required this.categoryStats,
    required this.dailyTrends,
  });
}

abstract class StatisticsRepository {
  Future<Statistics> getStatistics({
    int? groupId,
    DateTime? startDate,
    DateTime? endDate,
  });

  Future<List<CategoryStat>> getCategoryStatistics({
    int? groupId,
    DateTime? startDate,
    DateTime? endDate,
  });

  Future<Map<DateTime, int>> getDailyTrends({
    int? groupId,
    DateTime? startDate,
    DateTime? endDate,
  });
}

