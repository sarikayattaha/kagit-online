# Vercel ile www.kagit.online Deployment Rehberi

Bu rehber, sitenizi Vercel'e deploy etmek için gereken tüm adımları detaylı olarak açıklar.

## Neden Vercel?

- ✅ Ücretsiz plan ile sınırsız proje
- ✅ Otomatik SSL sertifikası
- ✅ Global CDN ile hızlı performans
- ✅ GitHub ile otomatik deployment
- ✅ Subdomain desteği (admin.kagit.online)
- ✅ Kolay environment variable yönetimi
- ✅ Kurulum 10 dakika

---

## Adım 1: GitHub'a Kod Yükleme

### 1.1. GitHub Hesabı Oluştur (Eğer yoksa)

1. https://github.com adresine git
2. "Sign up" butonuna tıkla
3. E-posta, kullanıcı adı ve şifre ile kayıt ol
4. E-posta doğrulamasını tamamla

### 1.2. Yeni Repository Oluştur

1. GitHub'da giriş yaptıktan sonra
2. Sağ üst köşede **"+"** simgesine tıkla
3. **"New repository"** seç
4. Repository bilgilerini gir:
   ```
   Repository name: kagit-online
   Description: Kağıt Üretim Web Sitesi
   Visibility: Private veya Public (tercihinize göre)
   ```
5. **"Create repository"** butonuna tıkla

### 1.3. Kodu GitHub'a Yükle

Projenizin bulunduğu klasörde terminal/komut istemi açın ve şu komutları çalıştırın:

```bash
# Git'i başlat (eğer daha önce başlatmadıysanız)
git init

# Tüm dosyaları ekle
git add .

# İlk commit'i yap
git commit -m "Initial commit - Kagit Online Website"

# Ana branch'i main olarak ayarla
git branch -M main

# GitHub repository'nizi bağlayın (ÖNEMLİ: kendi kullanıcı adınızı yazın)
git remote add origin https://github.com/KULLANICI-ADINIZ/kagit-online.git

# Kodu GitHub'a yükle
git push -u origin main
```

**Not:** `KULLANICI-ADINIZ` yerine kendi GitHub kullanıcı adınızı yazın.

### 1.4. GitHub'da Kontrol

1. GitHub'da repository'nizi yenileyin
2. Tüm dosyalarınızın yüklendiğini doğrulayın
3. `src/`, `public/`, `package.json` gibi dosyalar görünmeli

---

## Adım 2: Vercel Hesabı Oluşturma

### 2.1. Vercel'e Kaydol

1. https://vercel.com adresine git
2. **"Sign Up"** butonuna tıkla
3. **"Continue with GitHub"** seçeneğini seç
4. GitHub ile giriş yap
5. Vercel'in GitHub'a erişim izni isteyeceği onay ekranı gelecek
6. **"Authorize Vercel"** butonuna tıkla

### 2.2. İlk Kez Giriş

- Vercel Dashboard'a yönlendirileceksiniz
- Sağ üstte profiliniz ve e-postanız görünmeli
- Şimdi proje oluşturmaya hazırsınız

---

## Adım 3: Projeyi Vercel'e Deploy Etme

### 3.1. Yeni Proje Oluştur

1. Vercel Dashboard'da **"Add New..."** butonuna tıkla
2. **"Project"** seçeneğini seç
3. **"Import Git Repository"** sayfası açılacak

### 3.2. GitHub Repository'yi Seç

1. **"Import Git Repository"** bölümünde
2. GitHub hesabınız listede görünecek
3. `kagit-online` repository'nizi bulun
4. Yanındaki **"Import"** butonuna tıkla

**Eğer repository görünmüyorsa:**
- "Adjust GitHub App Permissions" linkine tıklayın
- GitHub'da Vercel'e repository erişimi verin
- Sayfayı yenileyin

### 3.3. Proje Ayarlarını Yapılandır

Proje import sayfasında:

#### Build Settings (Otomatik Algılanır)

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**Bu ayarları değiştirmeyin**, Vercel otomatik algılar.

#### Root Directory

```
Root Directory: ./ (varsayılan)
```

Bunu da değiştirmeyin.

### 3.4. Environment Variables Ekle

**ÖNEMLİ:** Deploy'dan önce environment variables eklemelisiniz.

1. **"Environment Variables"** bölümünü genişletin
2. Aşağıdaki değişkenleri tek tek ekleyin:

**Değişken 1:**
```
Name: VITE_SUPABASE_URL
Value: https://zfslkmneullpwddfwbqy.supabase.co
```

**Değişken 2:**
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc2xrbW5ldWxscHdkZGZ3YnF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MzAzNzQsImV4cCI6MjA3NTUwNjM3NH0.lJF0Eo9NRo4J9w74KH4i9muqb3V0OcImJKizTbyg_jM
```

**Değişken 3-6:** (N8N webhook'ları - şimdilik placeholder bırakabilirsiniz)
```
Name: VITE_N8N_WEBHOOK_BASE_URL
Value: https://n8n.domain.com/webhook

Name: VITE_N8N_WEBHOOK_CALCULATOR
Value: https://n8n.domain.com/webhook/hesapla

Name: VITE_N8N_WEBHOOK_ORDERS
Value: https://n8n.domain.com/webhook/siparis

Name: VITE_N8N_WEBHOOK_CONTACT
Value: https://n8n.domain.com/webhook/iletisim
```

Her değişken için:
1. Name kısmına değişken adını yazın
2. Value kısmına değeri yapıştırın
3. **"Add"** butonuna tıklayın
4. Sonraki değişkene geçin

### 3.5. Deploy Başlat

1. Tüm environment variables'ları ekledikten sonra
2. **"Deploy"** butonuna tıklayın
3. Build süreci başlayacak (2-3 dakika)

### 3.6. Build Sürecini İzle

Build ilerleyişi ekranda gösterilir:
```
Installing dependencies...
Building...
Deploying...
```

**Başarılı olduğunda:**
- 🎉 Tebrikler simgesi göreceksiniz
- **"Visit"** butonu aktif olacak
- Geçici bir Vercel URL'i alacaksınız (örn: `kagit-online.vercel.app`)

**Eğer hata alırsanız:**
- Build logs'u inceleyin
- Environment variables'ları kontrol edin
- GitHub'da kodun doğru yüklendiğini kontrol edin

---

## Adım 4: Custom Domain Ekleme (kagit.online)

Build başarılı olduktan sonra domain'inizi bağlayalım.

### 4.1. Vercel'de Domain Settings

1. Vercel Dashboard'da projenizi seçin
2. Üst menüden **"Settings"** sekmesine tıklayın
3. Sol menüden **"Domains"** seçin

### 4.2. Domain Ekle

#### Domain 1: www.kagit.online (Ana Site)

1. Domain input alanına **`www.kagit.online`** yazın
2. **"Add"** butonuna tıklayın
3. Vercel, DNS ayarlarını gösterecek

#### Domain 2: admin.kagit.online (Admin Panel)

1. Tekrar domain input alanına **`admin.kagit.online`** yazın
2. **"Add"** butonuna tıklayın
3. Aynı şekilde DNS ayarlarını göreceksiniz

#### Domain 3: kagit.online (Root - www'ye yönlendirme)

1. Son olarak **`kagit.online`** yazın (www olmadan)
2. **"Add"** butonuna tıklayın
3. Vercel otomatik olarak www'ye yönlendirecek

### 4.3. DNS Ayarlarını Kopyala

Her domain için Vercel şu bilgileri verecek:

**CNAME Kaydı için:**
```
Type: CNAME
Name: www (veya admin)
Value: cname.vercel-dns.com
```

**A Kaydı için (root domain):**
```
Type: A
Name: @
Value: 76.76.21.21
```

Bu bilgileri not alın, Hostinger'da kullanacaksınız.

---

## Adım 5: Hostinger DNS Ayarları

### 5.1. Hostinger Panel'e Giriş

1. https://hpanel.hostinger.com adresine gidin
2. Hostinger hesabınızla giriş yapın
3. **"Domains"** bölümüne gidin
4. **`kagit.online`** domain'inizi seçin

### 5.2. DNS Zone Editor'ü Aç

1. **"DNS / Name Servers"** sekmesine tıklayın
2. **"DNS Zone"** seçeneğini seçin
3. **"Manage DNS records"** butonuna tıklayın

### 5.3. DNS Kayıtlarını Ekle

#### Kayıt 1: www subdomain

1. **"Add Record"** butonuna tıklayın
2. Bilgileri girin:
   ```
   Type: CNAME
   Name: www
   Target: cname.vercel-dns.com
   TTL: 3600 (varsayılan)
   ```
3. **"Save"** veya **"Add Record"** butonuna tıklayın

#### Kayıt 2: admin subdomain

1. Tekrar **"Add Record"** butonuna tıklayın
2. Bilgileri girin:
   ```
   Type: CNAME
   Name: admin
   Target: cname.vercel-dns.com
   TTL: 3600
   ```
3. **"Save"** butonuna tıklayın

#### Kayıt 3: Root domain

**ÖNEMLİ:** Eğer root domain (@) için mevcut bir A kaydı varsa, önce silin.

1. **"Add Record"** (veya mevcut @ kaydını düzenle)
2. Bilgileri girin:
   ```
   Type: A
   Name: @ (veya boş bırakın)
   Target: 76.76.21.21
   TTL: 3600
   ```
3. **"Save"** butonuna tıklayın

### 5.4. DNS Kayıtlarını Doğrula

DNS Zone Editor'de şu kayıtları görmelisiniz:

```
www      CNAME    cname.vercel-dns.com    3600
admin    CNAME    cname.vercel-dns.com    3600
@        A        76.76.21.21             3600
```

---

## Adım 6: DNS Propagasyonu ve Doğrulama

### 6.1. DNS Propagasyonu Bekleyin

DNS değişiklikleri dünya çapında yayılması **2-4 saat** sürebilir.

**Sabırlı olun!** Bu süre boyunca:
- Bazen site açılabilir, bazen açılmayabilir
- Farklı cihazlardan farklı sonuçlar alabilirsiniz
- Bu normaldir

### 6.2. DNS Propagasyonunu Kontrol Edin

#### Online Araçlar:

**WhatsMyDNS:**
1. https://www.whatsmydns.net adresine gidin
2. `www.kagit.online` yazın
3. Dünya haritasında yeşil tik işaretleri görmelisiniz
4. Aynı şekilde `admin.kagit.online` için de kontrol edin

**DNS Checker:**
1. https://dnschecker.org adresine gidin
2. Domain'i girin ve kontrol edin

#### Terminal/Komut İstemi:

**Windows:**
```powershell
nslookup www.kagit.online
nslookup admin.kagit.online
```

**Mac/Linux:**
```bash
dig www.kagit.online
dig admin.kagit.online
```

### 6.3. Vercel'de Domain Durumu

1. Vercel Dashboard → Settings → Domains
2. Her domain yanında durum göreceksiniz:
   - ✅ **Valid Configuration** - Hazır!
   - ⏳ **Pending** - DNS henüz yayılmadı
   - ❌ **Invalid** - DNS ayarları yanlış

**Tüm domain'ler "Valid Configuration" olana kadar bekleyin.**

---

## Adım 7: SSL Sertifikası (Otomatik)

Vercel otomatik olarak SSL sertifikası oluşturur.

### 7.1. SSL Durumu

1. Domain'ler "Valid Configuration" olduktan sonra
2. Vercel otomatik SSL sertifikası oluşturacak
3. Bu işlem **5-15 dakika** sürer
4. Hiçbir şey yapmanıza gerek yok

### 7.2. SSL Kontrolü

1. Tarayıcıda `https://www.kagit.online` açın
2. URL'in başında yeşil kilit simgesi görmelisiniz
3. Kilit simgesine tıklayın, "Connection is secure" yazmalı

---

## Adım 8: Supabase CORS Ayarları

### 8.1. Supabase Dashboard'a Giriş

1. https://supabase.com/dashboard adresine gidin
2. Giriş yapın
3. `zfslkmneullpwddfwbqy` projesini seçin

### 8.2. CORS Ayarlarını Yapılandır

1. Sol menüden **"Settings"** seçin
2. **"API"** alt sekmesine gidin
3. **"URL Configuration"** bölümünü bulun
4. **"Allowed origins"** kısmına ekleyin:

```
https://www.kagit.online
https://admin.kagit.online
https://kagit.online
```

Her satıra bir URL yazın.

5. **"Save"** butonuna tıklayın

**Not:** Virgül veya noktalı virgül eklemeyin, her URL ayrı satırda olmalı.

---

## Adım 9: Admin Kullanıcısı Oluşturma

### 9.1. Supabase'de Admin Ekle

1. Supabase Dashboard'da (zaten girişlisiniz)
2. Sol menüden **"Authentication"** seçin
3. **"Users"** alt sekmesine gidin
4. **"Add User"** butonuna tıklayın

### 9.2. Kullanıcı Bilgilerini Girin

```
Email: admin@kagit.online
Password: [Güçlü bir şifre oluşturun]
```

**Şifre Önerileri:**
- Minimum 8 karakter
- Büyük ve küçük harf
- Rakam ve özel karakter içermeli
- Örnek: `Kagit2024!Admin`

### 9.3. Önemli: Auto Confirm

**MUTLAKA işaretleyin:**
- ✅ **"Auto Confirm User"** checkbox'ını AKTİF edin

Bu olmadan e-posta doğrulaması gerekir ve admin panele giremezsiniz.

### 9.4. Kullanıcıyı Oluştur

1. **"Create User"** butonuna tıklayın
2. Kullanıcı listesinde admin'inizi göreceksiniz
3. E-posta ve şifreyi not edin (güvenli bir yere)

---

## Adım 10: Test ve Doğrulama

### 10.1. Ana Site Testi

1. Tarayıcıda **`https://www.kagit.online`** açın
2. Kontrol edin:
   - ✅ Ana sayfa yükleniyor
   - ✅ SSL aktif (yeşil kilit)
   - ✅ Navigasyon çalışıyor
   - ✅ Hesaplama sayfası açılıyor
   - ✅ Ürünler sayfası açılıyor
   - ✅ İletişim sayfası açılıyor
   - ✅ Mobile responsive çalışıyor

### 10.2. Admin Panel Testi

1. Tarayıcıda **`https://admin.kagit.online`** açın
2. Kontrol edin:
   - ✅ Admin giriş sayfası otomatik açılıyor
   - ✅ SSL aktif
3. Giriş yapın:
   - E-posta: `admin@kagit.online`
   - Şifre: [Oluşturduğunuz şifre]
4. "Giriş Yap" butonuna tıklayın
5. Kontrol edin:
   - ✅ Admin Dashboard açılıyor
   - ✅ Döviz Kurları sayfası çalışıyor
   - ✅ Rulo Enleri sayfası çalışıyor
   - ✅ Çıkış butonu çalışıyor

### 10.3. Root Domain Testi

1. Tarayıcıda **`https://kagit.online`** yazın (www olmadan)
2. Otomatik olarak `https://www.kagit.online` adresine yönlendirmeli

---

## Adım 11: Otomatik Deployment

### 11.1. Nasıl Çalışır?

Artık GitHub'a her kod değişikliği gönderdiğinizde, Vercel otomatik olarak:
1. Yeni kodu algılar
2. Build işlemini çalıştırır
3. Test eder
4. Başarılıysa canlıya alır

### 11.2. Kod Güncellemesi Yapmak

```bash
# Değişiklikleri kaydet
git add .
git commit -m "Güncelleme açıklaması"
git push

# Vercel otomatik deploy edecek
```

### 11.3. Vercel'de Build İzleme

1. Vercel Dashboard → Project
2. **"Deployments"** sekmesi
3. Her commit için yeni bir deployment görürsünüz
4. Build durumunu izleyebilirsiniz
5. Başarılıysa otomatik canlıya alınır

---

## Sorun Giderme

### "DNS_PROBE_FINISHED_NXDOMAIN" Hatası

**Neden:** DNS kayıtları henüz yayılmadı.

**Çözüm:**
1. 2-4 saat bekleyin
2. DNS kayıtlarını Hostinger'da tekrar kontrol edin
3. https://www.whatsmydns.net ile global durumu kontrol edin
4. Tarayıcı cache'ini temizleyin (Ctrl+Shift+Delete)

### "SSL_ERROR" veya "Not Secure" Uyarısı

**Neden:** SSL sertifikası henüz oluşturulmadı.

**Çözüm:**
1. 10-15 dakika bekleyin
2. Vercel'de domain durumunu kontrol edin
3. Hard refresh yapın (Ctrl+F5)
4. Gizli pencerede deneyin

### "Build Failed" Hatası

**Neden:** Environment variables eksik veya kod hatası.

**Çözüm:**
1. Vercel'de build logs'u inceleyin
2. Environment variables'ları kontrol edin
3. Lokalde `npm run build` çalıştırıp test edin
4. GitHub'a düzgün yükleme yapıldığını kontrol edin

### Admin Paneline Giriş Yapamıyorum

**Neden:** Supabase kullanıcısı yanlış yapılandırılmış.

**Çözüm:**
1. Supabase → Authentication → Users kontrol edin
2. "Auto Confirm User" aktif mi kontrol edin
3. "Confirmed at" sütununda tarih var mı kontrol edin
4. Yoksa, kullanıcıyı silin ve tekrar oluşturun

### Vercel'de Domain "Invalid Configuration" Gösteriyor

**Neden:** DNS kayıtları yanlış veya eksik.

**Çözüm:**
1. Hostinger DNS Zone Editor'ü açın
2. Kayıtları tekrar kontrol edin:
   - www → CNAME → cname.vercel-dns.com
   - admin → CNAME → cname.vercel-dns.com
   - @ → A → 76.76.21.21
3. Kayıtları silin ve tekrar ekleyin
4. 1 saat bekleyin ve kontrol edin

---

## Başarı Checklist

### GitHub
- [x] GitHub hesabı oluşturuldu
- [x] Repository oluşturuldu
- [x] Kod GitHub'a yüklendi

### Vercel
- [x] Vercel hesabı oluşturuldu (GitHub ile)
- [x] Proje import edildi
- [x] Environment variables eklendi
- [x] İlk deployment başarılı
- [x] www.kagit.online domain'i eklendi
- [x] admin.kagit.online domain'i eklendi
- [x] kagit.online root domain'i eklendi

### Hostinger DNS
- [x] Hostinger panel'e giriş yapıldı
- [x] DNS Zone Editor açıldı
- [x] www CNAME kaydı eklendi
- [x] admin CNAME kaydı eklendi
- [x] Root A kaydı eklendi

### Supabase
- [x] CORS ayarları yapıldı
- [x] Admin kullanıcısı oluşturuldu
- [x] Auto Confirm aktif edildi

### Test
- [x] www.kagit.online açılıyor
- [x] admin.kagit.online açılıyor
- [x] SSL aktif (yeşil kilit)
- [x] Admin girişi çalışıyor
- [x] Dashboard açılıyor
- [x] Tüm sayfalar çalışıyor

---

## Tebrikler! 🎉

Siteniz artık canlıda!

**Ana Site:** https://www.kagit.online
**Admin Panel:** https://admin.kagit.online

### Sonraki Adımlar

1. **Analytics Ekle**
   - Vercel Analytics (ücretsiz, built-in)
   - Google Analytics

2. **Performance İzle**
   - Vercel Dashboard'da performans metrikleri
   - Lighthouse score kontrol et

3. **SEO Optimize Et**
   - Google Search Console'a ekle
   - Meta tags ekle
   - Sitemap oluştur

4. **Monitoring**
   - Uptime monitoring (UptimeRobot)
   - Error tracking

5. **Backup**
   - Kod zaten GitHub'da güvende
   - Supabase otomatik backup yapıyor

Başarılar dileriz!
