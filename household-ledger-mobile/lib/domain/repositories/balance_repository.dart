class Balance {
  final int currentBalance;
  final int expectedBalance;
  final DateTime asOfDate;

  Balance({
    required this.currentBalance,
    required this.expectedBalance,
    required this.asOfDate,
  });
}

abstract class BalanceRepository {
  Future<Balance> getCurrentBalance({int? groupId});

  Future<Balance> getExpectedBalance({
    int? groupId,
    DateTime? targetDate,
  });
}

