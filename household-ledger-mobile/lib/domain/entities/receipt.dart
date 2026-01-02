enum OcrStatus {
  pending,
  processing,
  completed,
  failed,
}

class Receipt {
  final int id;
  final int? transactionId;
  final int userId;
  final int? groupId;
  final String imageUrl;
  final Map<String, dynamic>? ocrResult;
  final OcrStatus ocrStatus;
  final int? extractedAmount;
  final DateTime? extractedDate;
  final String? extractedMerchant;
  final List<Map<String, dynamic>>? extractedItems;
  final double? confidenceScore;
  final bool verified;
  final DateTime createdAt;
  final DateTime updatedAt;

  Receipt({
    required this.id,
    this.transactionId,
    required this.userId,
    this.groupId,
    required this.imageUrl,
    this.ocrResult,
    required this.ocrStatus,
    this.extractedAmount,
    this.extractedDate,
    this.extractedMerchant,
    this.extractedItems,
    this.confidenceScore,
    required this.verified,
    required this.createdAt,
    required this.updatedAt,
  });

  Receipt copyWith({
    int? id,
    int? transactionId,
    int? userId,
    int? groupId,
    String? imageUrl,
    Map<String, dynamic>? ocrResult,
    OcrStatus? ocrStatus,
    int? extractedAmount,
    DateTime? extractedDate,
    String? extractedMerchant,
    List<Map<String, dynamic>>? extractedItems,
    double? confidenceScore,
    bool? verified,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Receipt(
      id: id ?? this.id,
      transactionId: transactionId ?? this.transactionId,
      userId: userId ?? this.userId,
      groupId: groupId ?? this.groupId,
      imageUrl: imageUrl ?? this.imageUrl,
      ocrResult: ocrResult ?? this.ocrResult,
      ocrStatus: ocrStatus ?? this.ocrStatus,
      extractedAmount: extractedAmount ?? this.extractedAmount,
      extractedDate: extractedDate ?? this.extractedDate,
      extractedMerchant: extractedMerchant ?? this.extractedMerchant,
      extractedItems: extractedItems ?? this.extractedItems,
      confidenceScore: confidenceScore ?? this.confidenceScore,
      verified: verified ?? this.verified,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

