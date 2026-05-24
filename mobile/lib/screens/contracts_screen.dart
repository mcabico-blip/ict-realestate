import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api_client.dart';
import '../format.dart';
import '../models.dart';

class ContractsScreen extends StatefulWidget {
  final AppUser user;
  const ContractsScreen({super.key, required this.user});

  @override
  State<ContractsScreen> createState() => _ContractsScreenState();
}

class _ContractsScreenState extends State<ContractsScreen> {
  late Future<List<EngagementSummary>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<EngagementSummary>> _load() async {
    final data = await ApiClient.get('/api/mobile/engagements', requireAuth: true);
    return (data['engagements'] as List)
        .map((e) => EngagementSummary.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final isLawyer = widget.user.role == 'LAWYER';
    final dateFmt = DateFormat('MMM d, yyyy');

    return FutureBuilder<List<EngagementSummary>>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snap.hasError) {
          return Center(child: Text('Could not load contracts\n${snap.error}', textAlign: TextAlign.center));
        }
        final list = snap.data ?? const [];
        if (list.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.gavel, size: 56, color: Colors.grey.shade300),
                  const SizedBox(height: 12),
                  Text(
                    isLawyer ? 'No assigned contracts yet' : 'No active contracts',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isLawyer
                        ? 'When a buyer engages you, deals will appear here.'
                        : 'Engage a lawyer on the website to start contract paperwork.',
                    style: const TextStyle(color: Colors.grey, fontSize: 13),
                    textAlign: TextAlign.center,
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
                  isLawyer
                      ? '${list.length} assigned engagement${list.length == 1 ? "" : "s"}'
                      : '${list.length} active contract${list.length == 1 ? "" : "s"}',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                ),
              ),
              ...list.map((e) => _EngagementTile(engagement: e, isLawyer: isLawyer, dateFmt: dateFmt)),
            ],
          ),
        );
      },
    );
  }
}

class _EngagementTile extends StatelessWidget {
  final EngagementSummary engagement;
  final bool isLawyer;
  final DateFormat dateFmt;
  const _EngagementTile({required this.engagement, required this.isLawyer, required this.dateFmt});

  Color _statusColor() {
    switch (engagement.status) {
      case 'NEW':
        return Colors.grey.shade600;
      case 'IN_REVIEW':
        return Colors.blue.shade600;
      case 'AWAITING_DOCUMENTS':
        return Colors.amber.shade700;
      case 'DRAFTING':
        return Colors.indigo.shade600;
      case 'PENDING_SIGNATURES':
        return Colors.purple.shade600;
      case 'NOTARIZED':
        return Colors.cyan.shade600;
      case 'TITLE_TRANSFER':
        return Colors.orange.shade600;
      case 'COMPLETED':
        return Colors.green.shade700;
      case 'CANCELLED':
        return Colors.red.shade600;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          // Thumbnail
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: SizedBox(
              width: 64,
              height: 56,
              child: engagement.propertyImageUrl != null
                  ? CachedNetworkImage(imageUrl: engagement.propertyImageUrl!, fit: BoxFit.cover)
                  : Container(color: Colors.grey.shade100, alignment: Alignment.center, child: const Text('🏠')),
            ),
          ),
          const SizedBox(width: 12),
          // Body
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: _statusColor().withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        engagementStatusLabel(engagement.status),
                        style: TextStyle(color: _statusColor(), fontSize: 10, fontWeight: FontWeight.w600),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Icon(Icons.description_outlined, size: 12, color: Colors.grey.shade500),
                    const SizedBox(width: 2),
                    Text('${engagement.documentCount}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  engagement.propertyTitle,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                ),
                Text(engagement.propertyCity, style: const TextStyle(color: Colors.grey, fontSize: 11)),
                const SizedBox(height: 2),
                Text(
                  isLawyer ? 'Buyer: ${engagement.buyerName}' : 'Lawyer: ${engagement.lawyerName}',
                  style: const TextStyle(fontSize: 11, color: Colors.black54),
                ),
              ],
            ),
          ),
          // Price + date
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                formatPrice(engagement.propertyPrice),
                style: TextStyle(color: Colors.red.shade600, fontSize: 13, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(dateFmt.format(engagement.updatedAt), style: const TextStyle(fontSize: 10, color: Colors.grey)),
            ],
          ),
        ],
      ),
    );
  }
}
