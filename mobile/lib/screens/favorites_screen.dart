import 'package:flutter/material.dart';
import '../api_client.dart';
import '../models.dart';
import '../widgets/property_card_tile.dart';
import 'property_detail_screen.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  late Future<List<PropertyCard>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<PropertyCard>> _load() async {
    final data = await ApiClient.get('/api/mobile/favorites', requireAuth: true);
    final list = data['favorites'] as List;
    return list
        .map((f) => PropertyCard.fromJson(((f as Map<String, dynamic>)['property']) as Map<String, dynamic>))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<PropertyCard>>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snap.hasError) {
          return Center(child: Text('Could not load favorites\n${snap.error}', textAlign: TextAlign.center));
        }
        final list = snap.data ?? const [];
        if (list.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.favorite_border, size: 56, color: Colors.grey.shade300),
                  const SizedBox(height: 12),
                  const Text('No saved properties yet', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  const Text(
                    'Tap the ❤️ on any property to save it here',
                    style: TextStyle(color: Colors.grey, fontSize: 13),
                  ),
                ],
              ),
            ),
          );
        }
        return RefreshIndicator(
          onRefresh: () async {
            setState(() => _future = _load());
            await _future;
          },
          child: ListView(
            padding: const EdgeInsets.only(top: 8, bottom: 24),
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Text(
                  '${list.length} saved',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                ),
              ),
              ...list.map((p) => PropertyCardTile(
                    property: p,
                    onTap: () {
                      Navigator.of(context).push(MaterialPageRoute(
                        builder: (_) => PropertyDetailScreen(propertyId: p.id, isLoggedIn: true),
                      ));
                    },
                  )),
            ],
          ),
        );
      },
    );
  }
}
