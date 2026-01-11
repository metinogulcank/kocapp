# 🚀 KocApp - cPanel Deployment Rehberi

## 📋 Ön Hazırlıklar

### 1. cPanel Gereksinimleri
- **Node.js** desteği (v16+)
- **MongoDB** veritabanı erişimi
- **PM2** process manager
- **SSL** sertifikası (Let's Encrypt)

### 2. Domain ve Hosting
- **Ana Domain**: `kocapp.com`
- **API Subdomain**: `api.kocapp.com`
- cPanel hosting hesabınızda Node.js uygulaması oluşturun

## 🔧 Frontend Deployment (React)

### 1. Build İşlemi
```bash
# Proje ana dizininde
cd kocapp
npm install
npm run build
```

### 2. Dosya Yükleme
- `build` klasöründeki tüm dosyaları cPanel File Manager ile `public_html` klasörüne yükleyin
- `.htaccess` dosyasını `public_html` klasörüne kopyalayın

### 3. Domain Yapılandırması
- cPanel'de **Subdomains** veya **Addon Domains** ile domain'inizi yapılandırın
- Document Root'u `public_html` olarak ayarlayın

## 🖥️ Backend Deployment (Node.js)

### 1. Server Dosyalarını Yükleme
```bash
# Server klasörünü cPanel'e yükleyin
# Önerilen yol: /home/username/kocapp-server
```

### 2. Environment Variables
```bash
# .env.production dosyasını oluşturun
cp env.production.example .env.production

# Gerekli değerleri düzenleyin:
# - MONGODB_URI: MongoDB bağlantı string'i
# - JWT_SECRET: Güçlü bir secret key
# - EMAIL_*: Email SMTP ayarları
# - CORS_ORIGIN: Frontend domain'iniz
```

### 3. PM2 Kurulumu ve Başlatma
```bash
# PM2'yi global olarak kurun
npm install -g pm2

# Bağımlılıkları yükleyin
npm install --production

# PM2 ile uygulamayı başlatın
pm2 start ecosystem.config.js --env production

# PM2'yi sistem başlangıcında çalıştırmak için
pm2 startup
pm2 save
```

### 4. MongoDB Bağlantısı
- **MongoDB Atlas** kullanıyorsanız:
  - Cluster oluşturun
  - Database user ekleyin
  - IP whitelist'e sunucu IP'nizi ekleyin
  - Connection string'i `.env.production`'a ekleyin

- **Hosting sağlayıcınızın MongoDB**'si varsa:
  - Veritabanı oluşturun
  - Kullanıcı ekleyin
  - Bağlantı bilgilerini `.env.production`'a ekleyin

## 🌐 cPanel Yapılandırması

### 1. Node.js Uygulaması Oluşturma
1. cPanel → **Node.js Selector**
2. **Create Application**
3. **Node.js Version**: 16.x veya üzeri
4. **Application Mode**: Production
5. **Application Root**: `/home/username/kocapp-server`
6. **Application URL**: `api.kocapp.com` (subdomain)
7. **Application Startup File**: `src/index.js`

### 2. Environment Variables
cPanel Node.js uygulamasında:
- **Environment Variables** sekmesine gidin
- `.env.production` dosyasındaki değerleri ekleyin

### 3. SSL Sertifikası
1. cPanel → **SSL/TLS**
2. **Let's Encrypt** ile ücretsiz SSL sertifikası alın
3. Hem frontend hem backend domain'leri için SSL aktif edin

## 🔄 API Proxy Yapılandırması

### .htaccess Güncellemesi
```apache
# API istekleri için backend'e yönlendirme
RewriteCond %{REQUEST_URI} ^/api/(.*)$
RewriteRule ^api/(.*)$ https://api.kocapp.com:5000/api/$1 [P,L]
```

## 📊 Monitoring ve Logs

### PM2 Monitoring
```bash
# Uygulama durumunu kontrol edin
pm2 status

# Logları görüntüleyin
pm2 logs kocapp-server

# Uygulamayı yeniden başlatın
pm2 restart kocapp-server
```

### cPanel Logs
- **Error Logs**: cPanel → **Error Logs**
- **Access Logs**: cPanel → **Raw Access Logs**

## 🚨 Troubleshooting

### Yaygın Sorunlar

1. **CORS Hatası**
   - `.env.production`'da `CORS_ORIGIN` değerini kontrol edin
   - Frontend domain'inizi tam olarak yazın

2. **MongoDB Bağlantı Hatası**
   - Connection string'i kontrol edin
   - IP whitelist'e sunucu IP'nizi ekleyin
   - Database user permissions'ları kontrol edin

3. **PM2 Başlatma Hatası**
   - Node.js versiyonunu kontrol edin
   - Port 5000'in kullanılabilir olduğundan emin olun
   - Environment variables'ları kontrol edin

4. **Frontend Routing Hatası**
   - `.htaccess` dosyasının doğru yerde olduğundan emin olun
   - Apache mod_rewrite'ın aktif olduğunu kontrol edin

## 🔐 Güvenlik Önerileri

1. **Environment Variables**
   - `.env` dosyalarını asla public repository'ye commit etmeyin
   - Güçlü JWT secret kullanın (min 32 karakter)

2. **HTTPS**
   - Tüm trafiği HTTPS üzerinden yönlendirin
   - SSL sertifikasını düzenli olarak yenileyin

3. **Rate Limiting**
   - API endpoint'lerinde rate limiting uygulayın
   - Brute force saldırılarına karşı koruma sağlayın

## 📈 Performance Optimizasyonu

1. **Frontend**
   - Build dosyalarını sıkıştırın
   - CDN kullanın
   - Browser caching'i aktif edin

2. **Backend**
   - PM2 cluster mode kullanın
   - Database indexing'i optimize edin
   - Memory usage'ı monitor edin

## 🎯 Son Kontroller

- [ ] Frontend build başarılı
- [ ] Backend PM2 ile çalışıyor
- [ ] MongoDB bağlantısı aktif
- [ ] SSL sertifikası çalışıyor
- [ ] API endpoint'leri test edildi
- [ ] Frontend routing çalışıyor
- [ ] Email gönderimi test edildi
- [ ] Error logging aktif

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. cPanel Error Logs'u kontrol edin
2. PM2 logs'u kontrol edin
3. Browser Developer Tools'da network errors'ları kontrol edin
4. MongoDB Atlas dashboard'unda connection status'u kontrol edin
