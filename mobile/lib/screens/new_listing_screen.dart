import 'package:flutter/material.dart';
import '../api_client.dart';

class NewListingScreen extends StatefulWidget {
  const NewListingScreen({super.key});

  @override
  State<NewListingScreen> createState() => _NewListingScreenState();
}

class _NewListingScreenState extends State<NewListingScreen> {
  final _formKey = GlobalKey<FormState>();
  String _listingType = 'FOR_SALE';
  String _propertyType = 'HOUSE';
  bool _negotiable = false;
  bool _furnished = false;
  bool _petFriendly = false;

  final _title = TextEditingController();
  final _description = TextEditingController();
  final _price = TextEditingController();
  final _address = TextEditingController();
  final _city = TextEditingController();
  final _province = TextEditingController();
  final _region = TextEditingController(text: 'NCR');
  final _bedrooms = TextEditingController();
  final _bathrooms = TextEditingController();
  final _floorArea = TextEditingController();
  final _lotArea = TextEditingController();
  final _parking = TextEditingController();

  bool _submitting = false;

  @override
  void dispose() {
    for (final c in [_title, _description, _price, _address, _city, _province, _region, _bedrooms, _bathrooms, _floorArea, _lotArea, _parking]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _submitting = true);
    try {
      final body = <String, dynamic>{
        'title': _title.text.trim(),
        'description': _description.text.trim(),
        'listingType': _listingType,
        'propertyType': _propertyType,
        'price': double.parse(_price.text),
        'negotiable': _negotiable,
        'address': _address.text.trim(),
        'city': _city.text.trim(),
        'province': _province.text.trim(),
        'region': _region.text.trim(),
        'furnished': _furnished,
        'petFriendly': _petFriendly,
      };
      void addInt(String key, TextEditingController c) {
        final v = int.tryParse(c.text.trim());
        if (v != null) body[key] = v;
      }
      void addDouble(String key, TextEditingController c) {
        final v = double.tryParse(c.text.trim());
        if (v != null) body[key] = v;
      }
      addInt('bedrooms', _bedrooms);
      addInt('bathrooms', _bathrooms);
      addInt('parkingSpaces', _parking);
      addDouble('floorArea', _floorArea);
      addDouble('lotArea', _lotArea);

      await ApiClient.post('/api/mobile/listings', body: body, requireAuth: true);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Listing published')),
      );
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    InputDecoration deco(String label, {String? hint}) => InputDecoration(
          labelText: label,
          hintText: hint,
          border: const OutlineInputBorder(),
          isDense: true,
        );

    return Scaffold(
      appBar: AppBar(title: const Text('List a Property')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Listing type
            const _Label('Listing Type'),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'FOR_SALE', label: Text('For Sale')),
                ButtonSegment(value: 'FOR_RENT', label: Text('For Rent')),
                ButtonSegment(value: 'FOR_LEASE', label: Text('For Lease')),
              ],
              selected: {_listingType},
              onSelectionChanged: (s) => setState(() => _listingType = s.first),
            ),
            const SizedBox(height: 16),

            // Property type
            DropdownButtonFormField<String>(
              value: _propertyType,
              decoration: deco('Property Type'),
              items: const [
                DropdownMenuItem(value: 'HOUSE', child: Text('House & Lot')),
                DropdownMenuItem(value: 'CONDO', child: Text('Condominium')),
                DropdownMenuItem(value: 'APARTMENT', child: Text('Apartment')),
                DropdownMenuItem(value: 'TOWNHOUSE', child: Text('Townhouse')),
                DropdownMenuItem(value: 'LOT', child: Text('Lot')),
                DropdownMenuItem(value: 'COMMERCIAL', child: Text('Commercial')),
                DropdownMenuItem(value: 'WAREHOUSE', child: Text('Warehouse')),
                DropdownMenuItem(value: 'OFFICE', child: Text('Office')),
                DropdownMenuItem(value: 'FARM', child: Text('Farm')),
              ],
              onChanged: (v) => setState(() => _propertyType = v ?? _propertyType),
            ),
            const SizedBox(height: 12),

            TextFormField(
              controller: _title,
              decoration: deco('Title', hint: 'e.g. 3BR House for Sale in Quezon City'),
              validator: (v) => (v == null || v.trim().length < 5) ? 'At least 5 characters' : null,
            ),
            const SizedBox(height: 12),

            TextFormField(
              controller: _description,
              decoration: deco('Description'),
              minLines: 3,
              maxLines: 6,
              validator: (v) => (v == null || v.trim().length < 20) ? 'At least 20 characters' : null,
            ),
            const SizedBox(height: 12),

            TextFormField(
              controller: _price,
              decoration: deco('Price (PHP)'),
              keyboardType: TextInputType.number,
              validator: (v) {
                final n = double.tryParse((v ?? '').trim());
                return (n == null || n <= 0) ? 'Enter a price' : null;
              },
            ),
            const SizedBox(height: 4),
            CheckboxListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              value: _negotiable,
              onChanged: (v) => setState(() => _negotiable = v ?? false),
              title: const Text('Price is negotiable', style: TextStyle(fontSize: 13)),
            ),

            const SizedBox(height: 12),
            TextFormField(
              controller: _address,
              decoration: deco('Street Address'),
              validator: (v) => (v == null || v.trim().length < 3) ? 'Required' : null,
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _city,
                    decoration: deco('City'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    controller: _province,
                    decoration: deco('Province'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(controller: _region, decoration: deco('Region', hint: 'e.g. NCR, VII, CAR')),
            const SizedBox(height: 16),

            const _Label('Specifications (optional)'),
            Row(
              children: [
                Expanded(child: TextFormField(controller: _bedrooms, decoration: deco('Bedrooms'), keyboardType: TextInputType.number)),
                const SizedBox(width: 10),
                Expanded(child: TextFormField(controller: _bathrooms, decoration: deco('Bathrooms'), keyboardType: TextInputType.number)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: TextFormField(controller: _floorArea, decoration: deco('Floor Area (sqm)'), keyboardType: TextInputType.number)),
                const SizedBox(width: 10),
                Expanded(child: TextFormField(controller: _lotArea, decoration: deco('Lot Area (sqm)'), keyboardType: TextInputType.number)),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(controller: _parking, decoration: deco('Parking Slots'), keyboardType: TextInputType.number),
            const SizedBox(height: 12),

            CheckboxListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              value: _furnished,
              onChanged: (v) => setState(() => _furnished = v ?? false),
              title: const Text('Furnished', style: TextStyle(fontSize: 13)),
            ),
            CheckboxListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              value: _petFriendly,
              onChanged: (v) => setState(() => _petFriendly = v ?? false),
              title: const Text('Pet-friendly', style: TextStyle(fontSize: 13)),
            ),
            const SizedBox(height: 20),

            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: Colors.red.shade600,
                minimumSize: const Size.fromHeight(48),
              ),
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Publish Listing', style: TextStyle(fontWeight: FontWeight.w600)),
            ),
            const SizedBox(height: 8),
            const Text(
              'You can add photos and amenities later from the web app.',
              style: TextStyle(color: Colors.grey, fontSize: 11),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(text, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
      );
}
