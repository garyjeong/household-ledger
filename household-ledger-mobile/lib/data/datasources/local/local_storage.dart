import 'package:shared_preferences/shared_preferences.dart';
import '../../../config/app_config.dart';

class LocalStorage {
  final SharedPreferences _prefs;

  LocalStorage(this._prefs);

  // 토큰 저장/조회
  Future<void> saveAccessToken(String token) async {
    await _prefs.setString(AppConfig.keyAccessToken, token);
  }

  String? getAccessToken() {
    return _prefs.getString(AppConfig.keyAccessToken);
  }

  Future<void> saveRefreshToken(String token) async {
    await _prefs.setString(AppConfig.keyRefreshToken, token);
  }

  String? getRefreshToken() {
    return _prefs.getString(AppConfig.keyRefreshToken);
  }

  Future<void> clearTokens() async {
    await _prefs.remove(AppConfig.keyAccessToken);
    await _prefs.remove(AppConfig.keyRefreshToken);
  }

  // 사용자 정보 저장/조회
  Future<void> saveUser(Map<String, dynamic> user) async {
    // JSON 문자열로 저장
    await _prefs.setString(AppConfig.keyUser, user.toString());
  }

  Map<String, dynamic>? getUser() {
    final userString = _prefs.getString(AppConfig.keyUser);
    if (userString == null) return null;
    // TODO: JSON 파싱 구현
    return null;
  }

  Future<void> clearUser() async {
    await _prefs.remove(AppConfig.keyUser);
  }

  // 설정 저장/조회
  Future<void> saveSettings(Map<String, dynamic> settings) async {
    await _prefs.setString(AppConfig.keySettings, settings.toString());
  }

  Map<String, dynamic>? getSettings() {
    final settingsString = _prefs.getString(AppConfig.keySettings);
    if (settingsString == null) return null;
    // TODO: JSON 파싱 구현
    return null;
  }

  // 전체 데이터 삭제
  Future<void> clearAll() async {
    await _prefs.clear();
  }
}

