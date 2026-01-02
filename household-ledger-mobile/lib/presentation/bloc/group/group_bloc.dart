import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../domain/repositories/group_repository.dart';
import 'group_event.dart';
import 'group_state.dart';

class GroupBloc extends Bloc<GroupEvent, GroupState> {
  final GroupRepository _repository;

  GroupBloc({required GroupRepository repository})
      : _repository = repository,
        super(const GroupInitial()) {
    on<LoadGroups>(_onLoadGroups);
    on<CreateGroup>(_onCreateGroup);
    on<UpdateGroup>(_onUpdateGroup);
    on<DeleteGroup>(_onDeleteGroup);
    on<GenerateInviteCode>(_onGenerateInviteCode);
    on<JoinGroup>(_onJoinGroup);
    on<LeaveGroup>(_onLeaveGroup);
  }

  Future<void> _onLoadGroups(
    LoadGroups event,
    Emitter<GroupState> emit,
  ) async {
    emit(const GroupLoading());
    try {
      final groups = await _repository.getGroups();
      emit(GroupLoaded(groups: groups));
    } catch (e) {
      emit(GroupError(message: e.toString()));
    }
  }

  Future<void> _onCreateGroup(
    CreateGroup event,
    Emitter<GroupState> emit,
  ) async {
    try {
      final group = await _repository.createGroup(event.name);
      emit(GroupCreated(group: group));
      add(const LoadGroups());
    } catch (e) {
      emit(GroupError(message: e.toString()));
    }
  }

  Future<void> _onUpdateGroup(
    UpdateGroup event,
    Emitter<GroupState> emit,
  ) async {
    try {
      final group = await _repository.updateGroup(event.group);
      emit(GroupUpdated(group: group));
      add(const LoadGroups());
    } catch (e) {
      emit(GroupError(message: e.toString()));
    }
  }

  Future<void> _onDeleteGroup(
    DeleteGroup event,
    Emitter<GroupState> emit,
  ) async {
    try {
      await _repository.deleteGroup(event.id);
      emit(GroupDeleted(id: event.id));
      add(const LoadGroups());
    } catch (e) {
      emit(GroupError(message: e.toString()));
    }
  }

  Future<void> _onGenerateInviteCode(
    GenerateInviteCode event,
    Emitter<GroupState> emit,
  ) async {
    try {
      final code = await _repository.generateInviteCode(event.groupId);
      emit(InviteCodeGenerated(code: code));
    } catch (e) {
      emit(GroupError(message: e.toString()));
    }
  }

  Future<void> _onJoinGroup(
    JoinGroup event,
    Emitter<GroupState> emit,
  ) async {
    try {
      await _repository.joinGroup(event.inviteCode);
      emit(const GroupJoined());
      add(const LoadGroups());
    } catch (e) {
      emit(GroupError(message: e.toString()));
    }
  }

  Future<void> _onLeaveGroup(
    LeaveGroup event,
    Emitter<GroupState> emit,
  ) async {
    try {
      await _repository.leaveGroup(event.groupId);
      emit(GroupLeft(groupId: event.groupId));
      add(const LoadGroups());
    } catch (e) {
      emit(GroupError(message: e.toString()));
    }
  }
}

