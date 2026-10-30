# Cuaca — NandaSky

Dashboard cuaca statis dengan tampilan liquid glass, data live dari Open-Meteo, dan dukungan tema gelap/terang.

## Fitur

- Pencarian kota dan chip kota populer: Jakarta, Bandung, Surabaya, Yogyakarta, Denpasar
- Cuaca saat ini, prakiraan 24 jam, dan prakiraan 7 hari
- Halaman **Cuaca Saya** untuk menyimpan hingga 8 kota/negara, lengkap dengan waktu setempat, suhu, kondisi, serta suhu tertinggi/terendah
- Tombol `+` di header untuk membuka halaman Cuaca Saya; pada layar kecil tombol ini menggantikan menu navigasi
- Kelembapan, kecepatan angin, peluang hujan, tekanan udara, UV, jarak pandang, serta matahari terbit/terbenam
- Kualitas udara (US AQI dan PM2.5) dan saran cuaca harian
- Tema gelap/terang yang tersimpan, kota terakhir yang berhasil dimuat juga diingat
- Responsif untuk desktop dan ponsel; bagian per jam dan harian bisa digeser horizontal
- Mode performa di ponsel memakai kaca semi-opaque tanpa backdrop blur agar kartu tidak kosong saat scroll, sementara efek kaca penuh tetap aktif di desktop
- Font Plus Jakarta Sans, background, dan ikon Meteocons disimpan secara lokal
- Background tema aktif dimuat lebih dulu; foto tema lain baru disiapkan setelah halaman selesai dimuat agar transisi tema tetap mulus
- Di ponsel, background memakai varian 1280px yang lebih ringan
- Koordinat kota populer dan hasil pencarian di-cache agar tidak perlu geocoding berulang
- Hasil cuaca terakhir disimpan selama 6 jam dan langsung ditampilkan saat halaman dibuka lagi, lalu diperbarui di belakang
- Kualitas udara dimuat terpisah sehingga suhu dan kondisi utama bisa tampil lebih dulu
- `preconnect` ke endpoint Open-Meteo mempercepat permintaan pertama

Daftar Cuaca Saya disimpan di `localStorage` browser pengguna. Tidak ada akun atau database, sehingga daftar tidak tersinkron antarperangkat dan hanya tersedia di browser yang sama. Menghapus data situs atau memakai mode privat akan menghapus daftar tersebut. Cache cuaca dan koordinat juga hanya tersimpan di perangkat pengguna.

## Menjalankan secara lokal

Project ini tidak memerlukan proses build.

```powershell
cd D:\HTML\Cuaca
python -m http.server 8765
```

Buka `http://127.0.0.1:8765`.

Data cuaca dan kualitas udara diambil langsung dari API Open-Meteo, jadi koneksi internet diperlukan. Tidak ada API key, backend, atau secret di dalam project ini.

## Teknologi

- HTML, CSS, dan JavaScript vanilla
- [Open-Meteo](https://open-meteo.com/) untuk data cuaca, geocoding, dan kualitas udara
- [Meteocons](https://github.com/basmilius/meteocons) untuk ikon cuaca
- [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans) untuk tipografi, dengan lisensi SIL Open Font License
- Foto latar dari [Unsplash](https://unsplash.com/)

## Atribusi

Data cuaca oleh [Open-Meteo](https://open-meteo.com/). Ikon oleh [Meteocons](https://github.com/basmilius/meteocons). Font oleh [Tokotype](https://github.com/tokotype/PlusJakartaSans) dengan lisensi SIL Open Font License. Foto oleh [Unsplash](https://unsplash.com/).
