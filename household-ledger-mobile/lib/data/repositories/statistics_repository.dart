import '../../domain/repositories/statistics_repository.dart' as domain;
import '../datasources/remote/statistics_api.dart';
import '../../core/errors/app_exceptions.dart';

class StatisticsRepositoryImpl implements domain.StatisticsRepository {
  final StatisticsApi _statisticsApi;

  StatisticsRepositoryImpl({required StatisticsApi statisticsApi})
      : _statisticsApi = statisticsApi;

  @override
  Future<domain.Statistics> getStatistics({
    int? groupId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final response = await _statisticsApi.getStatistics(
        groupId,
        startDate?.toIso8601String().split('T')[0],
        endDate?.toIso8601String().split('T')[0],
      );
      
      // dailyTrends를 DateTime 키로 변환
      final dailyTrends = <DateTime, int>{};
      response.dailyTrends.forEach((key, value) {
        dailyTrends[DateTime.parse(key)] = value;
      });
      
      return domain.Statistics(
        totalIncome: response.totalIncome,
        totalExpense: response.totalExpense,
        netProfit: response.netProfit,
        transactionCount: response.transactionCount,
        categoryStats: response.categoryStats
            .map((e) => domain.CategoryStat(
                  categoryId: e.categoryId,
                  categoryName: e.categoryName,
                  amount: e.amount,
                  transactionCount: e.transactionCount,
                ))
            .toList(),
        dailyTrends: dailyTrends,
      );
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('통계 조회에 실패했습니다: $e');
    }
  }

  @override
  Future<List<domain.CategoryStat>> getCategoryStatistics({
    int? groupId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final stats = await _statisticsApi.getCategoryStatistics(
        groupId,
        startDate?.toIso8601String().split('T')[0],
        endDate?.toIso8601String().split('T')[0],
      );
      return stats
          .map((e) => domain.CategoryStat(
                categoryId: e.categoryId,
                categoryName: e.categoryName,
                amount: e.amount,
                transactionCount: e.transactionCount,
              ))
          .toList();
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('카테고리 통계 조회에 실패했습니다: $e');
    }
  }

  @override
  Future<Map<DateTime, int>> getDailyTrends({
    int? groupId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final stats = await getStatistics(
        groupId: groupId,
        startDate: startDate,
        endDate: endDate,
      );
      return stats.dailyTrends;
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('일별 추이 조회에 실패했습니다: $e');
    }
  }
}

