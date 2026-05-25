import 'package:flutter/material.dart';
import 'api_client.dart';
import 'config.dart';
import 'models.dart';
import 'presence_ticker.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const ICTRealtorsApp());
}

class ICTRealtorsApp extends StatelessWidget {
  const ICTRealtorsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ICT Realtors',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFDC2626),
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: const Color(0xFFFAFAFA),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          centerTitle: false,
          elevation: 0,
          scrolledUnderElevation: 1,
        ),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: Colors.white,
          indicatorColor: Colors.red.shade50,
          labelTextStyle: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.red.shade700);
            }
            return const TextStyle(fontSize: 12, color: Colors.grey);
          }),
          iconTheme: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return IconThemeData(color: Colors.red.shade700);
            }
            return const IconThemeData(color: Colors.grey);
          }),
        ),
      ),
      home: PresenceTicker(child: const _Splash()),
    );
  }
}

/// Decides whether to send the user to login or home based on stored token.
class _Splash extends StatefulWidget {
  const _Splash();

  @override
  State<_Splash> createState() => _SplashState();
}

class _SplashState extends State<_Splash> {
  @override
  void initState() {
    super.initState();
    _decide();
  }

  Future<void> _decide() async {
    final token = await ApiClient.getToken();
    if (!mounted) return;

    if (token == null || token.isEmpty) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
      return;
    }

    // Validate the token by hitting an authed endpoint. If 401, drop to login.
    try {
      final data = await ApiClient.get('/api/mobile/me', requireAuth: true);
      final user = AppUser.fromJson(data['user'] as Map<String, dynamic>);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => HomeScreen(user: user)),
      );
    } catch (_) {
      await ApiClient.clearToken();
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFDF5F5),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.apartment, color: Colors.red.shade600, size: 64),
            const SizedBox(height: 12),
            const Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: 'ICT ',
                    style: TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.bold, fontSize: 24),
                  ),
                  TextSpan(
                    text: 'Realtors',
                    style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 24),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 4),
            Text('Backend: ${AppConfig.apiBase}', style: const TextStyle(color: Colors.grey, fontSize: 11)),
            const SizedBox(height: 24),
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
