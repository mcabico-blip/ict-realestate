import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart' as launcher;

import '../api_client.dart';
import '../format.dart';
import '../models.dart';

class PropertyDetailScreen extends StatefulWidget {
  final String propertyId;
  final bool isLoggedIn;
  const PropertyDetailScreen({super.key, required this.propertyId, required this.isLoggedIn});

  @override
  State<PropertyDetailScreen> createState() => _PropertyDetailScreenState();
}

class _PropertyDetailScreenState extends State<PropertyDetailScreen> {
  late Future<PropertyDetail> _future;
  bool _favorited = false;
  bool _favBusy = false;
  bool _favLoaded = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
    if (widget.isLoggedIn) _loadFav();
  }

  Future<PropertyDetail> _load() async {
    final data = await ApiClient.get('/api/mobile/properties/${widget.propertyId}');
    return PropertyDetail.fromJson(data['property'] as Map<String, dynamic>);
  }

  Future<void> _loadFav() async {
    try {
      final data = await ApiClient.get(
        '/api/mobile/favorites',
        query: {'propertyId': widget.propertyId},
        requireAuth: true,
      );
      if (!mounted) return;
      setState(() {
        _favorited = data['favorited'] == true;
        _favLoaded = true;
      });
    } catch (_) {
      // ignore — favorites are optional UX
    }
  }

  Future<void> _toggleFav() async {
    if (!widget.isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sign in to save favorites')),
      );
      return;
    }
    setState(() {
      _favorited = !_favorited;
      _favBusy = true;
    });
    try {
      final data = await ApiClient.post(
        '/api/mobile/favorites',
        body: {'propertyId': widget.propertyId},
        requireAuth: true,
      );
      if (!mounted) return;
      setState(() => _favorited = data['favorited'] == true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _favorited = !_favorited); // revert
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed: $e')),
      );
    } finally {
      if (mounted) setState(() => _favBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FutureBuilder<PropertyDetail>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError || !snap.hasData) {
            return Scaffold(
              appBar: AppBar(),
              body: Center(
                child: Text(snap.error?.toString() ?? 'Property not found',
                    style: const TextStyle(color: Colors.grey)),
              ),
            );
          }
          final p = snap.data!;
          return CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 280,
                pinned: true,
                backgroundColor: Colors.white,
                foregroundColor: Colors.black,
                actions: [
                  if (_favLoaded || !widget.isLoggedIn)
                    IconButton(
                      icon: Icon(
                        _favorited ? Icons.favorite : Icons.favorite_border,
                        color: _favorited ? Colors.red.shade600 : null,
                      ),
                      onPressed: _favBusy ? null : _toggleFav,
                    ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: p.images.isEmpty
                      ? Container(
                          color: Colors.grey.shade100,
                          alignment: Alignment.center,
                          child: const Text('🏠', style: TextStyle(fontSize: 80)),
                        )
                      : PageView.builder(
                          itemCount: p.images.length,
                          itemBuilder: (_, i) => CachedNetworkImage(
                            imageUrl: p.images[i].url,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => Container(color: Colors.grey.shade100),
                            errorWidget: (_, __, ___) => Container(
                              color: Colors.grey.shade100,
                              alignment: Alignment.center,
                              child: const Text('🏠', style: TextStyle(fontSize: 80)),
                            ),
                          ),
                        ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // Badges
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        _badge(listingLabel(p.listingType), _listingColor(p.listingType)),
                        _badge(propertyTypeLabel(p.propertyType), Colors.grey.shade700),
                        if (p.featured) _badge('Featured', const Color(0xFFEAB308)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(p.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 14, color: Colors.grey),
                        const SizedBox(width: 2),
                        Expanded(
                          child: Text(
                            '${p.address}, ${p.city}, ${p.province}',
                            style: const TextStyle(color: Colors.grey, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          formatPrice(p.price),
                          style: TextStyle(color: Colors.red.shade600, fontSize: 26, fontWeight: FontWeight.bold),
                        ),
                        if (p.listingType != 'FOR_SALE')
                          const Text('/mo', style: TextStyle(color: Colors.grey, fontSize: 14)),
                        const Spacer(),
                        if (p.negotiable)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: Colors.green.shade50,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text('Negotiable',
                                style: TextStyle(color: Colors.green.shade700, fontSize: 11, fontWeight: FontWeight.w600)),
                          ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Specs
                    _section(
                      'Property Details',
                      child: Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: [
                          if (p.bedrooms != null) _specBox(Icons.bed, '${p.bedrooms}', 'Bedrooms'),
                          if (p.bathrooms != null) _specBox(Icons.bathtub, '${p.bathrooms}', 'Bathrooms'),
                          if (p.floorArea != null) _specBox(Icons.aspect_ratio, '${p.floorArea} sqm', 'Floor Area'),
                          if (p.parkingSpaces != null) _specBox(Icons.directions_car, '${p.parkingSpaces}', 'Parking'),
                          if (p.lotArea != null) _specBox(Icons.terrain, '${p.lotArea} sqm', 'Lot Area'),
                          if (p.yearBuilt != null) _specBox(Icons.calendar_today, '${p.yearBuilt}', 'Year Built'),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),
                    _section('Description', child: Text(p.description, style: const TextStyle(height: 1.5))),

                    if (p.amenities.isNotEmpty) ...[
                      const SizedBox(height: 20),
                      _section(
                        'Amenities',
                        child: Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: p.amenities
                              .map((a) => Chip(
                                    label: Text(a, style: const TextStyle(fontSize: 12)),
                                    visualDensity: VisualDensity.compact,
                                    avatar: Icon(Icons.check_circle, size: 14, color: Colors.green.shade600),
                                    backgroundColor: Colors.grey.shade50,
                                    side: BorderSide(color: Colors.grey.shade200),
                                  ))
                              .toList(),
                        ),
                      ),
                    ],

                    const SizedBox(height: 20),
                    _section(
                      'Contact Lister',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: Colors.red.shade100,
                                radius: 22,
                                child: Text(
                                  p.owner.name?.isNotEmpty == true ? p.owner.name![0].toUpperCase() : '?',
                                  style: TextStyle(color: Colors.red.shade700, fontWeight: FontWeight.bold),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(p.owner.name ?? '—', style: const TextStyle(fontWeight: FontWeight.w600)),
                                    Text(
                                      p.owner.role == 'BROKER'
                                          ? 'Licensed Real Estate Broker'
                                          : p.owner.role == 'SALESPERSON'
                                              ? 'Licensed Salesperson'
                                              : 'Property Owner',
                                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                                    ),
                                    if (p.owner.agency != null)
                                      Text(p.owner.agency!, style: const TextStyle(color: Colors.grey, fontSize: 11)),
                                    if (p.owner.licenseNo != null)
                                      Text('PRC ${p.owner.licenseNo}',
                                          style: TextStyle(color: Colors.blue.shade700, fontSize: 11, fontWeight: FontWeight.w500)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          if (p.owner.phone != null)
                            _contactButton(Icons.phone, p.owner.phone!, () {
                              launcher.launchUrl(Uri.parse('tel:${p.owner.phone}'));
                            }),
                          if (p.owner.phone != null) const SizedBox(height: 6),
                          _contactButton(Icons.mail, p.owner.email, () {
                            launcher.launchUrl(Uri.parse('mailto:${p.owner.email}'));
                          }),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                  ]),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _badge(String text, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(20)),
        child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
      );

  Color _listingColor(String type) {
    switch (type) {
      case 'FOR_SALE':
        return Colors.red.shade600;
      case 'FOR_RENT':
        return Colors.blue.shade600;
      case 'FOR_LEASE':
        return Colors.purple.shade600;
      default:
        return Colors.grey;
    }
  }

  Widget _section(String title, {required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  Widget _specBox(IconData icon, String value, String label) {
    return Container(
      width: 100,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(12)),
      child: Column(
        children: [
          Icon(icon, color: Colors.red.shade600, size: 22),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 10)),
        ],
      ),
    );
  }

  Widget _contactButton(IconData icon, String text, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: Colors.red.shade600),
            const SizedBox(width: 10),
            Expanded(child: Text(text, style: const TextStyle(fontSize: 13))),
          ],
        ),
      ),
    );
  }
}
