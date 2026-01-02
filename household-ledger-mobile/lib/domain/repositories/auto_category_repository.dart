class AutoCategorySuggestion {
  final int categoryId;
  final String categoryName;
  final double confidence;

  AutoCategorySuggestion({
    required this.categoryId,
    required this.categoryName,
    required this.confidence,
  });
}

abstract class AutoCategoryRepository {
  Future<AutoCategorySuggestion?> suggestCategory({
    required String merchant,
    int? amount,
    String? memo,
  });

  Future<void> provideFeedback({
    required int transactionId,
    required int categoryId,
    required bool isCorrect,
  });
}

