import 'package:equatable/equatable.dart';

abstract class StatisticsEvent extends Equatable {
  const StatisticsEvent();

  @override
  List<Object?> get props => [];
}

class LoadStatistics extends StatisticsEvent {
  final int? groupId;
  final DateTime? startDate;
  final DateTime? endDate;

  const LoadStatistics({
    this.groupId,
    this.startDate,
    this.endDate,
  });

  @override
  List<Object?> get props => [groupId, startDate, endDate];
}

