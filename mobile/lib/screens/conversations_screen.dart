import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api_client.dart';
import 'chat_screen.dart';

class ConversationsScreen extends StatefulWidget {
  const ConversationsScreen({super.key});

  @override
  State<ConversationsScreen> createState() => _ConversationsScreenState();
}

class _ConversationsScreenState extends State<ConversationsScreen> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Map<String, dynamic>>> _load() async {
    final data = await ApiClient.get('/api/mobile/conversations', requireAuth: true);
    return (data['conversations'] as List).cast<Map<String, dynamic>>();
  }

  @override
  Widget build(BuildContext context) {
    final dateFmt = DateFormat('MMM d');
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snap.hasError) {
          return Center(child: Text('Could not load\n${snap.error}', textAlign: TextAlign.center));
        }
        final list = snap.data ?? const [];
        if (list.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.chat_bubble_outline, size: 56, color: Colors.grey.shade300),
                  const SizedBox(height: 12),
                  const Text('No conversations yet', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  const Text(
                    'Tap "Message Lister" on any property to start a chat.',
                    style: TextStyle(color: Colors.grey, fontSize: 13),
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
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 4),
            itemBuilder: (context, i) {
              final c = list[i];
              final last = c['lastMessage'] as Map<String, dynamic>?;
              final unread = c['unread'] as int? ?? 0;
              final hasUnread = unread > 0;
              return GestureDetector(
                onTap: () async {
                  await Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => ChatScreen(
                      conversationId: c['id'] as String,
                      propertyTitle: c['propertyTitle'] as String,
                      propertyImageUrl: c['propertyImageUrl'] as String?,
                    ),
                  ));
                  setState(() => _future = _load());
                },
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 12),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: hasUnread ? Colors.red.shade200 : Colors.grey.shade200,
                      width: hasUnread ? 1.5 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: SizedBox(
                          width: 48,
                          height: 48,
                          child: c['propertyImageUrl'] != null
                              ? CachedNetworkImage(imageUrl: c['propertyImageUrl'] as String, fit: BoxFit.cover)
                              : Container(color: Colors.grey.shade100, alignment: Alignment.center, child: const Text('🏠')),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    c['otherName'] as String? ?? '—',
                                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (last != null)
                                  Text(
                                    dateFmt.format(DateTime.parse(last['createdAt'] as String)),
                                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                                  ),
                              ],
                            ),
                            Text(
                              c['propertyTitle'] as String? ?? '',
                              style: const TextStyle(fontSize: 11, color: Colors.grey),
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            if (last != null)
                              Text(
                                last['content'] as String,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: hasUnread ? Colors.black87 : Colors.grey.shade600,
                                  fontWeight: hasUnread ? FontWeight.w600 : FontWeight.normal,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              )
                            else
                              const Text('No messages yet',
                                  style: TextStyle(fontSize: 12, color: Colors.grey, fontStyle: FontStyle.italic)),
                          ],
                        ),
                      ),
                      if (hasUnread) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          constraints: const BoxConstraints(minWidth: 20),
                          decoration: BoxDecoration(
                            color: Colors.red.shade600,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            '$unread',
                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
