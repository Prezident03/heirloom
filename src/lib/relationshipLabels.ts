// Bu fayl atayin hech qanday server-only kutubxonani (database, fs va h.k.)
// import qilmaydi — shunda uni client komponentda ham xavfsiz ishlatish mumkin.

export type RelPerson = {
  id: string;
  gender?: string | null;
};

export type RelRelationship = {
  person_a_id: string;
  person_b_id: string;
  type: "parent" | "spouse";
};

/**
 * `fromId` nuqtai nazaridan `toId` kim bo'lishini hisoblaydi (masalan "Otasi",
 * "Akasi/Ukasi", "Nabirasi"). Faqat to'g'ridan-to'g'ri darajalarni aniqlaydi —
 * buning uchun alohida 10 xil relationship type saqlashning hojati yo'q,
 * chunki hammasi "parent" va "spouse" zanjiridan chiqariladi.
 */
export function relationLabelBetween(
  fromId: string,
  toId: string,
  people: RelPerson[],
  relationships: RelRelationship[]
): string | null {
  if (fromId === toId) return null;

  const parentsOf: Record<string, string[]> = {};
  const childrenOf: Record<string, string[]> = {};
  const spouseOf: Record<string, string> = {};

  relationships.forEach((r) => {
    if (r.type === "parent") {
      (parentsOf[r.person_b_id] ||= []).push(r.person_a_id);
      (childrenOf[r.person_a_id] ||= []).push(r.person_b_id);
    } else if (r.type === "spouse") {
      spouseOf[r.person_a_id] = r.person_b_id;
      spouseOf[r.person_b_id] = r.person_a_id;
    }
  });

  const genderOf = (id: string) => people.find((p) => p.id === id)?.gender ?? null;
  const label = (id: string, male: string, female: string, neutral: string) => {
    const g = genderOf(id);
    if (g === "male") return male;
    if (g === "female") return female;
    return neutral;
  };

  // To'g'ridan-to'g'ri ota-ona
  if ((parentsOf[fromId] || []).includes(toId)) {
    return label(toId, "Otasi", "Onasi", "Ota-onasi");
  }
  // To'g'ridan-to'g'ri farzand
  if ((childrenOf[fromId] || []).includes(toId)) {
    return label(toId, "O'g'li", "Qizi", "Farzandi");
  }
  // Turmush o'rtog'i
  if (spouseOf[fromId] === toId) {
    return label(toId, "Eri", "Xotini", "Turmush o'rtog'i");
  }
  // Aka-uka / opa-singil (bir xil ota-onaga ega)
  const fromParents = parentsOf[fromId] || [];
  const toParents = parentsOf[toId] || [];
  if (fromParents.length && toParents.some((p) => fromParents.includes(p))) {
    return label(toId, "Akasi/Ukasi", "Opasi/Singlisi", "Aka-uka/opa-singil");
  }
  // Bobo/buvi (ota-onasining ota-onasi)
  const grandparents = fromParents.flatMap((pid) => parentsOf[pid] || []);
  if (grandparents.includes(toId)) {
    return label(toId, "Bobosi", "Buvisi", "Bobo-buvisi");
  }
  // Nabira (farzandining farzandi)
  const fromChildren = childrenOf[fromId] || [];
  const grandchildren = fromChildren.flatMap((cid) => childrenOf[cid] || []);
  if (grandchildren.includes(toId)) {
    return "Nabirasi";
  }

  return null;
}

export type DisplayPerson = {
  first_name: string;
  last_name?: string | null;
  birth_date?: string | null;
  death_date?: string | null;
};

export function personLabel(p: DisplayPerson): string {
  return [p.first_name, p.last_name].filter(Boolean).join(" ") || "Ism kiritilmagan";
}

export function personYears(p: DisplayPerson): string {
  if (p.birth_date && p.death_date) return `${p.birth_date}–${p.death_date}`;
  if (p.birth_date) return p.birth_date;
  if (p.death_date) return `–${p.death_date}`;
  return "";
}
