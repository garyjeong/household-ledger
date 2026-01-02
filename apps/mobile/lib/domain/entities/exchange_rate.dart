class ExchangeRate {
  final int id;
  final String fromCurrency;
  final String toCurrency;
  final double rate;
  final DateTime date;
  final String? source;
  final DateTime createdAt;
  final DateTime updatedAt;

  ExchangeRate({
    required this.id,
    required this.fromCurrency,
    required this.toCurrency,
    required this.rate,
    required this.date,
    this.source,
    required this.createdAt,
    required this.updatedAt,
  });

  ExchangeRate copyWith({
    int? id,
    String? fromCurrency,
    String? toCurrency,
    double? rate,
    DateTime? date,
    String? source,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ExchangeRate(
      id: id ?? this.id,
      fromCurrency: fromCurrency ?? this.fromCurrency,
      toCurrency: toCurrency ?? this.toCurrency,
      rate: rate ?? this.rate,
      date: date ?? this.date,
      source: source ?? this.source,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

