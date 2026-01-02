import '../entities/exchange_rate.dart';

abstract class ExchangeRateRepository {
  Future<ExchangeRate?> getExchangeRate({
    required String fromCurrency,
    required String toCurrency,
    DateTime? date,
  });

  Future<List<ExchangeRate>> getLatestExchangeRates({
    required String baseCurrency,
  });

  Future<int> convertAmount({
    required int amount,
    required String fromCurrency,
    required String toCurrency,
  });
}

