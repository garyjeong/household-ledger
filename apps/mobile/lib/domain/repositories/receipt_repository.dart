import '../entities/receipt.dart';

abstract class ReceiptRepository {
  Future<List<Receipt>> getReceipts({int? groupId});

  Future<Receipt> getReceipt(int id);

  Future<Receipt> uploadReceipt({
    required String imagePath,
    int? groupId,
  });

  Future<Receipt> updateReceipt(Receipt receipt);

  Future<void> deleteReceipt(int id);
}

