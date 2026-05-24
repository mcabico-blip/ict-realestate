// Data models for the mobile app, mirroring the shape returned by /api/mobile/* endpoints.

class AppUser {
  final String id;
  final String email;
  final String? name;
  final String role;

  AppUser({required this.id, required this.email, required this.name, required this.role});

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: j['id'] as String,
        email: j['email'] as String,
        name: j['name'] as String?,
        role: j['role'] as String,
      );

  Map<String, dynamic> toJson() => {'id': id, 'email': email, 'name': name, 'role': role};
}

class PropertyCard {
  final String id;
  final String title;
  final String listingType;
  final String propertyType;
  final num price;
  final String city;
  final String province;
  final int? bedrooms;
  final int? bathrooms;
  final num? floorArea;
  final bool featured;
  final String? imageUrl;

  PropertyCard({
    required this.id,
    required this.title,
    required this.listingType,
    required this.propertyType,
    required this.price,
    required this.city,
    required this.province,
    required this.bedrooms,
    required this.bathrooms,
    required this.floorArea,
    required this.featured,
    required this.imageUrl,
  });

  factory PropertyCard.fromJson(Map<String, dynamic> j) => PropertyCard(
        id: j['id'] as String,
        title: j['title'] as String,
        listingType: j['listingType'] as String,
        propertyType: j['propertyType'] as String,
        price: j['price'] as num,
        city: j['city'] as String,
        province: j['province'] as String,
        bedrooms: j['bedrooms'] as int?,
        bathrooms: j['bathrooms'] as int?,
        floorArea: j['floorArea'] as num?,
        featured: j['featured'] as bool? ?? false,
        imageUrl: j['imageUrl'] as String?,
      );
}

class PropertyDetail {
  final String id;
  final String title;
  final String description;
  final String listingType;
  final String propertyType;
  final num price;
  final bool negotiable;
  final String address;
  final String city;
  final String province;
  final int? bedrooms;
  final int? bathrooms;
  final num? floorArea;
  final num? lotArea;
  final int? parkingSpaces;
  final int? yearBuilt;
  final bool furnished;
  final bool petFriendly;
  final bool featured;
  final int viewCount;
  final int favoritesCount;
  final List<PropertyImage> images;
  final List<String> amenities;
  final PropertyOwner owner;

  PropertyDetail({
    required this.id,
    required this.title,
    required this.description,
    required this.listingType,
    required this.propertyType,
    required this.price,
    required this.negotiable,
    required this.address,
    required this.city,
    required this.province,
    required this.bedrooms,
    required this.bathrooms,
    required this.floorArea,
    required this.lotArea,
    required this.parkingSpaces,
    required this.yearBuilt,
    required this.furnished,
    required this.petFriendly,
    required this.featured,
    required this.viewCount,
    required this.favoritesCount,
    required this.images,
    required this.amenities,
    required this.owner,
  });

  factory PropertyDetail.fromJson(Map<String, dynamic> j) => PropertyDetail(
        id: j['id'] as String,
        title: j['title'] as String,
        description: j['description'] as String,
        listingType: j['listingType'] as String,
        propertyType: j['propertyType'] as String,
        price: j['price'] as num,
        negotiable: j['negotiable'] as bool? ?? false,
        address: j['address'] as String,
        city: j['city'] as String,
        province: j['province'] as String,
        bedrooms: j['bedrooms'] as int?,
        bathrooms: j['bathrooms'] as int?,
        floorArea: j['floorArea'] as num?,
        lotArea: j['lotArea'] as num?,
        parkingSpaces: j['parkingSpaces'] as int?,
        yearBuilt: j['yearBuilt'] as int?,
        furnished: j['furnished'] as bool? ?? false,
        petFriendly: j['petFriendly'] as bool? ?? false,
        featured: j['featured'] as bool? ?? false,
        viewCount: j['viewCount'] as int? ?? 0,
        favoritesCount: j['favoritesCount'] as int? ?? 0,
        images: (j['images'] as List? ?? [])
            .map((i) => PropertyImage.fromJson(i as Map<String, dynamic>))
            .toList(),
        amenities: (j['amenities'] as List? ?? []).map((a) => a as String).toList(),
        owner: PropertyOwner.fromJson(j['owner'] as Map<String, dynamic>),
      );
}

class PropertyImage {
  final String url;
  final bool isPrimary;
  PropertyImage({required this.url, required this.isPrimary});
  factory PropertyImage.fromJson(Map<String, dynamic> j) =>
      PropertyImage(url: j['url'] as String, isPrimary: j['isPrimary'] as bool? ?? false);
}

class PropertyOwner {
  final String id;
  final String? name;
  final String email;
  final String? phone;
  final String role;
  final String? agency;
  final String? licenseNo;

  PropertyOwner({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    required this.agency,
    required this.licenseNo,
  });

  factory PropertyOwner.fromJson(Map<String, dynamic> j) => PropertyOwner(
        id: j['id'] as String,
        name: j['name'] as String?,
        email: j['email'] as String,
        phone: j['phone'] as String?,
        role: j['role'] as String,
        agency: j['agency'] as String?,
        licenseNo: j['licenseNo'] as String?,
      );
}

class EngagementSummary {
  final String id;
  final String status;
  final DateTime updatedAt;
  final String buyerName;
  final String lawyerName;
  final String propertyId;
  final String propertyTitle;
  final String propertyCity;
  final num propertyPrice;
  final String? propertyImageUrl;
  final int documentCount;

  EngagementSummary({
    required this.id,
    required this.status,
    required this.updatedAt,
    required this.buyerName,
    required this.lawyerName,
    required this.propertyId,
    required this.propertyTitle,
    required this.propertyCity,
    required this.propertyPrice,
    required this.propertyImageUrl,
    required this.documentCount,
  });

  factory EngagementSummary.fromJson(Map<String, dynamic> j) => EngagementSummary(
        id: j['id'] as String,
        status: j['status'] as String,
        updatedAt: DateTime.parse(j['updatedAt'] as String),
        buyerName: (j['buyer'] as Map<String, dynamic>?)?['name'] as String? ?? '',
        lawyerName: (j['lawyer'] as Map<String, dynamic>?)?['name'] as String? ?? '',
        propertyId: (j['property'] as Map<String, dynamic>)['id'] as String,
        propertyTitle: (j['property'] as Map<String, dynamic>)['title'] as String,
        propertyCity: (j['property'] as Map<String, dynamic>)['city'] as String,
        propertyPrice: (j['property'] as Map<String, dynamic>)['price'] as num,
        propertyImageUrl: (j['property'] as Map<String, dynamic>)['imageUrl'] as String?,
        documentCount: j['documentCount'] as int? ?? 0,
      );
}
