import '../../domain/entities/group.dart';
import '../../domain/repositories/group_repository.dart' as domain;
import '../datasources/remote/group_api.dart';
import '../../core/errors/app_exceptions.dart';
import '../models/group_model.dart';

class GroupRepositoryImpl implements domain.GroupRepository {
  final GroupApi _groupApi;

  GroupRepositoryImpl({required GroupApi groupApi}) : _groupApi = groupApi;

  @override
  Future<List<Group>> getGroups() async {
    try {
      final groups = await _groupApi.getGroups();
      return groups.map((e) => e.toEntity()).toList();
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('그룹 목록 조회에 실패했습니다: $e');
    }
  }

  @override
  Future<Group> getGroup(int id) async {
    try {
      final group = await _groupApi.getGroup(id);
      return group.toEntity();
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('그룹 조회에 실패했습니다: $e');
    }
  }

  @override
  Future<Group> createGroup(String name) async {
    try {
      final request = GroupCreateRequest(name: name);
      final group = await _groupApi.createGroup(request);
      return group.toEntity();
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('그룹 생성에 실패했습니다: $e');
    }
  }

  @override
  Future<Group> updateGroup(Group group) async {
    try {
      final request = GroupCreateRequest(name: group.name);
      final updated = await _groupApi.updateGroup(group.id, request);
      return updated.toEntity();
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('그룹 수정에 실패했습니다: $e');
    }
  }

  @override
  Future<void> deleteGroup(int id) async {
    try {
      await _groupApi.deleteGroup(id);
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('그룹 삭제에 실패했습니다: $e');
    }
  }

  @override
  Future<String> generateInviteCode(int groupId) async {
    try {
      final response = await _groupApi.generateInviteCode(groupId);
      return response.code;
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('초대 코드 생성에 실패했습니다: $e');
    }
  }

  @override
  Future<void> joinGroup(String inviteCode) async {
    try {
      final request = JoinGroupRequest(inviteCode: inviteCode);
      await _groupApi.joinGroup(request);
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('그룹 참여에 실패했습니다: $e');
    }
  }

  @override
  Future<void> leaveGroup(int groupId) async {
    try {
      await _groupApi.leaveGroup(groupId);
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('그룹 탈퇴에 실패했습니다: $e');
    }
  }
}

