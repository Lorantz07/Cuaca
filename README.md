# Cuaca — WeatherNow

Dashboard cuaca statis dengan tampilan liquid glass, data live dari Open-Meteo, dan dukungan tema gelap/terang.

## Fitur

- Pencarian kota dan chip kota populer: Jakarta, Bandung, Surabaya, Yogyakarta, Denpasar
- Cuaca saat ini, prakiraan 24 jam, dan prakiraan 7 hari
- Kelembapan, kecepatan angin, peluang hujan, tekanan udara, UV, jarak pandang, serta matahari terbit/terbenam
- Kualitas udara (US AQI dan PM2.5) dan saran cuaca harian
- Tema gelap/terang yang tersimpan, kota terakhir yang berhasil dimuat juga diingat
- Responsif untuk desktop dan ponsel; bagian per jam dan harian bisa digeser horizontal
- Background dan ikon Meteocons disimpan secara lokal

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
- Foto latar dari [Unsplash](https://unsplash.com/)

## Atribusi

Data cuaca oleh [Open-Meteo](https://open-meteo.com/). Ikon oleh [Meteocons](https://github.com/basmilius/meteocons). Foto oleh [Unsplash](https://unsplash.com/).
