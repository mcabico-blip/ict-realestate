import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'config.dart';

/// Thin HTTP wrapper that auto-attaches the auth Bearer token from secure
/// storage and handles JSON encoding/decoding.
class ApiClient {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'auth_token';

  static Future<String?> getToken() => _storage.read(key: _tokenKey);
  static Future<void> setToken(String token) =>
      _storage.write(key: _tokenKey, value: token);
  static Future<void> clearToken() => _storage.delete(key: _tokenKey);

  static Future<Map<String, String>> _headers({bool requireAuth = false}) async {
    final h = <String, String>{'Content-Type': 'application/json'};
    final token = await getToken();
    if (token != null && token.isNotEmpty) {
      h['Authorization'] = 'Bearer $token';
    } else if (requireAuth) {
      throw ApiException(401, 'Not signed in');
    }
    return h;
  }

  static Uri _url(String path, [Map<String, String>? query]) {
    final uri = Uri.parse('${AppConfig.apiBase}$path');
    if (query == null || query.isEmpty) return uri;
    return uri.replace(queryParameters: {
      ...uri.queryParameters,
      ...query.map((k, v) => MapEntry(k, v.toString())),
    });
  }

  static Future<Map<String, dynamic>> get(
    String path, {
    Map<String, String>? query,
    bool requireAuth = false,
  }) async {
    final res = await http.get(_url(path, query), headers: await _headers(requireAuth: requireAuth));
    return _decode(res);
  }

  static Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? body,
    bool requireAuth = false,
  }) async {
    final res = await http.post(
      _url(path),
      headers: await _headers(requireAuth: requireAuth),
      body: body == null ? null : jsonEncode(body),
    );
    return _decode(res);
  }

  static Map<String, dynamic> _decode(http.Response res) {
    Map<String, dynamic> data;
    try {
      data = jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      throw ApiException(res.statusCode, 'Invalid response (${res.statusCode})');
    }
    if (res.statusCode >= 400) {
      final err = data['error']?.toString() ?? 'Request failed';
      throw ApiException(res.statusCode, err);
    }
    return data;
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException(this.statusCode, this.message);

  @override
  String toString() => 'ApiException($statusCode): $message';
}
