import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:json_annotation/json_annotation.dart';
import '../../../config/app_config.dart';
import '../models/group_model.dart';

part 'group_api.g.dart';

@RestApi(baseUrl: AppConfig.apiBaseUrl)
abstract class GroupApi {
  factory GroupApi(Dio dio, {String baseUrl}) = _GroupApi;

  @GET('/groups')
  Future<List<GroupModel>> getGroups();

  @GET('/groups/{id}')
  Future<GroupModel> getGroup(@Path('id') int id);

  @POST('/groups')
  Future<GroupModel> createGroup(@Body() GroupCreateRequest request);

  @PUT('/groups/{id}')
  Future<GroupModel> updateGroup(
    @Path('id') int id,
    @Body() GroupCreateRequest request,
  );

  @DELETE('/groups/{id}')
  Future<void> deleteGroup(@Path('id') int id);

  @POST('/groups/{id}/invite-code')
  Future<InviteCodeResponse> generateInviteCode(@Path('id') int id);

  @POST('/groups/join')
  Future<void> joinGroup(@Body() JoinGroupRequest request);

  @POST('/groups/{id}/leave')
  Future<void> leaveGroup(@Path('id') int id);
}

class GroupCreateRequest {
  final String name;

  GroupCreateRequest({required this.name});

  Map<String, dynamic> toJson() => {'name': name};
}

class JoinGroupRequest {
  @JsonKey(name: 'invite_code')
  final String inviteCode;

  JoinGroupRequest({required this.inviteCode});

  Map<String, dynamic> toJson() => {'invite_code': inviteCode};
}

class InviteCodeResponse {
  final String code;

  InviteCodeResponse({required this.code});

  factory InviteCodeResponse.fromJson(Map<String, dynamic> json) =>
      InviteCodeResponse(code: json['code']);
}

