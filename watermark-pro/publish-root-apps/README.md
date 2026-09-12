# Fail root Socmegy untuk pemasangan berasingan

Folder ini ialah pakej **root laman socmegy.com**, bukan kandungan `/watermark-pro/`.

- `admintest.html` -> halaman sedia ada yang disajikan pada `/admintest`
- `admintest.webmanifest` -> `/admintest.webmanifest`
- `adminnntesttt.html` -> halaman sedia ada yang disajikan pada `/adminnntesttt`
- `adminnntesttt.webmanifest` -> `/adminnntesttt.webmanifest`

HTML diambil daripada halaman awam live pada 9 September 2026. Satu-satunya perubahan pada setiap HTML ialah penambahan pautan manifest di dalam head. Jika fail sumber repo lebih baharu daripada snapshot ini, terapkan pautan itu pada fail sumber terkini:

```html
<!-- Dalam halaman /admintest -->
<link rel="manifest" href="/admintest.webmanifest">
<!-- Dalam halaman /adminnntesttt -->
<link rel="manifest" href="/adminnntesttt.webmanifest">
```

ID, start_url dan scope setiap app berbeza daripada `/watermark-pro/`. Laluan admin sedia ada **tidak mempunyai trailing slash**; jangan ubah pautan kepada `/admintest/`, yang memberikan 404 ketika audit.

Ikon menggunakan `/logo.png` yang sudah dirujuk halaman admin. Nama aplikasi mengekalkan jenama Socmegy.

Pakej ini belum diterbitkan. Menyalin `publish/` Watermark Pro sahaja tidak mengubah manifest app admin. Pemasangan shortcut lama pada Android mungkin masih menyimpan skop root lama; kod laman tidak boleh menyunting rekod shortcut OS itu. Selepas manifest unik diterbitkan, pemasangan semula shortcut admin lama mungkin diperlukan sekali untuk menetapkan identiti baharunya.

Rujukan: [Chrome — skop aplikasi bertindih boleh menyekat beforeinstallprompt](https://web.dev/articles/building-multiple-pwas-on-the-same-domain#additional_challenges_for_overlapping_and_nested_paths).
