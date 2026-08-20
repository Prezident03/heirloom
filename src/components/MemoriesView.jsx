import React, { useState, useMemo, useActionState } from "react";
import { Plus, X } from "lucide-react";
import { TOKENS, inputStyle } from "@/lib/uiTokens";

/**
 * Global "+ Yangi" menyusidan chaqiriladigan xotira qo'shish modali —
 * foydalanuvchi xotiralar bo'limida bo'lmasa ham istalgan joydan xotira
 * qo'sha olishi uchun (AddTimelineEventModal bilan bir xil naqsh).
 */
export function AddMemoryModal({ familySlug, createMemoryAction, onClose }) {
  const [state, formAction, pending] = useActionState(createMemoryAction, undefined);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,38,33,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="fm-panel-enter" style={{ width: "100%", maxWidth: 440, background: TOKENS.card, borderRadius: 16, padding: "26px 26px 24px", border: `1px solid ${TOKENS.parchmentDeep}`, boxShadow: "0 30px 70px rgba(30,38,33,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, margin: 0 }}>Yangi xotira</h2>
          <button onClick={onClose} type="button" style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="hidden" name="familySlug" value={familySlug} />
          <input name="title" placeholder="Xotira nomi" required style={inputStyle} autoFocus />
          <textarea name="description" placeholder="Tavsif (ixtiyoriy)" rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif" }} />
          <input type="date" name="memoryDate" style={inputStyle} />
          <input type="file" name="photo" accept="image/*" style={inputStyle} />
          {state?.error && <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>{state.error}</div>}
          <button type="submit" disabled={pending} style={{ marginTop: 6, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
            {pending ? "Qo'shilmoqda..." : "Xotira qo'shish"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function MemoriesView({
  familySlug,
  memories,
  onThisDayMemories = [],
  people,
  canEdit,
  createMemoryAction,
  updateMemoryAction,
  updateMemoryPhotoAction,
  deleteMemoryAction,
}) {
  const [showForm, setShowForm] = useState(false);
  const [formState, formAction] = useActionState(createMemoryAction, undefined);
  const [selectedMemory, setSelectedMemory] = useState(null);

  const memoriesByDate = useMemo(() => {
    const sorted = [...memories].sort((a, b) => {
      if (!a.memory_date && !b.memory_date) return new Date(b.created_at) - new Date(a.created_at);
      if (!a.memory_date) return 1;
      if (!b.memory_date) return -1;
      return new Date(b.memory_date) - new Date(a.memory_date);
    });
    return sorted;
  }, [memories]);

  // MUHIM: deleteMemoryAction endi `(_prevState, formData)` imzosiga ega
  // (actions.ts'da useActionState orqali ishlatiladigan boshqa action'lar
  // bilan bir xil tartibda) — shuning uchun bu yerda ham ikkinchi
  // argument sifatida FormData uzatiladi.
  function handleDelete(memoryId) {
    const fd = new FormData();
    fd.set("familySlug", familySlug);
    fd.set("memoryId", memoryId);
    deleteMemoryAction(undefined, fd);
    setSelectedMemory(null);
  }

  return (
    <div style={{ display: "flex", height: "100%", gap: 20, padding: "20px 24px", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: TOKENS.ink, margin: 0 }}>Xotiralar</h1>
          {canEdit && (
            <button
              onClick={() => setShowForm(!showForm)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8, background: TOKENS.ink, color: TOKENS.parchment, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            >
              <Plus size={16} /> Yangi
            </button>
          )}
        </div>

        {onThisDayMemories.length > 0 && (
          <div style={{ background: `linear-gradient(135deg, ${TOKENS.gold}22, ${TOKENS.goldSoft}11)`, border: `1px solid ${TOKENS.goldSoft}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: TOKENS.gold, marginBottom: 8 }}>✨ Bugun shu kunda</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {onThisDayMemories.map((m) => (
                <div key={m.id} onClick={() => setSelectedMemory(m)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  {m.photo_url && <img src={m.photo_url} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TOKENS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</div>
                    <div style={{ fontSize: 11, color: TOKENS.ink60 }}>{m.years_ago} yil oldin</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showForm && canEdit && (
          <form action={formAction} style={{ background: TOKENS.card, padding: 16, borderRadius: 12, gap: 12, display: "flex", flexDirection: "column" }}>
            <input type="hidden" name="familySlug" value={familySlug} />
            <input type="text" name="title" placeholder="Nomi" required style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${TOKENS.parchmentDeep}`, fontSize: 13 }} />
            <textarea name="description" placeholder="Tavsif" style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${TOKENS.parchmentDeep}`, fontSize: 13, minHeight: 60, fontFamily: "inherit" }} />
            <input type="date" name="memoryDate" style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${TOKENS.parchmentDeep}`, fontSize: 13 }} />
            <input type="file" name="photo" accept="image/*" style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${TOKENS.parchmentDeep}`, fontSize: 13 }} />
            {formState?.error && <div style={{ fontSize: 12, color: TOKENS.danger }}>{formState.error}</div>}
            <button type="submit" style={{ padding: "10px 16px", borderRadius: 6, background: TOKENS.teal, color: TOKENS.parchment, border: "none", cursor: "pointer", fontWeight: 600 }}>Saqlash</button>
          </form>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, flex: 1 }}>
          {memoriesByDate.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", color: TOKENS.ink60, padding: "40px" }}>Xotiralar qo'shilmagan</div>
          ) : (
            memoriesByDate.map(m => (
              <div key={m.id} onClick={() => setSelectedMemory(m)} style={{ background: TOKENS.card, borderRadius: 8, overflow: "hidden", cursor: "pointer", boxShadow: `0 2px 8px rgba(30,38,33,0.08)` }}>
                {m.photo_url && <img src={m.photo_url} alt="" style={{ width: "100%", height: 120, objectFit: "cover" }} />}
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: TOKENS.ink }}>{m.title}</div>
                  {m.memory_date && <div style={{ fontSize: 10, color: TOKENS.teal }}>📅 {new Date(m.memory_date).toLocaleDateString()}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {selectedMemory && (
        <div style={{ width: 300, flexShrink: 0, background: TOKENS.card, borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 12, maxHeight: "100%", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: TOKENS.ink, margin: 0 }}>{selectedMemory.title}</h2>
            <button onClick={() => setSelectedMemory(null)} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={16} /></button>
          </div>
          {selectedMemory.photo_url && <img src={selectedMemory.photo_url} alt="" style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 6 }} />}
          {selectedMemory.memory_date && <div style={{ fontSize: 12, color: TOKENS.teal }}>📅 {new Date(selectedMemory.memory_date).toLocaleDateString()}</div>}
          {selectedMemory.location && <div style={{ fontSize: 12, color: TOKENS.ink60 }}>📍 {selectedMemory.location}</div>}
          {selectedMemory.description && <div style={{ fontSize: 12, color: TOKENS.ink60, lineHeight: 1.5 }}>{selectedMemory.description}</div>}
          {canEdit && (
            <button
              onClick={() => handleDelete(selectedMemory.id)}
              style={{ padding: "8px 12px", borderRadius: 6, background: TOKENS.danger, color: TOKENS.parchment, border: "none", cursor: "pointer", fontSize: 12 }}
            >
              O'chirish
            </button>
          )}
        </div>
      )}
    </div>
  );
}
