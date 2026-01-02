import 'package:get_it/get_it.dart';

final getIt = GetIt.instance;

/// 의존성 주입 초기화
/// 각 Phase에서 필요한 서비스와 Repository를 등록합니다
Future<void> setupDependencyInjection() async {
  // Phase 3-4에서 Repository 등록
  // Phase 5-7에서 BLoC 등록
  // Phase 3에서 HTTP 클라이언트 등록
}

