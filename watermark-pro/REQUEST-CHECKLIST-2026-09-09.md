# Semakan permintaan 9 September 2026

Pembetulan dibuat dalam workspace ini dan dibina ke `publish/`. Belum diterbitkan ke socmegy.com.

| No. | Permintaan | Pembetulan |
| --- | --- | --- |
| 1 | Ring Pro dalam PNG supporter | Ring bertekstur bg.jpg dilukis pada canvas sebelum avatar. |
| 2 | Avatar Top Users mobile di tengah ring | Kotak border dan imej disatukan; imej memenuhi ruang dalaman, object-fit cover dan object-position center. |
| 3 | Klik logo watermark oleh akaun percuma | Klik label dan Enter/Space membuka modal Pro; ujian klik tetikus lulus. |
| 4 | Refresh profil/pelan/tetapan 404 | Build menghasilkan direktori sebenar dengan index.html di root workspace dan publish; base aset kekal pada direktori aplikasi. |
| 5 | Install aplikasi berasingan dan butang install | Manifest Watermark Pro menggunakan id/scope /watermark-pro/; butang sentiasa tersedia di browser, dengan prompt asli atau bantuan pemasangan. Manifest aplikasi root dan adminnntesttt tidak diubah. Pemasangan ketiga-tiga aplikasi serentak pada peranti sebenar belum diuji. |
| 6 | Margin resit akhir mobile | Padding modal, pembalut dan helaian dikurangkan; margin cetak A4 4 mm dan padding helaian 8 px. |
| 7 | Saiz pautan supporter card | Pautan dan teks terima kasih menggunakan saiz sama; canvas menggunakan font 28 px yang sama. |
| 8 | Pemilik mendapat rupa dan akses Pro | Pengecualian owner pada ring/W mark dibuang; kad supporter tersedia; control mengiktiraf role admin sebagai Pro. |
| 9 | Ring Top Users terlalu tebal | Border CSS tunggal 1.5 px tanpa padding/ring bertindan. |
| 10 | Status bar telefon tidak kelihatan | Theme color navy, mod standalone, status bar iOS default. Kontras status bar OS sebenar masih memerlukan semakan peranti selepas pemasangan. |
| 11 | W mark ikut preview.html | Saiz inline 13 px, gap 3 px, sejajar tengah; canvas mengikut saiz font sebenar dan ukuran teks. Aset SVG preview dan aplikasi menggunakan viewBox yang sama. |
| 12 | W mark untuk pemilik | Dipaparkan pada identiti akaun utama dan identiti pemilik control. |
| 13 | Nama jenama header Pro berisi bg.jpg | Background clip text pada span nama jenama. |
| Control 1 | Nama/tarikh overlap; W mark mobile dan Top 3 rosak | Nama mempunyai span yang boleh dipendekkan; kolum mempunyai had; badge tidak membalut; canvas badge diskalakan mengikut namaSize. Ring Pro turut dilukis pada Top 3. |
| Control 2 | Header PNG jangan capslock | Watermark Pro dan Dijana, termasuk format tarikh biasa. |
| Control 3 | Remember me login | Checkbox login control memilih localStorage untuk sesi diingati dan sessionStorage jika tidak ditanda; logout membersihkan kedua-duanya. |

## Pengesahan

- `node verify-scripts.cjs`: semakan sintaks HTML dan JavaScript.
- `node build-publish.cjs`: pakej statik dan laluan refresh.
- `node test-worker.cjs --browser`: SQLite terasing dan Chrome, tanpa mengubah akaun produksi.
- Semakan visual PNG supporter, PNG Top 3, control mobile dan halaman pengguna desktop.
- Ujian browser merangkumi klik logo percuma, nama panjang, penjajaran W mark mobile, refresh laluan statik dan eksport PNG.

Terbitkan **semua kandungan publish/** ke `/watermark-pro/`, termasuk folder profil/pelan/tetapan, CSS, manifest dan service worker. Menyalin index.html sahaja tidak membaiki refresh di GitHub Pages.

## Susulan: install, eksport file://, stamp, avatar control, sidebar

- Modal install diberi reka bentuk responsif, tutup melalui Escape/butang/backdrop, dan arahan mengikut platform. Fail tempatan menyediakan pautan membuka laman web kerana pemasangan tidak tersedia melalui file://.
- Peristiwa appinstalled menyembunyikan butang dan menyimpan status mengikut skop aplikasi; refresh dan tab lain menerima status sama. beforeinstallprompt baharu membersihkan status lama supaya pemasangan semula boleh dibuat.
- index.html kini memuatkan export-assets.js. Canvas menggunakan aset bg.jpg/logo.jpg terbenam; pemuat imej luar menggunakan CORS supaya imej tanpa kebenaran tidak mencemarkan canvas.
- Status eksport mempunyai baris penuh dan warna loading/success/error. Mesej ralat teknikal disimpan dalam console, dengan mesej tindakan ringkas kepada pengguna.
- Stamp resit berada dalam grid bersama harga, termasuk cetakan. Offset cetak right:130px/bottom:72px dibuang.
- Imej avatar Pro dan pemilik control memenuhi ruang dalaman ring menggunakan posisi absolute, inset 0 dan object-fit cover.
- Nama jenama sidebar akaun Pro/pemilik turut menggunakan bg.jpg sebagai isian teks.
- Regresi tambahan: eksport PNG melalui file://, status install selepas refresh, geometri stamp/harga cetakan, geometri avatar control dan isian teks sidebar.

## Susulan bukti mobile: pembetulan terkini

| Permintaan | Pelaksanaan dan semakan |
| --- | --- |
| Avatar mobile memenuhi ring | Aturan Top Users lama 30px ditindih dengan saiz penuh ruang dalaman, tanpa grid-area/inset tambahan. Ujian DPR3 mengukur pusat dan ruang tepi sebenar. |
| Ring Top Users sama seperti tempat lain, tambah 1px | Token ring 1.5px dinaikkan kepada 2.5px dan digunakan juga pada Top Users, sidebar, header, profil, Tetapan dan control. Pelayar boleh membundarkan border kepada piksel paparan. |
| Margin kiri/kanan/atas PDF mobile sama seperti desktop | Aturan cetakan lama dibuang daripada CSS cetakan aktif. Margin A4 4mm, tiada padding bertindan/fixed 297mm height. Kedua-dua PDF satu halaman; koordinat kiri/atas teks sama. |
| Stamp menyentuh/overlap RM | Stamp dianjak 18px ke harga dalam grid, dengan pertindihan yang diuji. |
| Pink final kekal terang | #ff0088, opacity 1, print-color-adjust exact. Warna RGB dalam kedua-dua PDF diuji. |
| Butang install tidak masuk resit | Cetakan parent Android hanya memaparkan klon resit. Install dan navigasi disembunyikan semasa resit dibuka dan semasa cetak. |
| App lama masih menunjukkan butang | Pengesanan standalone tanpa bergantung pada query pelancaran lama; getInstalledRelatedApps menyemak ID/manifest Watermark Pro tepat. |
| App admin disalah anggap sebagai Watermark Pro | Audit live mendapati admin tiada manifest. Pakej publish-root-apps menyediakan manifest/HTML berasingan untuk /admintest dan /adminnntesttt. Ujian memastikan ID dan skop tidak bertindih dengan Watermark Pro. |
| Modal memasang app, bukan maklumat sahaja | Jika beforeinstallprompt tersedia, butang memanggil prompt native. Modal yang terbuka juga mendapat butang native apabila event tersedia. Browser tidak membenarkan JavaScript memaksa dialog native apabila event itu disekat; bantuan menu pelayar kekal sebagai fallback. |
| Butang install mobile sejajar kiri | Posisi kiri diambil daripada sempadan konten yang kelihatan, dikemas kini selepas navigasi/resize. |

Penting: dua sasaran deployment diperlukan — `publish/` ke `/watermark-pro/`, dan fail dalam `publish-root-apps/` ke root laman mengikut README di dalamnya. Fail root belum diterbitkan. Kod laman tidak boleh menyunting identiti/skop shortcut Android lama yang sudah dipasang. Shortcut admin lama mungkin perlu dipasang semula sekali selepas manifest unik diterbitkan.

Semakan tambahan: `node test-install.cjs`, `test-receipt-pdf.py`, serta rendering PDF melalui Poppler. Rujukan pemasangan: [Chrome: pengesanan app terpasang](https://developer.chrome.com/docs/capabilities/get-installed-related-apps), [Chrome: kesan skop bertindih](https://web.dev/articles/building-multiple-pwas-on-the-same-domain).
