import '../entities/group.dart';

abstract class GroupRepository {
  Future<List<Group>> getGroups();

  Future<Group> getGroup(int id);

  Future<Group> createGroup(String name);

  Future<Group> updateGroup(Group group);

  Future<void> deleteGroup(int id);

  Future<String> generateInviteCode(int groupId);

  Future<void> joinGroup(String inviteCode);

  Future<void> leaveGroup(int groupId);
}

