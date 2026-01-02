import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:json_annotation/json_annotation.dart';
import '../../../config/app_config.dart';
import '../models/transaction_model.dart';

part 'transaction_api.g.dart';

@RestApi(baseUrl: AppConfig.apiBaseUrl)
abstract class TransactionApi {
  factory TransactionApi(Dio dio, {String baseUrl}) = _TransactionApi;

  @GET('/transactions')
  Future<TransactionListResponse> getTransactions(
    @Query('group_id') int? groupId,
    @Query('start_date') String? startDate,
    @Query('end_date') String? endDate,
    @Query('category_id') int? categoryId,
    @Query('search') String? search,
    @Query('limit') int limit,
    @Query('offset') int offset,
  );

  @GET('/transactions/{id}')
  Future<TransactionResponse> getTransaction(@Path('id') int id);

  @POST('/transactions')
  Future<TransactionResponse> createTransaction(@Body() TransactionCreateRequest request);

  @PUT('/transactions/{id}')
  Future<TransactionResponse> updateTransaction(
    @Path('id') int id,
    @Body() TransactionCreateRequest request,
  );

  @DELETE('/transactions/{id}')
  Future<void> deleteTransaction(@Path('id') int id);

  @POST('/transactions/quick-add')
  Future<TransactionResponse> quickAddTransaction(@Body() QuickAddRequest request);
}

class TransactionCreateRequest {
  @JsonKey(name: 'group_id')
  final int? groupId;
  final int amount;
  @JsonKey(name: 'currency_code')
  final String? currencyCode;
  @JsonKey(name: 'original_amount')
  final int? originalAmount;
  @JsonKey(name: 'category_id')
  final int? categoryId;
  @JsonKey(name: 'tag_id')
  final int? tagId;
  final String? merchant;
  final String? memo;
  final String type; // "EXPENSE", "INCOME", "TRANSFER"
  final String date; // YYYY-MM-DD

  TransactionCreateRequest({
    this.groupId,
    required this.amount,
    this.currencyCode,
    this.originalAmount,
    this.categoryId,
    this.tagId,
    this.merchant,
    this.memo,
    required this.type,
    required this.date,
  });

  Map<String, dynamic> toJson() => {
        if (groupId != null) 'group_id': groupId,
        'amount': amount,
        if (currencyCode != null) 'currency_code': currencyCode,
        if (originalAmount != null) 'original_amount': originalAmount,
        if (categoryId != null) 'category_id': categoryId,
        if (tagId != null) 'tag_id': tagId,
        if (merchant != null) 'merchant': merchant,
        if (memo != null) 'memo': memo,
        'type': type,
        'date': date,
      };
}

class QuickAddRequest {
  final int amount;
  final String type;
  final String date;
  @JsonKey(name: 'category_name')
  final String? categoryName;
  final String? merchant;

  QuickAddRequest({
    required this.amount,
    required this.type,
    required this.date,
    this.categoryName,
    this.merchant,
  });

  Map<String, dynamic> toJson() => {
        'amount': amount,
        'type': type,
        'date': date,
        if (categoryName != null) 'category_name': categoryName,
        if (merchant != null) 'merchant': merchant,
      };
}

class TransactionResponse {
  final TransactionModel transaction;

  TransactionResponse({required this.transaction});

  factory TransactionResponse.fromJson(Map<String, dynamic> json) =>
      TransactionResponse(
        transaction: TransactionModel.fromJson(json),
      );
}

class TransactionListResponse {
  final List<TransactionModel> items;
  final int total;

  TransactionListResponse({
    required this.items,
    required this.total,
  });

  factory TransactionListResponse.fromJson(Map<String, dynamic> json) =>
      TransactionListResponse(
        items: (json['items'] as List)
            .map((e) => TransactionModel.fromJson(e))
            .toList(),
        total: json['total'] ?? 0,
      );
}

