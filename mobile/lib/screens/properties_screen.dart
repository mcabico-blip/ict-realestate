import 'package:flutter/material.dart';
import '../api_client.dart';
import '../models.dart';
import '../widgets/property_card_tile.dart';
import 'property_detail_screen.dart';

class PropertiesScreen extends StatefulWidget {
  final AppUser? user;
  const PropertiesScreen({super.key, this.user});

  @override
  State<PropertiesScreen> createState() => _PropertiesScreenState();
}

class _PropertiesScreenState extends State<PropertiesScreen> {
  String? _listingFilter;
  String _cityFilter = '';
  final _cityCtl = TextEditingController();

  late Future<List<PropertyCard>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void dispose() {
    _cityCtl.dispose();
    super.dispose();
  }

  Future<List<PropertyCard>> _load() async {
    final q = <String, String>{};
    if (_listingFilter != null) q['listing'] = _listingFilter!;
    if (_cityFilter.isNotEmpty) q['city'] = _cityFilter;
    final data = await ApiClient.get('/api/mobile/properties', query: q);
    return (data['properties'] as List)
        .map((p) => PropertyCard.fromJson(p as Map<String, dynamic>))
        .toList();
  }

  void _setListing(String? v) {
    setState(() {
      _listingFilter = v;
      _future = _load();
    });
  }

  void _applyCity() {
    setState(() {
      _cityFilter = _cityCtl.text.trim();
      _future = _load();
    });
  }

  Widget _tab(String label, String? value) {
    final selected = _listingFilter == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => _setListing(value),
        child: Container(
          alignment: Alignment.center,
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected ? Colors.red.shade50 : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: selected ? Colors.red.shade700 : Colors.grey.shade600,
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Filter bar
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    _tab('All', null),
                    _tab('For Sale', 'FOR_SALE'),
                    _tab('For Rent', 'FOR_RENT'),
                    _tab('For Lease', 'FOR_LEASE'),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _cityCtl,
                      decoration: InputDecoration(
                        hintText: 'City (e.g. Makati, Cebu)',
                        prefixIcon: const Icon(Icons.location_on_outlined, size: 18),
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onSubmitted: (_) => _applyCity(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.red.shade600,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    onPressed: _applyCity,
                    child: const Text('Search'),
                  ),
                ],
              ),
            ],
          ),
        ),
        // Property list
        Expanded(
          child: FutureBuilder<List<PropertyCard>>(
            future: _future,
            builder: (context, snap) {
              if (snap.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snap.hasError) {
                return Padding(
                  padding: const EdgeInsets.all(24),
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: Colors.grey),
                        const SizedBox(height: 12),
                        Text('Could not load properties\n${snap.error}', textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
                        const SizedBox(height: 16),
                        FilledButton(
                          onPressed: () => setState(() => _future = _load()),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                );
              }
              final list = snap.data ?? const [];
              if (list.isEmpty) {
                return const Center(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Text('No properties match these filters.', style: TextStyle(color: Colors.grey)),
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
                        '${list.length} ${list.length == 1 ? "property" : "properties"} found',
                        style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                      ),
                    ),
                    ...list.map((p) => PropertyCardTile(
                          property: p,
                          onTap: () {
                            Navigator.of(context).push(MaterialPageRoute(
                              builder: (_) => PropertyDetailScreen(propertyId: p.id, isLoggedIn: widget.user != null),
                            ));
                          },
                        )),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
