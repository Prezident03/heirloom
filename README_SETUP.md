# Heirloom — Raqamli Oila Arxivi

**Heirloom** — bu oilangiz tarixini, xotiralarini va suratlarini saqlash uchun mo'ljallangan raqamli platforma. Har bir oila o'z hikoyasiga ega, va biz uni saqlab turamiz.

## 🎯 Nima?

Heirloom sizga imkon beradi:
- **Oila daraxti** — avlodlar va munosabatlarni vizual tarzda ko'rish
- **Albomlar** — sayohatlar, oilaviy kunlar, xotiralarni saqlash
- **Xronologiya** — muhim tarixiy voqealarni qayd qilish
- **Xotiralar** — "bugun x yil oldin" avtomatik ko'rsatish
- **Hikoyalar** — oilangiz ovozi va hikoyalarini saqlash
- **Rol-asosiy kirish** — owner, editor, member, viewer rolilar bilan ijtimoi ijara

## 🛠 Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Database**: PostgreSQL (Neon serverless)
- **Storage**: Vercel Blob (rasimlar)
- **Styling**: Tailwind CSS 4
- **Visualization**: D3.js (oila daraxti)
- **Auth**: bcryptjs, custom sessions

## 📋 Setup

### 1. Dependencies o'rnatish
```bash
npm install
```

### 2. Environment variables
`.env.local` fayliga qo'shish:
```
DATABASE_URL=postgresql://user:password@host/db
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

**Qayerdan olish?**
- `DATABASE_URL` — Neon.tech'dan (serverless Postgres)
- `BLOB_READ_WRITE_TOKEN` — Vercel console'dan

### 3. Database initialization
Birinchi qo'shilish paytida avtomatik schema yaratiladi.

### 4. Dev server ishga tushirish
```bash
npm run dev
```

Brauzer aç: http://localhost:3000

## 🚀 Deployment (Vercel)

```bash
git push origin main
# Vercel avtomatik deploy qiladi
```

Yoki qolgan kod'dan:
1. Vercel.com ga kirish
2. Repository bog'lash
3. Environment variables qo'shish (DATABASE_URL, BLOB_TOKEN)
4. Deploy!

## 📱 Features Status

✅ **Ready**
- User registration & login
- Family creation
- Add family members
- Family tree visualization
- Albums with photo uploads
- Timeline events
- Memories
- Stories
- Role-based access control

🚧 **In Development**
- Photo gallery (albums dan tashqari)
- Places (locations)
- Advanced photo tagging
- Mobile optimization

## 💡 Quick Start (User Guide)

1. **Register** — Email bilan ro'yhatdan o'tish
2. **Create Family** — Oilangiz nomini kiritish
3. **Add Yourself** — Dastlab o'zingizni qo'shish
4. **Add Family** — Ota-ona, farzand, turmush o'rtog'ini qo'shish
5. **Create Album** — Birinchi albom yaratish va rasmlar yuklash
6. **Invite** — Qo'shni oila a'zolarini taklif qilish

## 📂 Project Structure

```
src/
├── app/              # Next.js pages
├── components/       # React components
│   ├── HeirloomApp.jsx       # Main app shell
│   └── TreeVisualization.jsx # D3 family tree
└── lib/
    ├── db.ts         # Database schema
    ├── user.ts       # User functions
    ├── family.ts     # Family functions
    ├── people.ts     # People/relationships
    ├── albums.ts     # Albums & photos
    ├── timeline.ts   # Timeline events
    ├── memories.ts   # Memories
    ├── stories.ts    # Stories
    └── actions.ts    # Server actions
```

## 🔐 Database Schema

- **users** — Foydalanuvchilar
- **sessions** — Login sessionlar
- **families** — Oilalar
- **family_memberships** — Oila a'zolar (rol bilan)
- **people** — Oila a'zolari
- **relationships** — parent/spouse bog'lanishlar
- **albums** — Albomlar
- **album_pages** — Albom sahifalari
- **page_elements** — Rasmlar va matnlar
- **timeline_events** — Voqealar
- **memories** — Xotiralar
- **stories** — Hikoyalar
- **places** — Joylar (future)
- **family_invites** — Taklif kodlari

## 🐛 Troubleshooting

**"DATABASE_URL sozlanmagan"**
- `.env.local`'da DATABASE_URL qo'shganligingizni tekshiring

**Photos yuklanmayapti**
- Vercel Blob tokeni noto'g'ri yoki yo'q
- `BLOB_READ_WRITE_TOKEN` ni tekshiring

**D3 tree ko'rinmayapti**
- Browser console'ni tekshiring (errors?)
- Oila a'zolar qo'shganligingizni tekshiring

## 📞 Support

- Issues: GitHub issues bo'limiga yozing
- Questions: Readme yana o'qib chiqing!

---

**Version**: 0.1.0  
**Last Updated**: 2026-08-19  
**License**: MIT
