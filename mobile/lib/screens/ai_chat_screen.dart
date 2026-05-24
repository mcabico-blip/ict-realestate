import 'package:flutter/material.dart';
import '../api_client.dart';

class _ChatMessage {
  final String role; // 'user' or 'assistant'
  final String content;
  _ChatMessage(this.role, this.content);

  Map<String, String> toJson() => {'role': role, 'content': content};
}

class AiChatScreen extends StatefulWidget {
  const AiChatScreen({super.key});

  @override
  State<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends State<AiChatScreen> {
  final _messages = <_ChatMessage>[];
  final _inputCtl = TextEditingController();
  final _scrollCtl = ScrollController();
  bool _sending = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _messages.add(_ChatMessage(
      'assistant',
      "Hi! I'm the ICT Realtors Support Agent. I can help you find properties, explain the Philippine real estate process, or walk you through engaging a broker or lawyer. What would you like to know?",
    ));
  }

  @override
  void dispose() {
    _inputCtl.dispose();
    _scrollCtl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _inputCtl.text.trim();
    if (text.isEmpty || _sending) return;

    setState(() {
      _messages.add(_ChatMessage('user', text));
      _inputCtl.clear();
      _sending = true;
      _error = null;
    });
    _scrollDown();

    try {
      final data = await ApiClient.post('/api/ai/chat', body: {
        'messages': _messages.map((m) => m.toJson()).toList(),
      });
      final reply = data['reply'] as String? ?? '...';
      if (!mounted) return;
      setState(() => _messages.add(_ChatMessage('assistant', reply)));
      _scrollDown();
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
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

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            controller: _scrollCtl,
            padding: const EdgeInsets.all(16),
            itemCount: _messages.length + (_sending ? 1 : 0),
            itemBuilder: (context, i) {
              if (i == _messages.length) return const _ThinkingBubble();
              final m = _messages[i];
              return _Bubble(role: m.role, content: m.content);
            },
          ),
        ),
        if (_error != null)
          Container(
            color: Colors.red.shade50,
            padding: const EdgeInsets.all(8),
            child: Text(_error!, style: TextStyle(color: Colors.red.shade700, fontSize: 12)),
          ),
        SafeArea(
          top: false,
          child: Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(12, 8, 8, 12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _inputCtl,
                    minLines: 1,
                    maxLines: 4,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: InputDecoration(
                      hintText: 'Ask me anything…',
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(20)),
                    ),
                    onSubmitted: (_) => _send(),
                  ),
                ),
                const SizedBox(width: 6),
                IconButton.filled(
                  style: IconButton.styleFrom(backgroundColor: Colors.red.shade600),
                  onPressed: _sending ? null : _send,
                  icon: const Icon(Icons.send, color: Colors.white, size: 18),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _Bubble extends StatelessWidget {
  final String role;
  final String content;
  const _Bubble({required this.role, required this.content});

  @override
  Widget build(BuildContext context) {
    final isUser = role == 'user';
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser)
            CircleAvatar(
              radius: 14,
              backgroundColor: Colors.purple.shade100,
              child: Icon(Icons.auto_awesome, size: 14, color: Colors.purple.shade700),
            ),
          if (!isUser) const SizedBox(width: 8),
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isUser ? Colors.red.shade600 : Colors.grey.shade100,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
              ),
              child: Text(
                content,
                style: TextStyle(color: isUser ? Colors.white : Colors.black87, fontSize: 14, height: 1.4),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ThinkingBubble extends StatelessWidget {
  const _ThinkingBubble();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: Colors.purple.shade100,
            child: Icon(Icons.auto_awesome, size: 14, color: Colors.purple.shade700),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const SizedBox(
              width: 30,
              height: 14,
              child: Center(
                child: SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(strokeWidth: 1.5),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
