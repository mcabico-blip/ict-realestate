import 'dart:async';
import 'package:flutter/widgets.dart';
import 'api_client.dart';

/// Sends a presence heartbeat every 60 seconds — but ONLY while the app
/// is in the foreground (AppLifecycleState.resumed). Goes silent when the
/// app is paused/inactive/detached so we don't claim "online" while the
/// user has the app backgrounded.
///
/// Mount once at the top of the widget tree (App-level). Requires that
/// the auth token is already in secure storage.
class PresenceTicker extends StatefulWidget {
  final Widget child;
  const PresenceTicker({super.key, required this.child});

  @override
  State<PresenceTicker> createState() => _PresenceTickerState();
}

class _PresenceTickerState extends State<PresenceTicker> with WidgetsBindingObserver {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _startIfForeground();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _startIfForeground();
      _beat();
    } else {
      _timer?.cancel();
      _timer = null;
    }
  }

  Future<void> _startIfForeground() async {
    if (WidgetsBinding.instance.lifecycleState == AppLifecycleState.resumed) {
      _timer?.cancel();
      _timer = Timer.periodic(const Duration(seconds: 60), (_) => _beat());
      _beat();
    }
  }

  Future<void> _beat() async {
    final token = await ApiClient.getToken();
    if (token == null || token.isEmpty) return;
    try {
      await ApiClient.post('/api/mobile/presence/heartbeat', requireAuth: true);
    } catch (_) {
      // swallow — best-effort
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
