import 'package:equatable/equatable.dart';
import '../../../domain/entities/group.dart';

abstract class GroupState extends Equatable {
  const GroupState();

  @override
  List<Object?> get props => [];
}

class GroupInitial extends GroupState {
  const GroupInitial();
}

class GroupLoading extends GroupState {
  const GroupLoading();
}

class GroupLoaded extends GroupState {
  final List<Group> groups;

  const GroupLoaded({required this.groups});

  @override
  List<Object?> get props => [groups];
}

class GroupCreated extends GroupState {
  final Group group;

  const GroupCreated({required this.group});

  @override
  List<Object?> get props => [group];
}

class GroupUpdated extends GroupState {
  final Group group;

  const GroupUpdated({required this.group});

  @override
  List<Object?> get props => [group];
}

class GroupDeleted extends GroupState {
  final int id;

  const GroupDeleted({required this.id});

  @override
  List<Object?> get props => [id];
}

class InviteCodeGenerated extends GroupState {
  final String code;

  const InviteCodeGenerated({required this.code});

  @override
  List<Object?> get props => [code];
}

class GroupJoined extends GroupState {
  const GroupJoined();
}

class GroupLeft extends GroupState {
  final int groupId;

  const GroupLeft({required this.groupId});

  @override
  List<Object?> get props => [groupId];
}

class GroupError extends GroupState {
  final String message;

  const GroupError({required this.message});

  @override
  List<Object?> get props => [message];
}

