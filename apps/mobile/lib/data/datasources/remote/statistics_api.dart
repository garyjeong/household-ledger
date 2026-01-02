import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:json_annotation/json_annotation.dart';
import '../../../config/app_config.dart';

part 'statistics_api.g.dart';

@RestApi(baseUrl: AppConfig.apiBaseUrl)
abstract class StatisticsApi {
  factory StatisticsApi(Dio dio, {String baseUrl}) = _StatisticsApi;

  @GET('/statistics')
  Future<StatisticsResponse> getStatistics(
    @Query('group_id') int? groupId,
    @Query('start_date') String? startDate,
    @Query('end_date') String? endDate,
  );

  @GET('/statistics/categories')
  Future<List<CategoryStatResponse>> getCategoryStatistics(
    @Query('group_id') int? groupId,
    @Query('start_date') String? startDate,
    @Query('end_date') String? endDate,
  );
}

class StatisticsResponse {
  @JsonKey(name: 'total_income')
  final int totalIncome;
  @JsonKey(name: 'total_expense')
  final int totalExpense;
  @JsonKey(name: 'net_profit')
  final int netProfit;
  @JsonKey(name: 'transaction_count')
  final int transactionCount;
  @JsonKey(name: 'category_stats')
  final List<CategoryStatResponse> categoryStats;
  @JsonKey(name: 'daily_trends')
  final Map<String, int> dailyTrends;

  StatisticsResponse({
    required this.totalIncome,
    required this.totalExpense,
    required this.netProfit,
    required this.transactionCount,
    required this.categoryStats,
    required this.dailyTrends,
  });

  factory StatisticsResponse.fromJson(Map<String, dynamic> json) =>
      StatisticsResponse(
        totalIncome: json['total_income'],
        totalExpense: json['total_expense'],
        netProfit: json['net_profit'],
        transactionCount: json['transaction_count'],
        categoryStats: (json['category_stats'] as List)
            .map((e) => CategoryStatResponse.fromJson(e))
            .toList(),
        dailyTrends: Map<String, int>.from(json['daily_trends'] ?? {}),
      );
}

class CategoryStatResponse {
  @JsonKey(name: 'category_id')
  final int categoryId;
  @JsonKey(name: 'category_name')
  final String categoryName;
  final int amount;
  @JsonKey(name: 'transaction_count')
  final int transactionCount;

  CategoryStatResponse({
    required this.categoryId,
    required this.categoryName,
    required this.amount,
    required this.transactionCount,
  });

  factory CategoryStatResponse.fromJson(Map<String, dynamic> json) =>
      CategoryStatResponse(
        categoryId: json['category_id'],
        categoryName: json['category_name'],
        amount: json['amount'],
        transactionCount: json['transaction_count'],
      );
}

