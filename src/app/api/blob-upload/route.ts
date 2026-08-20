import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getFamilyBySlug, getMembership } from "@/lib/family";

/**
 * Vercel'ning serverless funksiyalari uchun 4.5MB'lik qattiq (o'zgartirib
 * bo'lmaydigan) so'rov hajmi chegarasi bor. Shuning uchun rasm fayli bu
 * route orqali SERVERGA YUBORILMAYDI — bu route faqat brauzerga "shu faylni
 * to'g'ridan-to'g'ri Blob'ga yuklashing mumkin" degan vaqtinchalik token
 * beradi (avtorizatsiyadan keyin). Haqiqiy fayl brauzerdan bevosita Vercel
 * Blob serveriga ketadi, bizning funksiyamizdan umuman o'tmaydi.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayloadRaw) => {
        const session = await getSession();
        if (!session) throw new Error("Avtorizatsiya kerak.");

        let familySlug = "";
        try {
          familySlug = clientPayloadRaw ? String(JSON.parse(clientPayloadRaw).familySlug || "") : "";
        } catch {
          familySlug = "";
        }
        if (!familySlug) throw new Error("Oila aniqlanmadi.");

        const family = await getFamilyBySlug(familySlug);
        if (!family) throw new Error("Oila topilmadi.");

        const membership = await getMembership(family.id, session.id);
        if (!membership || membership.role === "viewer") {
          throw new Error("Sizda bu amal uchun ruxsat yo'q.");
        }

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"],
          maximumSizeInBytes: 15 * 1024 * 1024, // 15MB — haqiqiy fayl bizning funksiyamizdan o'tmagani uchun bemalol katta bo'lishi mumkin
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Ma'lumotlar bazasiga yozish klient tomonidan, upload() tugagach,
        // alohida (juda yengil, faqat URL string yuboradigan) server action
        // orqali amalga oshiriladi — shuning uchun bu yerda hech narsa qilish shart emas.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Token yaratishda xato." }, { status: 400 });
  }
}
