# Tamma APK 📚

> Aplikasi Manajemen Tahfidh Juz Amma & Absensi Siswa — dikemas sebagai APK Android.

## Struktur Proyek

```
tamma-apk/
├── .github/
│   └── workflows/
│       └── build-apk.yml      ← GitHub Actions: otomatis build APK
├── scripts/
│   └── inline-assets.js       ← Script: embed semua CDN → offline penuh
├── www/
│   └── index.html             ← Source HTML aplikasi
├── capacitor.config.json      ← Konfigurasi Capacitor
└── package.json
```

---

## 🚀 Cara Build APK via GitHub Actions

### 1. Push ke GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/tamma-apk.git
git push -u origin main
```

### 2. Build otomatis
GitHub Actions akan otomatis berjalan setiap `push` ke branch `main`.  
APK bisa diunduh dari tab **Actions → Build Tamma APK → Artifacts**.

### 3. Build manual
Di GitHub: **Actions → Build Tamma APK → Run workflow** → pilih `debug` atau `release`.

---

## 🔐 Build Release APK (Opsional)

Untuk APK yang bisa dipublish ke Play Store, tambahkan **Repository Secrets** di:  
`Settings → Secrets and variables → Actions`

| Secret | Isi |
|--------|-----|
| `KEYSTORE_BASE64` | Keystore file di-encode base64: `base64 -w0 tamma.jks` |
| `KEY_ALIAS` | Alias key di keystore |
| `KEY_PASSWORD` | Password key |
| `STORE_PASSWORD` | Password keystore |

Buat keystore baru (jika belum punya):
```bash
keytool -genkey -v \
  -keystore tamma.jks \
  -alias tamma \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### Build release via tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```
→ APK release otomatis terbuat dan muncul di GitHub Releases.

---

## 💻 Build Lokal

```bash
# Install dependencies
npm install

# Inline semua CDN assets → offline
npm run inline

# Add Android platform (hanya pertama kali)
npx cap add android

# Sync web ke Android
npx cap sync android

# Buka di Android Studio
npx cap open android

# Atau build langsung
cd android && ./gradlew assembleDebug
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## ✈️ Fitur Offline

Setelah build, `www/index.html` akan berisi:
- ✅ Font Awesome (semua font di-embed sebagai base64)
- ✅ SheetJS/xlsx (inline)
- ✅ Tidak ada request ke CDN manapun
- ✅ Berfungsi 100% tanpa internet

---

## 📱 Persyaratan Android
- **Min SDK**: 22 (Android 5.1)
- **Target SDK**: 34 (Android 14)
