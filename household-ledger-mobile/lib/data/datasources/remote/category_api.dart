import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:json_annotation/json_annotation.dart';
import '../../../config/app_config.dart';
import '../models/category_model.dart';

part 'category_api.g.dart';

@RestApi(baseUrl: AppConfig.apiBaseUrl)
abstract class CategoryApi {
  factory CategoryApi(Dio dio, {String baseUrl}) = _CategoryApi;

  @GET('/categories')
  Future<List<CategoryModel>> getCategories(
    @Query('group_id') int? groupId,
    @Query('type') String? type,
  );

  @GET('/categories/{id}')
  Future<CategoryModel> getCategory(@Path('id') int id);

  @POST('/categories')
  Future<CategoryModel> createCategory(@Body() CategoryCreateRequest request);

  @PUT('/categories/{id}')
  Future<CategoryModel> updateCategory(
    @Path('id') int id,
    @Body() CategoryCreateRequest request,
  );

  @DELETE('/categories/{id}')
  Future<void> deleteCategory(@Path('id') int id);
}

class CategoryCreateRequest {
  @JsonKey(name: 'group_id')
  final int? groupId;
  final String name;
  final String type; // "EXPENSE", "INCOME", "TRANSFER"
  final String? color;
  @JsonKey(name: 'is_default')
  final bool isDefault;
  @JsonKey(name: 'budget_amount')
  final int? budgetAmount;

  CategoryCreateRequest({
    this.groupId,
    required this.name,
    required this.type,
    this.color,
    this.isDefault = false,
    this.budgetAmount,
  });

  Map<String, dynamic> toJson() => {
        if (groupId != null) 'group_id': groupId,
        'name': name,
        'type': type,
        if (color != null) 'color': color,
        'is_default': isDefault,
        if (budgetAmount != null) 'budget_amount': budgetAmount,
      };
}

