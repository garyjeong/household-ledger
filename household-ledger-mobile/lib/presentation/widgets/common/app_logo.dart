import 'package:flutter/material.dart';

class AppLogo extends StatelessWidget {
  final double? size;

  const AppLogo({super.key, this.size});

  @override
  Widget build(BuildContext context) {
    return Icon(
      Icons.account_balance_wallet,
      size: size ?? 64,
      color: Theme.of(context).colorScheme.primary,
    );
  }
}

