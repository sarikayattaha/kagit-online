# Hızlı Başlangıç - Vercel Deployment

Bu dosya, en hızlı şekilde sitenizi canlıya almak için gerekli adımları özetler.

## 5 Adımda Canlıya Alın

### 1️⃣ GitHub'a Yükle (5 dakika)

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/KULLANICI-ADINIZ/kagit-online.git
git push -u origin main
```

**Not:** `KULLANICI-ADINIZ` yerine GitHub kullanıcı adınızı yazın.

---

### 2️⃣ Vercel'e Deploy Et (3 dakika)

1. https://vercel.com → "Sign Up with GitHub"
2. "Add New..." → "Project"
3. `kagit-online` repository'yi seç → "Import"
4. **Environment Variables ekle:**
   ```
   VITE_SUPABASE_URL = https://zfslkmneullpwddfwbqy.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc2xrbW5ldWxscHdkZGZ3YnF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MzAzNzQsImV4cCI6MjA3NTUwNjM3NH0.lJF0Eo9NRo4J9w74KH4i9muqb3V0OcImJKizTbyg_jM
   ```
5. "Deploy" butonuna tıkla
6. 2-3 dakika bekle

---

### 3️⃣ Domain Ekle (2 dakika)

Vercel'de Settings → Domains:

1. `www.kagit.online` ekle
2. `admin.kagit.online` ekle
3. `kagit.online` ekle

---

### 4️⃣ DNS Ayarla (5 dakika)

Hostinger → kagit.online → DNS Zone:

```
Type: CNAME | Name: www   | Target: cname.vercel-dns.com
Type: CNAME | Name: admin | Target: cname.vercel-dns.com
Type: A     | Name: @     | Target: 76.76.21.21
```

---

### 5️⃣ Admin Oluştur (2 dakika)

Supabase → Authentication → Add User:

```
Email: admin@kagit.online
Password: [Güçlü şifre]
✅ Auto Confirm User
```

---

## Bekle ve Test Et

**2-4 saat sonra:**
- ✅ www.kagit.online açılacak
- ✅ admin.kagit.online açılacak
- ✅ SSL otomatik aktif olacak

---

## Detaylı Rehber

Adım adım ekran görüntülü rehber için:
📖 **[VERCEL-KURULUM.md](./VERCEL-KURULUM.md)** dosyasını okuyun

---

## Sorun mu Var?

### DNS henüz çalışmıyor
→ 2-4 saat bekleyin (normal)
→ https://www.whatsmydns.net ile kontrol edin

### Build hatası aldım
→ Environment variables'ları kontrol edin
→ GitHub'da kod doğru yüklendi mi kontrol edin

### Admin girişi çalışmıyor
→ Supabase'de "Auto Confirm User" aktif mi?
→ E-posta ve şifre doğru mu?

---

## İletişim

Detaylı sorun giderme için:
- [VERCEL-KURULUM.md](./VERCEL-KURULUM.md) - Tam rehber
- [ADMIN-ACCESS.md](./ADMIN-ACCESS.md) - Admin panel rehberi
- [HOSTINGER-DNS.md](./HOSTINGER-DNS.md) - DNS detayları

Başarılar! 🚀
