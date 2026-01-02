# Household Ledger - Mobile App Technical Requirements Document (TRD)

**작성일**: 2025-01-25  
**버전**: 2.0  
**목적**: Flutter 모바일 앱의 기술적 구현 요구사항 정의서

---

## 목차

1. [개요](#1-개요)
2. [기술 스택](#2-기술-스택)
3. [프로젝트 구조](#3-프로젝트-구조)
4. [아키텍처 설계](#4-아키텍처-설계)
5. [상태 관리](#5-상태-관리)
6. [네트워크 구현](#6-네트워크-구현)
7. [실시간 통신 구현](#7-실시간-통신-구현)
8. [UI/UX 구현](#8-uiux-구현)
9. [로컬 스토리지](#9-로컬-스토리지)
10. [테스트 전략](#10-테스트-전략)
11. [배포 및 운영](#11-배포-및-운영)

---

## 1. 개요

### 1.1 목적

Household Ledger 모바일 앱은 Flutter로 구현되며, Rust 백엔드 API와 통신하여 신혼부부 가계부 서비스를 제공합니다.

### 1.2 주요 기능

- 인증 및 사용자 관리
- 거래 관리 (CRUD, 다중 통화, OCR 연동)
- 카테고리 및 태그 관리
- 통계 및 대시보드
- 예산 관리
- 반복 거래 규칙
- 그룹 관리
- OCR 영수증 인식
- 자동 카테고리 분류
- 실시간 동기화 (WebSocket, SSE)

### 1.3 참고 문서

- [PRD.md](./PRD.md): 전체 제품 요구사항 문서
- [TRD_BACKEND.md](./TRD_BACKEND.md): 백엔드 기술 요구사항 문서

---

## 2. 기술 스택

### 2.1 핵심 프레임워크

- **Flutter**: 최신 안정 버전 (3.x 이상)
- **Dart**: 3.x
- **최소 Android 버전**: Android 8.0 (API 26)
- **타겟 Android 버전**: Android 14 (API 34)

### 2.2 주요 의존성 (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter

  # 상태 관리
  flutter_bloc: ^8.1.3
  equatable: ^2.0.5

  # 네트워크
  dio: ^5.4.0
  retrofit: ^4.0.3
  json_annotation: ^4.8.1

  # 실시간 통신
  web_socket_channel: ^2.4.0
  sse_client: ^1.0.0

  # 로컬 스토리지
  shared_preferences: ^2.2.2
  hive: ^2.2.3
  hive_flutter: ^1.1.0

  # 의존성 주입
  get_it: ^7.6.4

  # UI 컴포넌트
  flutter_svg: ^2.0.9
  cached_network_image: ^3.3.1
  image_picker: ^1.0.5
  file_picker: ^6.1.1

  # 차트
  fl_chart: ^0.66.0

  # 색상 선택
  flutter_colorpicker: ^1.0.3

  # 날짜/시간
  intl: ^0.19.0

  # 유틸리티
  uuid: ^4.2.1
  path_provider: ^2.1.1
  permission_handler: ^11.1.0

  # 로깅
  logger: ^2.0.2

dev_dependencies:
  flutter_test:
    sdk: flutter

  # 코드 생성
  build_runner: ^2.4.7
  json_serializable: ^6.7.1
  retrofit_generator: ^8.0.6
  hive_generator: ^2.0.1

  # 테스트
  mockito: ^5.4.4
  bloc_test: ^9.1.5
```

---

## 3. 프로젝트 구조

### 3.1 Monorepo 내 위치

```
household-ledger/
├── apps/
│   └── mobile/                 # Flutter 앱
│       ├── pubspec.yaml
│       ├── lib/
│       │   ├── main.dart
│       │   ├── config/
│       │   │   └── app_config.dart
│       │   ├── core/
│       │   │   ├── constants/
│       │   │   │   └── app_constants.dart
│       │   │   ├── router/
│       │   │   │   └── app_router.dart
│       │   │   ├── theme/
│       │   │   │   └── app_theme.dart
│       │   │   ├── utils/
│       │   │   │   ├── dependency_injection.dart
│       │   │   │   └── validators.dart
│       │   │   └── errors/
│       │   │       └── app_exceptions.dart
│       │   ├── data/
│       │   │   ├── datasources/
│       │   │   │   ├── local/
│       │   │   │   │   └── local_storage.dart
│       │   │   │   └── remote/
│       │   │   │       ├── api_client.dart
│       │   │   │       ├── auth_api.dart
│       │   │   │       ├── transaction_api.dart
│       │   │   │       ├── category_api.dart
│       │   │   │       ├── statistics_api.dart
│       │   │   │       ├── group_api.dart
│       │   │   │       ├── balance_api.dart
│       │   │   │       ├── budget_api.dart
│       │   │   │       ├── settings_api.dart
│       │   │   │       ├── recurring_rule_api.dart
│       │   │   │       ├── exchange_rate_api.dart
│       │   │   │       ├── receipt_api.dart
│       │   │   │       └── auto_category_api.dart
│       │   │   ├── models/
│       │   │   │   ├── user_model.dart
│       │   │   │   ├── transaction_model.dart
│       │   │   │   ├── category_model.dart
│       │   │   │   └── ...
│       │   │   ├── providers/
│       │   │   │   └── http_client.dart
│       │   │   └── repositories/
│       │   │       ├── auth_repository.dart
│       │   │       ├── transaction_repository.dart
│       │   │       ├── category_repository.dart
│       │   │       ├── statistics_repository.dart
│       │   │       ├── group_repository.dart
│       │   │       ├── balance_repository.dart
│       │   │       ├── budget_repository.dart
│       │   │       ├── settings_repository.dart
│       │   │       ├── recurring_rule_repository.dart
│       │   │       ├── exchange_rate_repository.dart
│       │   │       ├── receipt_repository.dart
│       │   │       └── auto_category_repository.dart
│       │   ├── domain/
│       │   │   ├── entities/
│       │   │   │   ├── user.dart
│       │   │   │   ├── transaction.dart
│       │   │   │   └── ...
│       │   │   └── repositories/
│       │   │       └── (인터페이스 정의)
│       │   └── presentation/
│       │       ├── bloc/
│       │       │   ├── auth/
│       │       │   │   ├── auth_bloc.dart
│       │       │   │   ├── auth_event.dart
│       │       │   │   └── auth_state.dart
│       │       │   ├── transaction/
│       │       │   │   ├── transaction_bloc.dart
│       │       │   │   ├── transaction_event.dart
│       │       │   │   └── transaction_state.dart
│       │       │   ├── category/
│       │       │   ├── statistics/
│       │       │   ├── group/
│       │       │   ├── balance/
│       │       │   ├── budget/
│       │       │   ├── settings/
│       │       │   ├── recurring_rule/
│       │       │   ├── exchange_rate/
│       │       │   ├── receipt/
│       │       │   └── auto_category/
│       │       ├── pages/
│       │       │   ├── login/
│       │       │   ├── signup/
│       │       │   ├── forgot_password/
│       │       │   ├── dashboard/
│       │       │   ├── transactions/
│       │       │   │   ├── transaction_list_page.dart
│       │       │   │   ├── transaction_detail_page.dart
│       │       │   │   └── quick_add_modal.dart
│       │       │   ├── statistics/
│       │       │   ├── profile/
│       │       │   ├── categories/
│       │       │   ├── groups/
│       │       │   ├── budgets/
│       │       │   ├── recurring_rules/
│       │       │   ├── balance/
│       │       │   ├── receipts/
│       │       │   └── auto_category/
│       │       └── widgets/
│       │           ├── common/
│       │           │   ├── app_logo.dart
│       │           │   ├── bottom_nav_bar.dart
│       │           │   ├── loading_button.dart
│       │           │   └── currency_picker.dart
│       │           └── charts/
│       │               ├── pie_chart_widget.dart
│       │               └── line_chart_widget.dart
│       ├── test/
│       │   ├── unit/
│       │   ├── widget/
│       │   └── integration/
│       └── android/
│           └── (Android 설정)
```

---

## 4. 아키텍처 설계

### 4.1 Clean Architecture 계층

#### 4.1.1 Domain Layer (도메인 계층)

**역할**: 비즈니스 엔티티 및 규칙

**구성**:
- **Entities**: 순수 Dart 클래스 (비즈니스 로직)
- **Repository Interfaces**: 데이터 접근 추상화

**예시: Transaction Entity**
```dart
// lib/domain/entities/transaction.dart
class Transaction {
  final int id;
  final int? groupId;
  final int ownerUserId;
  final TransactionType type;
  final DateTime date;
  final int amount;
  final String? currencyCode;
  final int? originalAmount;
  final int? categoryId;
  final int? tagId;
  final int? recurringRuleId;
  final int? receiptId;
  final String? merchant;
  final String? memo;
  final DateTime createdAt;
  final DateTime updatedAt;

  Transaction({
    required this.id,
    this.groupId,
    required this.ownerUserId,
    required this.type,
    required this.date,
    required this.amount,
    this.currencyCode,
    this.originalAmount,
    this.categoryId,
    this.tagId,
    this.recurringRuleId,
    this.receiptId,
    this.merchant,
    this.memo,
    required this.createdAt,
    required this.updatedAt,
  });
}

enum TransactionType {
  expense,
  income,
  transfer,
}
```

#### 4.1.2 Data Layer (데이터 계층)

**역할**: 데이터 소스 및 Repository 구현

**구성**:
- **Data Sources**: Remote (API), Local (SharedPreferences, Hive)
- **Models**: JSON 직렬화/역직렬화
- **Repository Implementations**: Domain Repository 인터페이스 구현

**예시: Transaction Repository**
```dart
// lib/data/repositories/transaction_repository.dart
class TransactionRepositoryImpl implements TransactionRepository {
  final TransactionApi _api;
  final LocalStorage _localStorage;

  TransactionRepositoryImpl({
    required TransactionApi api,
    required LocalStorage localStorage,
  })  : _api = api,
        _localStorage = localStorage;

  @override
  Future<List<Transaction>> getTransactions({
    int? groupId,
    DateTime? startDate,
    DateTime? endDate,
    int? categoryId,
    String? search,
    int limit = 50,
    int offset = 0,
  }) async {
    try {
      final response = await _api.getTransactions(
        groupId: groupId,
        startDate: startDate?.toIso8601String().split('T')[0],
        endDate: endDate?.toIso8601String().split('T')[0],
        categoryId: categoryId,
        search: search,
        limit: limit,
        offset: offset,
      );
      return response.items.map((e) => e.toEntity()).toList();
    } catch (e) {
      throw RepositoryException('Failed to fetch transactions: $e');
    }
  }

  @override
  Future<Transaction> createTransaction(Transaction transaction) async {
    try {
      final request = TransactionCreateRequest.fromEntity(transaction);
      final response = await _api.createTransaction(request);
      return response.toEntity();
    } catch (e) {
      throw RepositoryException('Failed to create transaction: $e');
    }
  }
}
```

#### 4.1.3 Presentation Layer (프레젠테이션 계층)

**역할**: UI 및 상태 관리

**구성**:
- **BLoC**: 상태 관리
- **Pages**: 화면
- **Widgets**: 재사용 가능한 UI 컴포넌트

---

## 5. 상태 관리

### 5.1 BLoC 패턴

#### 5.1.1 Transaction BLoC 예시

```dart
// lib/presentation/bloc/transaction/transaction_bloc.dart
class TransactionBloc extends Bloc<TransactionEvent, TransactionState> {
  final TransactionRepository _repository;

  TransactionBloc({required TransactionRepository repository})
      : _repository = repository,
        super(TransactionInitial()) {
    on<LoadTransactions>(_onLoadTransactions);
    on<CreateTransaction>(_onCreateTransaction);
    on<UpdateTransaction>(_onUpdateTransaction);
    on<DeleteTransaction>(_onDeleteTransaction);
  }

  Future<void> _onLoadTransactions(
    LoadTransactions event,
    Emitter<TransactionState> emit,
  ) async {
    emit(TransactionLoading());
    try {
      final transactions = await _repository.getTransactions(
        groupId: event.groupId,
        startDate: event.startDate,
        endDate: event.endDate,
        limit: event.limit,
        offset: event.offset,
      );
      emit(TransactionLoaded(transactions: transactions));
    } catch (e) {
      emit(TransactionError(message: e.toString()));
    }
  }

  Future<void> _onCreateTransaction(
    CreateTransaction event,
    Emitter<TransactionState> emit,
  ) async {
    try {
      final transaction = await _repository.createTransaction(event.transaction);
      emit(TransactionCreated(transaction: transaction));
      // 거래 목록 새로고침
      add(LoadTransactions());
    } catch (e) {
      emit(TransactionError(message: e.toString()));
    }
  }
}
```

#### 5.1.2 BLoC 이벤트 및 상태

```dart
// lib/presentation/bloc/transaction/transaction_event.dart
abstract class TransactionEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LoadTransactions extends TransactionEvent {
  final int? groupId;
  final DateTime? startDate;
  final DateTime? endDate;
  final int limit;
  final int offset;

  LoadTransactions({
    this.groupId,
    this.startDate,
    this.endDate,
    this.limit = 50,
    this.offset = 0,
  });

  @override
  List<Object?> get props => [groupId, startDate, endDate, limit, offset];
}

class CreateTransaction extends TransactionEvent {
  final Transaction transaction;

  CreateTransaction({required this.transaction});

  @override
  List<Object?> get props => [transaction];
}
```

```dart
// lib/presentation/bloc/transaction/transaction_state.dart
abstract class TransactionState extends Equatable {
  @override
  List<Object?> get props => [];
}

class TransactionInitial extends TransactionState {}

class TransactionLoading extends TransactionState {}

class TransactionLoaded extends TransactionState {
  final List<Transaction> transactions;

  TransactionLoaded({required this.transactions});

  @override
  List<Object?> get props => [transactions];
}

class TransactionError extends TransactionState {
  final String message;

  TransactionError({required this.message});

  @override
  List<Object?> get props => [message];
}
```

---

## 6. 네트워크 구현

### 6.1 HTTP 클라이언트 설정

```dart
// lib/data/providers/http_client.dart
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  late final Dio _dio;
  final String baseUrl;

  ApiClient({required this.baseUrl}) {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _dio.interceptors.add(AuthInterceptor());
    _dio.interceptors.add(LoggingInterceptor());
    _dio.interceptors.add(ErrorInterceptor());
  }

  Dio get dio => _dio;
}
```

### 6.2 인증 인터셉터

```dart
// lib/data/providers/http_client.dart
class AuthInterceptor extends Interceptor {
  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // 토큰 갱신 시도
      final refreshed = await _refreshToken();
      if (refreshed) {
        // 원래 요청 재시도
        final opts = err.requestOptions;
        final prefs = await SharedPreferences.getInstance();
        opts.headers['Authorization'] = 'Bearer ${prefs.getString('access_token')}';
        final response = await _dio.fetch(opts);
        return handler.resolve(response);
      } else {
        // 로그아웃 처리
        await _logout();
      }
    }
    handler.next(err);
  }

  Future<bool> _refreshToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final refreshToken = prefs.getString('refresh_token');
      if (refreshToken == null) return false;

      final response = await _dio.post('/api/v2/auth/refresh', data: {
        'refresh_token': refreshToken,
      });

      await prefs.setString('access_token', response.data['access_token']);
      return true;
    } catch (e) {
      return false;
    }
  }
}
```

### 6.3 API 클라이언트 (Retrofit)

```dart
// lib/data/datasources/remote/transaction_api.dart
import 'package:retrofit/retrofit.dart';
import 'package:dio/dio.dart';

part 'transaction_api.g.dart';

@RestApi()
abstract class TransactionApi {
  factory TransactionApi(Dio dio, {String baseUrl}) = _TransactionApi;

  @GET('/api/v2/transactions')
  Future<TransactionListResponse> getTransactions({
    @Query('group_id') int? groupId,
    @Query('start_date') String? startDate,
    @Query('end_date') String? endDate,
    @Query('category_id') int? categoryId,
    @Query('search') String? search,
    @Query('limit') int limit = 50,
    @Query('offset') int offset = 0,
  });

  @POST('/api/v2/transactions')
  Future<TransactionResponse> createTransaction(
    @Body() TransactionCreateRequest request,
  );

  @GET('/api/v2/transactions/{id}')
  Future<TransactionResponse> getTransaction(@Path('id') int id);

  @PUT('/api/v2/transactions/{id}')
  Future<TransactionResponse> updateTransaction(
    @Path('id') int id,
    @Body() TransactionUpdateRequest request,
  );

  @DELETE('/api/v2/transactions/{id}')
  Future<void> deleteTransaction(@Path('id') int id);

  @POST('/api/v2/transactions/quick-add')
  Future<TransactionResponse> quickAddTransaction(
    @Body() TransactionQuickAddRequest request,
  );
}
```

---

## 7. 실시간 통신 구현

### 7.1 WebSocket 클라이언트

```dart
// lib/data/datasources/remote/websocket_client.dart
import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:convert';

class WebSocketClient {
  WebSocketChannel? _channel;
  final String baseUrl;
  final String? token;

  WebSocketClient({required this.baseUrl, this.token});

  Future<void> connect() async {
    final uri = Uri.parse('$baseUrl/api/v2/ws?token=$token');
    _channel = WebSocketChannel.connect(uri);
  }

  Stream<WsEvent> get stream {
    return _channel!.stream.map((message) {
      final data = jsonDecode(message as String);
      return WsEvent.fromJson(data);
    });
  }

  void send(WsEvent event) {
    _channel?.sink.add(jsonEncode(event.toJson()));
  }

  void subscribeToGroup(int groupId) {
    send(WsEvent.subscribe(groupId: groupId));
  }

  void disconnect() {
    _channel?.sink.close();
  }
}
```

### 7.2 WebSocket BLoC

```dart
// lib/presentation/bloc/realtime/realtime_bloc.dart
class RealtimeBloc extends Bloc<RealtimeEvent, RealtimeState> {
  final WebSocketClient _wsClient;

  RealtimeBloc({required WebSocketClient wsClient})
      : _wsClient = wsClient,
        super(RealtimeDisconnected()) {
    on<ConnectWebSocket>(_onConnect);
    on<DisconnectWebSocket>(_onDisconnect);
    on<SubscribeToGroup>(_onSubscribe);
    on<WsEventReceived>(_onEventReceived);

    // WebSocket 스트림 구독
    _wsClient.stream.listen((event) {
      add(WsEventReceived(event: event));
    });
  }

  Future<void> _onConnect(
    ConnectWebSocket event,
    Emitter<RealtimeState> emit,
  ) async {
    try {
      await _wsClient.connect();
      emit(RealtimeConnected());
    } catch (e) {
      emit(RealtimeError(message: e.toString()));
    }
  }

  void _onEventReceived(
    WsEventReceived event,
    Emitter<RealtimeState> emit,
  ) {
    switch (event.event.type) {
      case WsEventType.transactionCreated:
        emit(TransactionCreatedEvent(transaction: event.event.data));
        break;
      case WsEventType.transactionUpdated:
        emit(TransactionUpdatedEvent(transaction: event.event.data));
        break;
      // ...
    }
  }
}
```

### 7.3 Server-Sent Events 클라이언트

```dart
// lib/data/datasources/remote/sse_client.dart
import 'package:sse_client/sse_client.dart';
import 'dart:convert';

class SseClient {
  SseClient? _client;
  final String baseUrl;
  final String? token;

  SseClient({required this.baseUrl, this.token});

  Future<void> connect() async {
    final uri = Uri.parse('$baseUrl/api/v2/events');
    _client = SseClient.connect(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'text/event-stream',
      },
    );
  }

  Stream<SseEvent> get stream {
    return _client!.stream.map((event) {
      final data = jsonDecode(event.data);
      return SseEvent.fromJson(data);
    });
  }

  void disconnect() {
    _client?.close();
  }
}
```

---

## 8. UI/UX 구현

### 8.1 Material Design 3

#### 테마 설정

```dart
// lib/core/theme/app_theme.dart
import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: Colors.blue,
        brightness: Brightness.light,
      ),
      cardTheme: CardTheme(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        filled: true,
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: Colors.blue,
        brightness: Brightness.dark,
      ),
      // ...
    );
  }
}
```

### 8.2 주요 화면 구현

#### 대시보드 화면

```dart
// lib/presentation/pages/dashboard/dashboard_page.dart
class DashboardPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<StatisticsBloc, StatisticsState>(
      builder: (context, state) {
        if (state is StatisticsLoading) {
          return Center(child: CircularProgressIndicator());
        }
        
        if (state is StatisticsLoaded) {
          return Scaffold(
            appBar: AppBar(title: Text('대시보드')),
            body: ListView(
              children: [
                // 월별 요약 카드
                MonthlySummaryCard(statistics: state.statistics),
                // 최근 거래 목록
                RecentTransactionsList(),
                // 상위 카테고리
                TopCategoriesChart(categories: state.topCategories),
                // 일별 트렌드
                DailyTrendChart(trends: state.dailyTrends),
              ],
            ),
            floatingActionButton: FloatingActionButton(
              onPressed: () => _showQuickAddModal(context),
              child: Icon(Icons.add),
            ),
          );
        }
        
        return ErrorWidget(message: 'Failed to load statistics');
      },
    );
  }
}
```

#### 거래 입력 화면 (다중 통화 지원)

```dart
// lib/presentation/pages/transactions/transaction_form_page.dart
class TransactionFormPage extends StatefulWidget {
  @override
  _TransactionFormPageState createState() => _TransactionFormPageState();
}

class _TransactionFormPageState extends State<TransactionFormPage> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedCurrency;
  int? _amount;
  int? _originalAmount;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('거래 입력')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: EdgeInsets.all(16),
          children: [
            // 통화 선택
            CurrencyPicker(
              selectedCurrency: _selectedCurrency,
              onChanged: (currency) {
                setState(() => _selectedCurrency = currency);
              },
            ),
            // 금액 입력
            TextFormField(
              decoration: InputDecoration(labelText: '금액'),
              keyboardType: TextInputType.number,
              onSaved: (value) => _amount = int.tryParse(value ?? ''),
            ),
            // 환율 변환 표시 (통화가 KRW가 아닌 경우)
            if (_selectedCurrency != null && _selectedCurrency != 'KRW')
              BlocBuilder<ExchangeRateBloc, ExchangeRateState>(
                builder: (context, state) {
                  if (state is ExchangeRateLoaded) {
                    final converted = _convertAmount(
                      _originalAmount ?? 0,
                      _selectedCurrency!,
                      'KRW',
                      state.rate,
                    );
                    return Text('KRW: ${_formatCurrency(converted)}');
                  }
                  return SizedBox.shrink();
                },
              ),
            // 카테고리 선택
            CategoryPicker(),
            // 저장 버튼
            ElevatedButton(
              onPressed: _submit,
              child: Text('저장'),
            ),
          ],
        ),
      ),
    );
  }
}
```

#### OCR 영수증 화면

```dart
// lib/presentation/pages/receipts/receipt_upload_page.dart
class ReceiptUploadPage extends StatefulWidget {
  @override
  _ReceiptUploadPageState createState() => _ReceiptUploadPageState();
}

class _ReceiptUploadPageState extends State<ReceiptUploadPage> {
  File? _imageFile;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.camera);
    if (image != null) {
      setState(() => _imageFile = File(image.path));
      _uploadAndProcess();
    }
  }

  Future<void> _uploadAndProcess() async {
    if (_imageFile == null) return;

    context.read<ReceiptBloc>().add(UploadReceipt(imageFile: _imageFile!));
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ReceiptBloc, ReceiptState>(
      listener: (context, state) {
        if (state is ReceiptOcrCompleted) {
          // OCR 결과 확인 화면으로 이동
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => ReceiptReviewPage(receipt: state.receipt),
            ),
          );
        }
      },
      builder: (context, state) {
        return Scaffold(
          appBar: AppBar(title: Text('영수증 촬영')),
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (state is ReceiptProcessing)
                  CircularProgressIndicator(),
                if (_imageFile != null)
                  Image.file(_imageFile!),
                ElevatedButton(
                  onPressed: _pickImage,
                  child: Text('영수증 촬영'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
```

---

## 9. 로컬 스토리지

### 9.1 SharedPreferences 사용

```dart
// lib/data/datasources/local/local_storage.dart
class LocalStorage {
  final SharedPreferences _prefs;

  LocalStorage(this._prefs);

  // 토큰 저장
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _prefs.setString('access_token', accessToken);
    await _prefs.setString('refresh_token', refreshToken);
  }

  // 토큰 조회
  String? getAccessToken() => _prefs.getString('access_token');
  String? getRefreshToken() => _prefs.getString('refresh_token');

  // 사용자 정보 저장
  Future<void> saveUser(User user) async {
    await _prefs.setString('user', jsonEncode(user.toJson()));
  }

  // 설정 저장
  Future<void> saveSettings(Map<String, dynamic> settings) async {
    await _prefs.setString('settings', jsonEncode(settings));
  }
}
```

### 9.2 Hive 사용 (선택적, 오프라인 캐싱)

```dart
// lib/data/datasources/local/hive_storage.dart
class HiveStorage {
  static Future<void> init() async {
    await Hive.initFlutter();
    Hive.registerAdapter(TransactionAdapter());
    // ...
  }

  Future<void> cacheTransactions(List<Transaction> transactions) async {
    final box = await Hive.openBox<Transaction>('transactions');
    for (final tx in transactions) {
      await box.put(tx.id, tx);
    }
  }

  Future<List<Transaction>> getCachedTransactions() async {
    final box = await Hive.openBox<Transaction>('transactions');
    return box.values.toList();
  }
}
```

---

## 10. 테스트 전략

### 10.1 단위 테스트

```dart
// test/unit/transaction_bloc_test.dart
void main() {
  group('TransactionBloc', () {
    late TransactionBloc bloc;
    late MockTransactionRepository mockRepository;

    setUp(() {
      mockRepository = MockTransactionRepository();
      bloc = TransactionBloc(repository: mockRepository);
    });

    test('initial state is TransactionInitial', () {
      expect(bloc.state, equals(TransactionInitial()));
    });

    blocTest<TransactionBloc, TransactionState>(
      'emits [Loading, Loaded] when LoadTransactions is added',
      build: () {
        when(mockRepository.getTransactions())
            .thenAnswer((_) async => [mockTransaction]);
        return bloc;
      },
      act: (bloc) => bloc.add(LoadTransactions()),
      expect: () => [
        TransactionLoading(),
        TransactionLoaded(transactions: [mockTransaction]),
      ],
    );
  });
}
```

### 10.2 위젯 테스트

```dart
// test/widget/transaction_list_test.dart
void main() {
  testWidgets('TransactionList displays transactions', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: BlocProvider(
          create: (_) => TransactionBloc(
            repository: MockTransactionRepository(),
          )..add(LoadTransactions()),
          child: TransactionListPage(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('거래 목록'), findsOneWidget);
    expect(find.byType(TransactionListItem), findsWidgets);
  });
}
```

---

## 11. 배포 및 운영

### 11.1 Android 빌드 설정

#### build.gradle (app)

```gradle
android {
    compileSdkVersion 34

    defaultConfig {
        applicationId "com.householdledger.app"
        minSdkVersion 26
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

### 11.2 Google Play Store 배포

#### 빌드 프로세스

```bash
# AAB 빌드
flutter build appbundle --release

# APK 빌드 (테스트용)
flutter build apk --release
```

#### 버전 관리

- **Semantic Versioning**: MAJOR.MINOR.PATCH
- **버전 코드**: 자동 증가 (빌드 시)
- **버전 이름**: pubspec.yaml의 version 필드

### 11.3 환경 변수 관리

#### app_config.dart

```dart
// lib/config/app_config.dart
class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8080',
  );

  static const String wsBaseUrl = String.fromEnvironment(
    'WS_BASE_URL',
    defaultValue: 'ws://localhost:8080',
  );
}
```

#### 빌드 시 환경 변수 전달

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://api.example.com
```

---

## 12. 성능 최적화

### 12.1 이미지 최적화

- **캐싱**: cached_network_image 사용
- **리사이징**: 업로드 전 이미지 리사이징
- **지연 로딩**: ListView.builder 사용

### 12.2 네트워크 최적화

- **요청 캐싱**: Dio Interceptor로 GET 요청 캐싱
- **배치 요청**: 여러 요청을 하나로 묶기 (필요 시)
- **재시도 로직**: 네트워크 오류 시 자동 재시도

### 12.3 상태 관리 최적화

- **Equatable 사용**: 불필요한 리빌드 방지
- **BLoC 선택적 구독**: 필요한 위젯만 구독
- **메모이제이션**: 계산 비용이 큰 위젯 메모이제이션

---

## 13. 접근성

### 13.1 접근성 지원

- **Semantics 위젯**: 스크린 리더 지원
- **키보드 네비게이션**: 모든 인터랙티브 요소 접근 가능
- **색상 대비**: WCAG 2.1 AA 준수

---

**문서 버전**: 2.0  
**최종 업데이트**: 2025-01-25  
**작성자**: Household Ledger Development Team

