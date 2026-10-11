// ============================================================
// Oila daraxti joylashuvi (layout)
//
// Asosiy g'oya — "oila birligi": odam + uning turmush o'rtog'i(lari) bitta
// blok. Bolalar ikkala ota-onadan ham yig'iladi, shuning uchun bola faqat
// onaga yoki faqat otaga bog'langan bo'lsa ham yo'qolmaydi.
//
// Joylashuv qat'iy oraliqlarda (ekran o'lchamiga bog'liq emas) — yangi odam
// qo'shilganda boshqalarning joyi sakrab ketmaydi. Bir nechta mustaqil
// tarmoq (masalan, kelin tomonining ota-onasi) yonma-yon chiziladi; bir odam
// ikki joyda kerak bo'lsa, ikkinchi joyda "havola" (ghost) karta ko'rinadi.
// ============================================================
import { hierarchy, tree } from "d3";

export const CARD_W = 214;
export const CARD_H = 68;
export const PARTNER_GAP = 30;
export const ROW_H = 150;
const SIBLING_GAP = 44;
const COUSIN_GAP = 96;

function byBirth(people) {
  return (a, b) => {
    const pa = people[a], pb = people[b];
    const da = pa?.birth_date || "9999", db = pb?.birth_date || "9999";
    if (da !== db) return da < db ? -1 : 1;
    return String(pa?.created_at || "").localeCompare(String(pb?.created_at || ""));
  };
}

export function buildFamilyIndex(peopleList, relationships) {
  const people = Object.fromEntries(peopleList.map((p) => [p.id, p]));
  const parentsOf = {}, childrenOf = {}, spousesOf = {};
  for (const r of relationships) {
    if (!people[r.person_a_id] || !people[r.person_b_id] || r.person_a_id === r.person_b_id) continue;
    if (r.type === "parent") {
      (parentsOf[r.person_b_id] ||= new Set()).add(r.person_a_id);
      (childrenOf[r.person_a_id] ||= new Set()).add(r.person_b_id);
    } else if (r.type === "spouse") {
      (spousesOf[r.person_a_id] ||= new Set()).add(r.person_b_id);
      (spousesOf[r.person_b_id] ||= new Set()).add(r.person_a_id);
    }
  }
  const get = (m, id) => [...(m[id] || [])];
  return {
    people,
    parents: (id) => get(parentsOf, id),
    children: (id) => get(childrenOf, id),
    spouses: (id) => get(spousesOf, id),
  };
}

/** Tanlangan odamning qon chizig'i: ajdodlar, avlodlar, o'zi va turmush o'rtoqlari. */
export function lineageOf(index, id) {
  const set = new Set([id]);
  const up = [id];
  while (up.length) for (const p of index.parents(up.pop())) if (!set.has(p)) { set.add(p); up.push(p); }
  const down = [id];
  while (down.length) for (const c of index.children(down.pop())) if (!set.has(c)) { set.add(c); down.push(c); }
  for (const s of index.spouses(id)) set.add(s);
  return set;
}

export function layoutFamilyTree(peopleList, relationships) {
  const index = buildFamilyIndex(peopleList, relationships);
  const { people } = index;
  const cmp = byBirth(people);
  const placed = new Set();
  let uid = 0;

  const makeUnit = (headId) => {
    placed.add(headId);
    const members = [{ id: headId, ghost: false }];
    for (const s of index.spouses(headId).sort(cmp)) {
      // Turmush o'rtog'i boshqa joyda allaqachon chizilgan bo'lsa — havola karta.
      members.push({ id: s, ghost: placed.has(s) });
      placed.add(s);
    }
    const memberIds = members.map((m) => m.id);
    const childSet = new Set(memberIds.flatMap((m) => index.children(m)));
    memberIds.forEach((m) => childSet.delete(m));
    const unit = { key: `u${uid++}`, members, children: [], links: [] };
    for (const c of [...childSet].sort(cmp)) {
      const parentIdx = memberIds.map((m, i) => (index.children(m).includes(c) ? i : -1)).filter((i) => i >= 0);
      const child = placed.has(c)
        ? { key: `u${uid++}`, members: [{ id: c, ghost: true }], children: [], links: [] }
        : makeUnit(c);
      unit.children.push(child);
      unit.links.push({ child, parentIdx });
    }
    return unit;
  };

  // Ildizlar: ota-onasi yo'q odamlar. Agar turmush o'rtog'ining ota-onasi
  // daraxtda bo'lsa, u o'sha oila ichida turmush o'rtog'i sifatida chiqadi.
  const roots = [];
  const ids = peopleList.map((p) => p.id).sort(cmp);
  for (const id of ids) {
    if (placed.has(id) || index.parents(id).length) continue;
    if (index.spouses(id).some((s) => index.parents(s).length)) continue;
    roots.push(makeUnit(id));
  }
  // Yuqoridagilarga ulanmay qolganlar (masalan, aylanma bog'lanishlar) ham yo'qolmasin.
  for (const id of ids) if (!placed.has(id)) roots.push(makeUnit(id));

  const unitWidth = (u) => u.members.length * CARD_W + (u.members.length - 1) * PARTNER_GAP;
  const h = hierarchy({ key: "root", members: [], children: roots, links: [] }, (d) => d.children);
  tree()
    .nodeSize([1, ROW_H])
    .separation((a, b) => (unitWidth(a.data) + unitWidth(b.data)) / 2 + (a.parent === b.parent ? SIBLING_GAP : COUSIN_GAP))(h);

  const cards = [];
  const unitPos = new Map();
  h.descendants().forEach((n) => {
    if (n.depth === 0) return;
    const u = n.data;
    const w = unitWidth(u);
    const y = (n.depth - 1) * ROW_H;
    const xs = u.members.map((_, i) => n.x - w / 2 + CARD_W / 2 + i * (CARD_W + PARTNER_GAP));
    unitPos.set(u.key, { xs, y });
    u.members.forEach((m, i) => cards.push({ key: `${u.key}-${m.id}`, id: m.id, ghost: m.ghost, x: xs[i], y, depth: n.depth - 1 }));
  });

  const links = [];
  const partners = [];
  h.descendants().forEach((n) => {
    if (n.depth === 0) return;
    const u = n.data;
    const pos = unitPos.get(u.key);
    for (let i = 1; i < u.members.length; i++) {
      partners.push({ key: `${u.key}-p${i}`, x1: pos.xs[i - 1] + CARD_W / 2, x2: pos.xs[i] - CARD_W / 2, y: pos.y, a: u.members[0].id, b: u.members[i].id });
    }
    for (const l of u.links) {
      const cp = unitPos.get(l.child.key);
      const idx = l.parentIdx.length ? l.parentIdx : [0];
      const sx = idx.length > 1 ? (pos.xs[idx[0]] + pos.xs[idx[idx.length - 1]]) / 2 : pos.xs[idx[0]];
      links.push({
        key: `${u.key}->${l.child.key}`,
        sx, sy: pos.y + (idx.length > 1 ? 0 : CARD_H / 2),
        tx: cp.xs[0], ty: cp.y - CARD_H / 2,
        from: idx.map((i) => u.members[i].id), to: l.child.members[0].id,
        fromPartners: idx.length > 1,
      });
    }
  });

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const c of cards) {
    minX = Math.min(minX, c.x - CARD_W / 2); maxX = Math.max(maxX, c.x + CARD_W / 2);
    minY = Math.min(minY, c.y - CARD_H / 2); maxY = Math.max(maxY, c.y + CARD_H / 2);
  }
  const bounds = cards.length ? { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY } : { minX: 0, maxX: 0, minY: 0, maxY: 0, w: 0, h: 0 };
  const generations = cards.length ? Math.max(...cards.map((c) => c.depth)) + 1 : 0;
  return { cards, links, partners, bounds, index, generations };
}
