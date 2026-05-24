import 'package:intl/intl.dart';

final _peso = NumberFormat.currency(locale: 'en_PH', symbol: 'PHP ', decimalDigits: 0);
final _pesoCompact = NumberFormat.compactCurrency(locale: 'en_PH', symbol: 'PHP ', decimalDigits: 2);

/// Format prices Filipino-style. Big numbers (millions) get compact display
/// like "PHP 35.00M"; smaller numbers (rents) get full digits like "PHP 35,000".
String formatPrice(num value) {
  if (value >= 1_000_000) return _pesoCompact.format(value);
  return _peso.format(value);
}

String listingLabel(String type) {
  switch (type) {
    case 'FOR_SALE':
      return 'For Sale';
    case 'FOR_RENT':
      return 'For Rent';
    case 'FOR_LEASE':
      return 'For Lease';
    default:
      return type;
  }
}

String propertyTypeLabel(String type) {
  switch (type) {
    case 'HOUSE':
      return 'House';
    case 'CONDO':
      return 'Condominium';
    case 'APARTMENT':
      return 'Apartment';
    case 'TOWNHOUSE':
      return 'Townhouse';
    case 'LOT':
      return 'Lot';
    case 'COMMERCIAL':
      return 'Commercial';
    case 'WAREHOUSE':
      return 'Warehouse';
    case 'OFFICE':
      return 'Office';
    case 'FARM':
      return 'Farm';
    default:
      return type;
  }
}

String engagementStatusLabel(String status) {
  switch (status) {
    case 'NEW':
      return 'New';
    case 'IN_REVIEW':
      return 'In Review';
    case 'AWAITING_DOCUMENTS':
      return 'Awaiting Docs';
    case 'DRAFTING':
      return 'Drafting';
    case 'PENDING_SIGNATURES':
      return 'Awaiting Signatures';
    case 'NOTARIZED':
      return 'Notarized';
    case 'TITLE_TRANSFER':
      return 'Title Transfer';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}
