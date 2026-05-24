import 'dart:io';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart' as launcher;
import '../api_client.dart';
import '../config.dart';
import '../format.dart';

class EngagementDetailScreen extends StatefulWidget {
  final String engagementId;
  const EngagementDetailScreen({super.key, required this.engagementId});

  @override
  State<EngagementDetailScreen> createState() => _EngagementDetailScreenState();
}

class _EngagementDetailScreenState extends State<EngagementDetailScreen> {
  Map<String, dynamic>? _engagement;
  bool _loading = true;
  String? _error;

  static const _statuses = [
    'NEW',
    'IN_REVIEW',
    'AWAITING_DOCUMENTS',
    'DRAFTING',
    'PENDING_SIGNATURES',
    'NOTARIZED',
    'TITLE_TRANSFER',
    'COMPLETED',
    'CANCELLED',
  ];

  static const _suggestedDocTypes = [
    'Reservation Agreement',
    'Contract to Sell',
    'Deed of Absolute Sale',
    'Transfer Certificate of Title (TCT)',
    'Tax Declaration',
    'Real Property Tax Receipt',
    'BIR Certificate Authorizing Registration (CAR)',
    'Buyer Valid ID',
    'Seller Valid ID',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await ApiClient.get(
        '/api/mobile/engagements/${widget.engagementId}',
        requireAuth: true,
      );
      if (!mounted) return;
      setState(() {
        _engagement = data['engagement'] as Map<String, dynamic>;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _updateStatus(String newStatus) async {
    try {
      await ApiClient.post(
        '/api/mobile/engagements/${widget.engagementId}',
        body: {'status': newStatus},
        requireAuth: true,
      );
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _uploadDocument() async {
    if (_engagement == null) return;
    // Step 1: pick a file
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
    );
    if (result == null || result.files.single.path == null) return;
    final path = result.files.single.path!;
    final fileName = result.files.single.name;
    if (!mounted) return;

    // Step 2: pick a doc type
    final docType = await _pickDocType(fileName);
    if (docType == null) return;
    if (!mounted) return;

    // Step 3: upload via multipart
    final scaffold = ScaffoldMessenger.of(context);
    scaffold.showSnackBar(SnackBar(content: Text('Uploading $fileName…'), duration: const Duration(seconds: 30)));
    try {
      final token = await ApiClient.getToken();
      final req = HttpClient();
      final uri = Uri.parse('${AppConfig.apiBase}/api/mobile/engagements/${widget.engagementId}/documents');
      final hr = await req.postUrl(uri);
      hr.headers.set('Authorization', 'Bearer $token');
      final boundary = '----DartBoundary${DateTime.now().millisecondsSinceEpoch}';
      hr.headers.contentType = ContentType('multipart', 'form-data', parameters: {'boundary': boundary});

      final file = File(path);
      final bytes = await file.readAsBytes();

      String mime = 'application/octet-stream';
      final lower = fileName.toLowerCase();
      if (lower.endsWith('.pdf')) {
        mime = 'application/pdf';
      } else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
        mime = 'image/jpeg';
      } else if (lower.endsWith('.png')) {
        mime = 'image/png';
      } else if (lower.endsWith('.webp')) {
        mime = 'image/webp';
      }

      final intro =
          '--$boundary\r\n'
          'Content-Disposition: form-data; name="documentType"\r\n\r\n'
          '$docType\r\n'
          '--$boundary\r\n'
          'Content-Disposition: form-data; name="file"; filename="$fileName"\r\n'
          'Content-Type: $mime\r\n\r\n';
      final outro = '\r\n--$boundary--\r\n';

      final introBytes = intro.codeUnits;
      final outroBytes = outro.codeUnits;
      hr.contentLength = introBytes.length + bytes.length + outroBytes.length;
      hr.add(introBytes);
      hr.add(bytes);
      hr.add(outroBytes);

      final response = await hr.close();
      final ok = response.statusCode == 200;
      scaffold.hideCurrentSnackBar();
      scaffold.showSnackBar(SnackBar(content: Text(ok ? 'Uploaded $fileName' : 'Upload failed (HTTP ${response.statusCode})')));
      if (ok) _load();
    } catch (e) {
      scaffold.hideCurrentSnackBar();
      scaffold.showSnackBar(SnackBar(content: Text('Upload error: $e')));
    }
  }

  Future<String?> _pickDocType(String fileName) async {
    String selected = _suggestedDocTypes.first;
    final customCtl = TextEditingController();
    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx, set) {
          return Padding(
            padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + MediaQuery.of(ctx).viewInsets.bottom),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Document type for', style: TextStyle(color: Colors.grey.shade600)),
                Text(fileName, style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: selected,
                  items: _suggestedDocTypes
                      .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                      .toList(),
                  onChanged: (v) => set(() => selected = v ?? selected),
                  decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                ),
                if (selected == 'Other') ...[
                  const SizedBox(height: 10),
                  TextField(
                    controller: customCtl,
                    decoration: const InputDecoration(
                      hintText: 'Custom document type',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                FilledButton(
                  style: FilledButton.styleFrom(backgroundColor: Colors.purple.shade600),
                  onPressed: () {
                    final v = selected == 'Other' ? customCtl.text.trim() : selected;
                    if (v.isEmpty) return;
                    Navigator.of(ctx).pop(v);
                  },
                  child: const Text('Continue'),
                ),
              ],
            ),
          );
        });
      },
    );
  }

  Future<void> _openDocument(String id, String fileName) async {
    final token = await ApiClient.getToken();
    final uri = Uri.parse('${AppConfig.apiBase}/api/mobile/contracts/$id?token=$token'); // browser fallback won't work; open via auth-required GET would need browser session
    // Simpler UX: download via the authed HTTP and open via OS handler — but file_picker doesn't have a "save" yet on mobile. For V1, just open the URL: user can also use the web app.
    if (await launcher.canLaunchUrl(uri)) {
      await launcher.launchUrl(uri, mode: launcher.LaunchMode.externalApplication);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not open $fileName')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Contract Workspace')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(_error!)))
              : _engagement == null
                  ? const Center(child: Text('Not found'))
                  : _buildBody(),
    );
  }

  Widget _buildBody() {
    final e = _engagement!;
    final property = e['property'] as Map<String, dynamic>;
    final lawyer = e['lawyer'] as Map<String, dynamic>;
    final buyer = e['buyer'] as Map<String, dynamic>;
    final documents = (e['documents'] as List).cast<Map<String, dynamic>>();
    final capabilities = e['capabilities'] as Map<String, dynamic>;
    final canChangeStatus = capabilities['canChangeStatus'] == true;
    final updatedAt = DateTime.parse(e['updatedAt'] as String);

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Property card
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.grey.shade200),
            ),
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: SizedBox(
                    width: 60,
                    height: 56,
                    child: property['imageUrl'] != null
                        ? CachedNetworkImage(imageUrl: property['imageUrl'] as String, fit: BoxFit.cover)
                        : Container(color: Colors.grey.shade100, alignment: Alignment.center, child: const Text('🏠')),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(property['title'] as String,
                          style: const TextStyle(fontWeight: FontWeight.w600), maxLines: 2, overflow: TextOverflow.ellipsis),
                      Text(
                        '${property['address']}, ${property['city']}',
                        style: const TextStyle(fontSize: 11, color: Colors.grey),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Text(formatPrice((property['price'] as num)),
                    style: TextStyle(color: Colors.red.shade600, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Status
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.grey.shade200),
            ),
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.flag_outlined, size: 16, color: Colors.purple.shade600),
                    const SizedBox(width: 6),
                    const Text('Status', style: TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 10),
                if (canChangeStatus)
                  DropdownButtonFormField<String>(
                    value: e['status'] as String,
                    items: _statuses
                        .map((s) => DropdownMenuItem(value: s, child: Text(engagementStatusLabel(s))))
                        .toList(),
                    onChanged: (v) {
                      if (v != null && v != e['status']) _updateStatus(v);
                    },
                    decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                  )
                else
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.purple.shade50,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      engagementStatusLabel(e['status'] as String),
                      style: TextStyle(color: Colors.purple.shade700, fontWeight: FontWeight.w600),
                    ),
                  ),
                const SizedBox(height: 6),
                Text(
                  'Last update: ${DateFormat('MMM d, yyyy • h:mm a').format(updatedAt)}',
                  style: const TextStyle(color: Colors.grey, fontSize: 11),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Documents
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.grey.shade200),
            ),
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.description_outlined, size: 16, color: Colors.purple.shade600),
                    const SizedBox(width: 6),
                    Text('Contract Documents (${documents.length})', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 10),
                if (documents.isEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text('No documents uploaded yet.', style: TextStyle(color: Colors.grey)),
                  )
                else
                  ...documents.map((d) => _docTile(d)),
                const SizedBox(height: 10),
                FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.purple.shade600,
                    minimumSize: const Size.fromHeight(44),
                  ),
                  onPressed: _uploadDocument,
                  icon: const Icon(Icons.upload),
                  label: const Text('Upload Document'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Lawyer
          _personCard(
            title: 'Assigned Lawyer',
            icon: Icons.gavel,
            name: lawyer['name'] as String? ?? '—',
            subtitle: lawyer['lawFirm'] as String?,
            extra: lawyer['ibpRollNo'] != null ? 'IBP ${lawyer['ibpRollNo']}' : null,
            phone: lawyer['phone'] as String?,
            email: lawyer['email'] as String?,
          ),
          const SizedBox(height: 12),

          // Buyer
          _personCard(
            title: 'Buyer',
            icon: Icons.person,
            name: buyer['name'] as String? ?? '—',
            phone: capabilities['canChangeStatus'] == true ? buyer['phone'] as String? : null,
            email: capabilities['canChangeStatus'] == true ? buyer['email'] as String? : null,
          ),

          // Listing agent (shown to lawyer)
          if (canChangeStatus && (property['owner'] as Map<String, dynamic>)['email'] != null) ...[
            const SizedBox(height: 12),
            _personCard(
              title: 'Listing Agent',
              icon: Icons.business,
              name: (property['owner'] as Map<String, dynamic>)['name'] as String? ?? '—',
              phone: (property['owner'] as Map<String, dynamic>)['phone'] as String?,
              email: (property['owner'] as Map<String, dynamic>)['email'] as String?,
            ),
          ],

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _docTile(Map<String, dynamic> d) {
    final uploader = d['uploadedBy'] as Map<String, dynamic>;
    final dateFmt = DateFormat('MMM d, yyyy');
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(10)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
            child: Icon(Icons.description, color: Colors.purple.shade600, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(d['documentType'] as String, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                Text(d['fileName'] as String, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                if (d['notes'] != null && (d['notes'] as String).isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text('📝 ${d['notes']}', style: const TextStyle(fontSize: 11)),
                  ),
                Text(
                  '${uploader['name']} • ${((d['fileSize'] as int) / 1024).toStringAsFixed(0)} KB • ${dateFmt.format(DateTime.parse(d['createdAt'] as String))}',
                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                ),
              ],
            ),
          ),
          IconButton(
            iconSize: 18,
            visualDensity: VisualDensity.compact,
            onPressed: () => _openDocument(d['id'] as String, d['fileName'] as String),
            icon: const Icon(Icons.download),
          ),
        ],
      ),
    );
  }

  Widget _personCard({
    required String title,
    required IconData icon,
    required String name,
    String? subtitle,
    String? extra,
    String? phone,
    String? email,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade200),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: Colors.purple.shade600),
              const SizedBox(width: 6),
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 8),
          Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
          if (subtitle != null) Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          if (extra != null)
            Text(extra, style: TextStyle(fontSize: 11, color: Colors.blue.shade700, fontWeight: FontWeight.w500)),
          if (phone != null) ...[
            const SizedBox(height: 8),
            InkWell(
              onTap: () => launcher.launchUrl(Uri.parse('tel:$phone')),
              child: Row(
                children: [
                  const Icon(Icons.phone, size: 14, color: Colors.grey),
                  const SizedBox(width: 6),
                  Text(phone, style: const TextStyle(fontSize: 12)),
                ],
              ),
            ),
          ],
          if (email != null) ...[
            const SizedBox(height: 4),
            InkWell(
              onTap: () => launcher.launchUrl(Uri.parse('mailto:$email')),
              child: Row(
                children: [
                  const Icon(Icons.mail, size: 14, color: Colors.grey),
                  const SizedBox(width: 6),
                  Text(email, style: const TextStyle(fontSize: 12)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
