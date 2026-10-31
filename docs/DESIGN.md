# Design System AmanLapor

Sumber: mockup Stitch. Token ada di `tailwind.config` pada `<head>` tiap halaman (Tailwind CDN).
`admin.html` memakai token yang sama + 3 komponen (`.inp`, `.btn`, `.card`) di `<style type="text/tailwindcss">`.

| Aspek | Nilai |
|---|---|
| Font | Plus Jakarta Sans (400-700); ikon Material Symbols Outlined |
| Warna utama | `primary #006948`, `primary-container #00855d`, `primary-fixed #85f8c4` |
| Permukaan | `surface #f7f9fb`, `surface-container-low #f2f4f6`, `surface-container-lowest #ffffff` |
| Teks | `on-surface #191c1e`, `on-surface-variant #3d4a42`, `outline #6d7a72` |
| Aksen / error | `tertiary-fixed #c3ecd7`, `error #ba1a1a` |
| Radius | `lg 0.5rem`, `xl 0.75rem` |
| Spasi | `space-xs .25` / `sm .5` / `md 1` / `lg 1.5` / `xl 2.5` rem, `gutter 1.5rem` |
| Tipografi | display 40, headline-md 24, headline-sm 20, title 18, body-md 16, body-sm 14, label-md 14, label-sm 12 |

Prinsip: bayangan lembut (`shadow-sm`), tanpa border tebal, kartu putih di atas latar abu muda, aksi utama hijau zamrud.
