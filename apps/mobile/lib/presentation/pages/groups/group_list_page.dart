import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../bloc/group/group_bloc.dart';
import '../../bloc/group/group_event.dart';
import '../../bloc/group/group_state.dart';

class GroupListPage extends StatefulWidget {
  const GroupListPage({super.key});

  @override
  State<GroupListPage> createState() => _GroupListPageState();
}

class _GroupListPageState extends State<GroupListPage> {
  @override
  void initState() {
    super.initState();
    context.read<GroupBloc>().add(const LoadGroups());
  }

  void _showInviteCodeDialog(String code) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('초대 코드'),
        content: SelectableText(code),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
            },
            child: const Text('닫기'),
          ),
          TextButton(
            onPressed: () {
              // TODO: 클립보드에 복사 (Phase 9에서 구현)
              Navigator.of(context).pop();
            },
            child: const Text('복사'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('그룹'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // TODO: 그룹 생성 다이얼로그 (Phase 9에서 구현)
            },
          ),
        ],
      ),
      body: BlocBuilder<GroupBloc, GroupState>(
        builder: (context, state) {
          if (state is GroupLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is GroupError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('오류: ${state.message}'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      context.read<GroupBloc>().add(const LoadGroups());
                    },
                    child: const Text('다시 시도'),
                  ),
                ],
              ),
            );
          }

          if (state is GroupLoaded) {
            final groups = state.groups;
            if (groups.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('그룹이 없습니다'),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        // TODO: 그룹 생성 다이얼로그 (Phase 9에서 구현)
                      },
                      child: const Text('그룹 생성'),
                    ),
                  ],
                ),
              );
            }

            return ListView.builder(
              itemCount: groups.length,
              itemBuilder: (context, index) {
                final group = groups[index];
                return ListTile(
                  leading: const CircleAvatar(
                    child: Icon(Icons.group),
                  ),
                  title: Text(group.name),
                  subtitle: Text('소유자 ID: ${group.ownerId}'),
                  trailing: PopupMenuButton(
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'invite',
                        child: Text('초대 코드 생성'),
                      ),
                      const PopupMenuItem(
                        value: 'edit',
                        child: Text('수정'),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Text('삭제'),
                      ),
                    ],
                    onSelected: (value) {
                      switch (value) {
                        case 'invite':
                          context.read<GroupBloc>().add(
                                GenerateInviteCode(groupId: group.id),
                              );
                          break;
                        case 'edit':
                          // TODO: 그룹 수정 (Phase 9에서 구현)
                          break;
                        case 'delete':
                          // TODO: 그룹 삭제 확인 (Phase 9에서 구현)
                          break;
                      }
                    },
                  ),
                );
              },
            );
          }

          if (state is InviteCodeGenerated) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              _showInviteCodeDialog(state.code);
            });
            return BlocBuilder<GroupBloc, GroupState>(
              builder: (context, state) {
                if (state is GroupLoaded) {
                  final groups = state.groups;
                  return ListView.builder(
                    itemCount: groups.length,
                    itemBuilder: (context, index) {
                      final group = groups[index];
                      return ListTile(
                        leading: const CircleAvatar(
                          child: Icon(Icons.group),
                        ),
                        title: Text(group.name),
                      );
                    },
                  );
                }
                return const Center(child: CircularProgressIndicator());
              },
            );
          }

          return const Center(child: Text('데이터를 불러오는 중...'));
        },
      ),
    );
  }
}

