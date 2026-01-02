import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../domain/repositories/statistics_repository.dart';
import 'statistics_event.dart';
import 'statistics_state.dart';

class StatisticsBloc extends Bloc<StatisticsEvent, StatisticsState> {
  final StatisticsRepository _repository;

  StatisticsBloc({required StatisticsRepository repository})
      : _repository = repository,
        super(const StatisticsInitial()) {
    on<LoadStatistics>(_onLoadStatistics);
  }

  Future<void> _onLoadStatistics(
    LoadStatistics event,
    Emitter<StatisticsState> emit,
  ) async {
    emit(const StatisticsLoading());
    try {
      final statistics = await _repository.getStatistics(
        groupId: event.groupId,
        startDate: event.startDate,
        endDate: event.endDate,
      );
      emit(StatisticsLoaded(statistics: statistics));
    } catch (e) {
      emit(StatisticsError(message: e.toString()));
    }
  }
}

