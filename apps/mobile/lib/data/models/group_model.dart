import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/group.dart';

part 'group_model.g.dart';

@JsonSerializable()
class GroupModel {
  final int id;
  final String name;
  @JsonKey(name: 'owner_id')
  final int ownerId;
  @JsonKey(name: 'created_at')
  final String createdAt;

  GroupModel({
    required this.id,
    required this.name,
    required this.ownerId,
    required this.createdAt,
  });

  factory GroupModel.fromJson(Map<String, dynamic> json) =>
      _$GroupModelFromJson(json);

  Map<String, dynamic> toJson() => _$GroupModelToJson(this);

  Group toEntity() {
    return Group(
      id: id,
      name: name,
      ownerId: ownerId,
      createdAt: DateTime.parse(createdAt),
    );
  }

  factory GroupModel.fromEntity(Group group) {
    return GroupModel(
      id: group.id,
      name: group.name,
      ownerId: group.ownerId,
      createdAt: group.createdAt.toIso8601String(),
    );
  }
}

