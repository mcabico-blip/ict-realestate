import 'package:flutter/material.dart';
import '../api_client.dart';
import '../models.dart';
import 'properties_screen.dart';
import 'favorites_screen.dart';
import 'contracts_screen.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  final AppUser? user;
  const HomeScreen({super.key, this.user});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tabIndex = 0;

  List<Widget> get _screens => [
        PropertiesScreen(user: widget.user),
        if (widget.user != null) FavoritesScreen(),
        if (widget.user != null) ContractsScreen(user: widget.user!),
      ];

  List<NavigationDestination> get _destinations => [
        const NavigationDestination(icon: Icon(Icons.search), label: 'Browse'),
        if (widget.user != null)
          const NavigationDestination(icon: Icon(Icons.favorite_border), selectedIcon: Icon(Icons.favorite), label: 'Saved'),
        if (widget.user != null)
          const NavigationDestination(icon: Icon(Icons.gavel_outlined), selectedIcon: Icon(Icons.gavel), label: 'Contracts'),
      ];

  Future<void> _signOut() async {
    await ApiClient.clearToken();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screens = _screens;
    final destinations = _destinations;
    final safeIndex = _tabIndex.clamp(0, screens.length - 1);

    return Scaffold(
      appBar: AppBar(
        title: const Text.rich(
          TextSpan(
            children: [
              TextSpan(text: 'ICT ', style: TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.bold)),
              TextSpan(text: 'Realtors', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        actions: [
          if (widget.user != null)
            PopupMenuButton<String>(
              icon: CircleAvatar(
                backgroundColor: Colors.red.shade100,
                radius: 16,
                child: Text(
                  widget.user!.name?.isNotEmpty == true ? widget.user!.name![0].toUpperCase() : '?',
                  style: TextStyle(color: Colors.red.shade700, fontWeight: FontWeight.bold),
                ),
              ),
              onSelected: (v) {
                if (v == 'signout') _signOut();
              },
              itemBuilder: (_) => [
                PopupMenuItem(
                  enabled: false,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.user!.name ?? widget.user!.email, style: const TextStyle(fontWeight: FontWeight.bold)),
                      Text(widget.user!.role, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                    ],
                  ),
                ),
                const PopupMenuDivider(),
                const PopupMenuItem(value: 'signout', child: Row(children: [Icon(Icons.logout, size: 18), SizedBox(width: 8), Text('Sign Out')])),
              ],
            )
          else
            TextButton(
              onPressed: () {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
              child: const Text('Sign In'),
            ),
        ],
      ),
      body: screens[safeIndex],
      bottomNavigationBar: destinations.length < 2
          ? null
          : NavigationBar(
              selectedIndex: safeIndex,
              onDestinationSelected: (i) => setState(() => _tabIndex = i),
              destinations: destinations,
            ),
    );
  }
}
