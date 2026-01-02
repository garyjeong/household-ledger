import 'package:equatable/equatable.dart';
import '../../../domain/entities/group.dart';

abstract class GroupEvent extends Equatable {
  const GroupEvent();

  @override
  List<Object?> get props => [];
}

class LoadGroups extends GroupEvent {
  const LoadGroups();
}

class CreateGroup extends GroupEvent {
  final String name;

  const CreateGroup({required this.name});

  @override
  List<Object?> get props => [name];
}

class UpdateGroup extends GroupEvent {
  final Group group;

  const UpdateGroup({required this.group});

  @override
  List<Object?> get props => [group];
}

class DeleteGroup extends GroupEvent {
  final int id;

  const DeleteGroup({required this.id});

  @override
  List<Object?> get props => [id];
}

class GenerateInviteCode extends GroupEvent {
  final int groupId;

  const GenerateInviteCode({required this.groupId});

  @override
  List<Object?> get props => [groupId];
}

class JoinGroup extends GroupEvent {
  final String inviteCode;

  const JoinGroup({required this.inviteCode});

  @override
  List<Object?> get props => [inviteCode];
}

class LeaveGroup extends GroupEvent {
  final int groupId;

  const LeaveGroup({required this.groupId});

  @override
  List<Object?> get props => [groupId];
}

