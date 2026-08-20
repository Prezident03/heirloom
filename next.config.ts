import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // MUHIM: Vercel'ning o'zi (Next.js emas) serverless funksiya so'rovi uchun
  // 4.5MB'lik QATTIQ chegara qo'yadi — bu next.config orqali oshirib bo'lmaydi.
  // Shuning uchun bu yerda 4MB (multipart formData'ning o'zi biroz joy yeydi,
  // shu sabab 4.5 emas, 4 qo'ydim — zaxira uchun).
  // Bu VAQTINCHALIK yamoq: 4MB'dan katta rasmlar (zamonaviy telefonlarda odatiy
  // hol) baribir xato beradi. Doimiy yechim — brauzerdan to'g'ridan-to'g'ri
  // Vercel Blob'ga yuklash (@vercel/blob/client), bu Vercel funksiyasini
  // butunlay chetlab o'tadi.
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "Surrogate-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
