import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api_client.dart';

class ChatScreen extends StatefulWidget {
  final String conversationId;
  final String propertyTitle;
  final String? propertyImageUrl;
  const ChatScreen({
    super.key,
    required this.conversationId,
    required this.propertyTitle,
    this.propertyImageUrl,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  List<Map<String, dynamic>> _messages = [];
  Map<String, dynamic>? _participants;
  String? _currentUserId;
  bool _loading = true;
  bool _sending = false;
  final _input = TextEditingController();
  final _scrollCtl = ScrollController();
  Timer? _pollTimer;
  String? _lastFetched;

  @override
  void initState() {
    super.initState();
    _bootstrap();
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (_) => _poll());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _input.dispose();
    _scrollCtl.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    try {
      // figure out current user id (from /api/mobile/me)
      final me = await ApiClient.get('/api/mobile/me', requireAuth: true);
      _currentUserId = (me['user'] as Map<String, dynamic>)['id'] as String;

      final data = await ApiClient.get(
        '/api/mobile/conversations/${widget.conversationId}',
        requireAuth: true,
      );
      final convo = data['conversation'] as Map<String, dynamic>;
      if (!mounted) return;
      setState(() {
        _participants = convo['participants'] as Map<String, dynamic>;
        _messages = (convo['messages'] as List).cast<Map<String, dynamic>>();
        _lastFetched = _messages.isNotEmpty ? _messages.last['createdAt'] as String : null;
        _loading = false;
      });
      _scrollDown();
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _poll() async {
    if (!mounted || _lastFetched == null) return;
    try {
      final data = await ApiClient.get(
        '/api/mobile/conversations/${widget.conversationId}/messages',
        query: {'since': _lastFetched!},
        requireAuth: true,
      );
      final newMsgs = (data['messages'] as List).cast<Map<String, dynamic>>();
      if (newMsgs.isNotEmpty) {
        if (!mounted) return;
        setState(() {
          final existingIds = _messages.map((m) => m['id']).toSet();
          _messages.addAll(newMsgs.where((m) => !existingIds.contains(m['id'])));
          _lastFetched = newMsgs.last['createdAt'] as String;
        });
        _scrollDown();
      }
    } catch (_) {
      // swallow polling errors
    }
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      final data = await ApiClient.post(
        '/api/mobile/conversations/${widget.conversationId}/messages',
        body: {'content': text},
        requireAuth: true,
      );
      final m = data['message'] as Map<String, dynamic>;
      if (!mounted) return;
      setState(() {
        _messages.add(m);
        _lastFetched = m['createdAt'] as String;
        _input.clear();
      });
      _scrollDown();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _scrollDown() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtl.hasClients) {
        _scrollCtl.animateTo(
          _scrollCtl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Widget _participantPills() {
    if (_participants == null) return const SizedBox.shrink();
    final parts = [
      _participants!['buyer'] as Map<String, dynamic>?,
      _participants!['broker'] as Map<String, dynamic>?,
      _participants!['lawyer'] as Map<String, dynamic>?,
    ].where((p) => p != null).toList();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      color: Colors.grey.shade50,
      child: Wrap(
        spacing: 8,
        runSpacing: 4,
        children: parts.map((p) {
          final role = p!['role'] as String;
          final online = p['online'] as bool? ?? false;
          Color color;
          String label;
          switch (role) {
            case 'BROKER':
            case 'SALESPERSON':
              color = Colors.blue.shade100;
              label = role == 'BROKER' ? 'Broker' : 'Agent';
              break;
            case 'LAWYER':
              color = Colors.purple.shade100;
              label = 'Lawyer';
              break;
            default:
              color = Colors.grey.shade200;
              label = 'Buyer';
          }
          return Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                children: [
                  CircleAvatar(
                    radius: 10,
                    backgroundColor: color,
                    child: Text(
                      (p['name'] as String?)?.isNotEmpty == true
                          ? (p['name'] as String)[0].toUpperCase()
                          : '?',
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                  if (online)
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        width: 7,
                        height: 7,
                        decoration: BoxDecoration(
                          color: Colors.green,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 1),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 4),
              Text(
                '${p['name']} ($label)',
                style: const TextStyle(fontSize: 11),
              ),
            ],
          );
        }).toList(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            if (widget.propertyImageUrl != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: SizedBox(
                  width: 32,
                  height: 32,
                  child: CachedNetworkImage(imageUrl: widget.propertyImageUrl!, fit: BoxFit.cover),
                ),
              )
            else
              const Text('🏠'),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                widget.propertyTitle,
                style: const TextStyle(fontSize: 15),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          _participantPills(),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty
                    ? const Center(
                        child: Text('No messages yet. Say hi!', style: TextStyle(color: Colors.grey)),
                      )
                    : ListView.builder(
                        controller: _scrollCtl,
                        padding: const EdgeInsets.all(12),
                        itemCount: _messages.length,
                        itemBuilder: (context, i) {
                          final m = _messages[i];
                          final isMine = m['senderId'] == _currentUserId;
                          final time = DateTime.parse(m['createdAt'] as String);
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 3),
                            child: Row(
                              mainAxisAlignment: isMine ? MainAxisAlignment.end : MainAxisAlignment.start,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Flexible(
                                  child: Container(
                                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: isMine ? Colors.red.shade600 : Colors.grey.shade100,
                                      borderRadius: BorderRadius.only(
                                        topLeft: const Radius.circular(14),
                                        topRight: const Radius.circular(14),
                                        bottomLeft: Radius.circular(isMine ? 14 : 4),
                                        bottomRight: Radius.circular(isMine ? 4 : 14),
                                      ),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        if (!isMine)
                                          Padding(
                                            padding: const EdgeInsets.only(bottom: 2),
                                            child: Text(
                                              m['senderName'] as String? ?? '',
                                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black54),
                                            ),
                                          ),
                                        Text(
                                          m['content'] as String,
                                          style: TextStyle(
                                            color: isMine ? Colors.white : Colors.black87,
                                            fontSize: 14,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          DateFormat('h:mm a').format(time),
                                          style: TextStyle(
                                            color: isMine ? Colors.white70 : Colors.grey,
                                            fontSize: 9,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),
          SafeArea(
            top: false,
            child: Container(
              padding: const EdgeInsets.fromLTRB(10, 6, 6, 10),
              color: Colors.white,
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _input,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: InputDecoration(
                        hintText: 'Type a message…',
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 6),
                  IconButton.filled(
                    style: IconButton.styleFrom(backgroundColor: Colors.red.shade600),
                    onPressed: _sending ? null : _send,
                    icon: _sending
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.send, color: Colors.white, size: 18),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
