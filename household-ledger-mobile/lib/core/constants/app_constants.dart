class AppConstants {
  // 페이지네이션
  static const int defaultPageSize = 50;
  static const int maxPageSize = 100;

  // 날짜 형식
  static const String dateFormat = 'yyyy-MM-dd';
  static const String dateTimeFormat = 'yyyy-MM-dd HH:mm:ss';
  static const String monthFormat = 'yyyy-MM';

  // 통화
  static const String defaultCurrency = 'KRW';
  static const List<String> supportedCurrencies = [
    'KRW',
    'USD',
    'EUR',
    'JPY',
    'CNY',
  ];

  // 거래 타입
  static const String transactionTypeExpense = 'EXPENSE';
  static const String transactionTypeIncome = 'INCOME';
  static const String transactionTypeTransfer = 'TRANSFER';

  // 예산 상태
  static const String budgetStatusActive = 'ACTIVE';
  static const String budgetStatusClosed = 'CLOSED';
  static const String budgetStatusDraft = 'DRAFT';

  // 반복 주기
  static const String recurringFrequencyMonthly = 'MONTHLY';
  static const String recurringFrequencyWeekly = 'WEEKLY';
  static const String recurringFrequencyDaily = 'DAILY';

  // OCR 상태
  static const String ocrStatusPending = 'PENDING';
  static const String ocrStatusProcessing = 'PROCESSING';
  static const String ocrStatusCompleted = 'COMPLETED';
  static const String ocrStatusFailed = 'FAILED';
}

