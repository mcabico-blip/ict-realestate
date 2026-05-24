import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../format.dart';
import '../models.dart';

/// Card showing a single property in the browse / favorites lists.
class PropertyCardTile extends StatelessWidget {
  final PropertyCard property;
  final VoidCallback onTap;
  final Widget? trailing;

  const PropertyCardTile({
    super.key,
    required this.property,
    required this.onTap,
    this.trailing,
  });

  Color _badgeColor() {
    switch (property.listingType) {
      case 'FOR_SALE':
        return Colors.red.shade600;
      case 'FOR_RENT':
        return Colors.blue.shade600;
      case 'FOR_LEASE':
        return Colors.purple.shade600;
      default:
        return Colors.grey.shade600;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 6, offset: const Offset(0, 2)),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Image
              Stack(
                children: [
                  SizedBox(
                    height: 180,
                    width: double.infinity,
                    child: property.imageUrl != null
                        ? CachedNetworkImage(
                            imageUrl: property.imageUrl!,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => Container(color: Colors.grey.shade100),
                            errorWidget: (_, __, ___) => Container(
                              color: Colors.grey.shade100,
                              alignment: Alignment.center,
                              child: const Text('🏠', style: TextStyle(fontSize: 40)),
                            ),
                          )
                        : Container(
                            color: Colors.grey.shade100,
                            alignment: Alignment.center,
                            child: const Text('🏠', style: TextStyle(fontSize: 40)),
                          ),
                  ),
                  Positioned(
                    top: 10,
                    left: 10,
                    child: Row(
                      children: [
                        _badge(listingLabel(property.listingType), _badgeColor()),
                        if (property.featured) ...[
                          const SizedBox(width: 6),
                          _badge('Featured', const Color(0xFFEAB308)),
                        ],
                      ],
                    ),
                  ),
                  if (trailing != null) Positioned(top: 8, right: 8, child: trailing!),
                  Positioned(
                    bottom: 10,
                    left: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        propertyTypeLabel(property.propertyType),
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ),
              // Body
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          formatPrice(property.price),
                          style: TextStyle(
                              color: Colors.red.shade600,
                              fontSize: 18,
                              fontWeight: FontWeight.bold),
                        ),
                        if (property.listingType != 'FOR_SALE')
                          const Text('/mo', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      property.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 13, color: Colors.grey),
                        const SizedBox(width: 2),
                        Expanded(
                          child: Text(
                            '${property.city}, ${property.province}',
                            style: const TextStyle(color: Colors.grey, fontSize: 12),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        if (property.bedrooms != null)
                          _spec(Icons.bed_outlined, '${property.bedrooms} BR'),
                        if (property.bathrooms != null) ...[
                          const SizedBox(width: 12),
                          _spec(Icons.bathtub_outlined, '${property.bathrooms} BA'),
                        ],
                        if (property.floorArea != null) ...[
                          const SizedBox(width: 12),
                          _spec(Icons.aspect_ratio, '${property.floorArea} sqm'),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(20)),
      child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }

  Widget _spec(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: Colors.grey.shade500),
        const SizedBox(width: 4),
        Text(text, style: const TextStyle(fontSize: 12, color: Colors.black54)),
      ],
    );
  }
}
