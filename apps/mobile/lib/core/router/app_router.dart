import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../presentation/pages/login/login_page.dart';
import '../presentation/pages/signup/signup_page.dart';
import '../presentation/pages/dashboard/dashboard_page.dart';
import '../presentation/pages/transactions/transaction_list_page.dart';
import '../presentation/pages/categories/category_list_page.dart';
import '../presentation/pages/groups/group_list_page.dart';
import '../presentation/pages/statistics/statistics_page.dart';
import '../presentation/pages/profile/profile_page.dart';

// 라우트 경로 상수
class AppRoutes {
  static const String login = '/login';
  static const String signup = '/signup';
  static const String dashboard = '/dashboard';
  static const String transactions = '/transactions';
  static const String transactionDetail = '/transactions/:id';
  static const String transactionForm = '/transactions/form';
  static const String categories = '/categories';
  static const String groups = '/groups';
  static const String statistics = '/statistics';
  static const String profile = '/profile';
}

// 라우터 설정
final GoRouter appRouter = GoRouter(
  initialLocation: AppRoutes.login,
  routes: [
    GoRoute(
      path: AppRoutes.login,
      builder: (context, state) => const LoginPage(),
    ),
    GoRoute(
      path: AppRoutes.signup,
      builder: (context, state) => const SignupPage(),
    ),
    GoRoute(
      path: AppRoutes.dashboard,
      builder: (context, state) => const DashboardPage(),
    ),
    GoRoute(
      path: AppRoutes.transactions,
      builder: (context, state) => const TransactionListPage(),
    ),
    GoRoute(
      path: AppRoutes.categories,
      builder: (context, state) => const CategoryListPage(),
    ),
    GoRoute(
      path: AppRoutes.groups,
      builder: (context, state) => const GroupListPage(),
    ),
    GoRoute(
      path: AppRoutes.statistics,
      builder: (context, state) => const StatisticsPage(),
    ),
    GoRoute(
      path: AppRoutes.profile,
      builder: (context, state) => const ProfilePage(),
    ),
  ],
);

