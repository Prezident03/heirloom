import React, { useState, useActionState } from "react";
import { Plus, X, BookImage } from "lucide-react";
import { TOKENS, inputStyle } from "@/lib/uiTokens";
import { personLabel } from "@/lib/relationshipLabels";

/**
 * Global "+ Yangi" menyusidan chaqiriladigan hikoya qo'shish modali —
 * foydalanuvchi hikoyalar bo'limida bo'lmasa ham istalgan joydan hikoya
 * qo'sha olishi uchun (AddTimelineEventModal bilan bir xil naqsh).
 */
export function AddStoryModal({ familySlug, people, createStoryAction, onClose }) {
  const [state, formAction, pending] = useActionState(createStoryAction, undefined);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,38,33,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="fm-panel-enter" style={{ width: "100%", maxWidth: 440, background: TOKENS.card, borderRadius: 16, padding: "26px 26px 24px", border: `1px solid ${TOKENS.parchmentDeep}`, boxShadow: "0 30px 70px rgba(30,38,33,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, margin: 0 }}>Yangi hikoya</h2>
          <button onClick={onClose} type="button" style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="hidden" name="familySlug" value={familySlug} />
          <input name="title" placeholder="Hikoya nomi" required style={inputStyle} autoFocus />
          <textarea name="content" placeholder="Hikoya matni" required rows={4} style={{ ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif" }} />
          <div style={{ display: "flex", gap: 10 }}>
            <input type="date" name="storyDate" style={inputStyle} />
            <input type="text" name="location" placeholder="Joy (ixtiyoriy)" style={inputStyle} />
          </div>
          {people?.length > 0 && (
            <select name="personId" defaultValue="" style={inputStyle}>
              <option value="">Kim haqida (ixtiyoriy)</option>
              {people.map((p) => <option key={p.id} value={p.id}>{personLabel(p)}</option>)}
            </select>
          )}
          <input type="file" name="photo" accept="image/*" style={inputStyle} />
          {state?.error && <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>{state.error}</div>}
          <button type="submit" disabled={pending} style={{ marginTop: 6, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
            {pending ? "Qo'shilmoqda..." : "Hikoya qo'shish"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function StoriesView({ familySlug, stories, people, canEdit, createStoryAction, deleteStoryAction }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [formState, formAction] = useActionState(createStoryAction, undefined);
  const [deleteState, deleteAction] = useActionState(deleteStoryAction, undefined);

  return (
    <div style={{ display: "flex", height: "100%", gap: 20, padding: "20px 24px" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: TOKENS.ink, margin: 0 }}>Hikoyalar</h1>
          {canEdit && (
            <button
              onClick={() => setShowForm(!showForm)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8, background: TOKENS.ink, color: TOKENS.parchment, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            >
              <Plus size={16} /> Yangi
            </button>
          )}
        </div>

        {showForm && canEdit && (
          <form action={formAction} style={{ background: TOKENS.card, padding: 16, borderRadius: 12, gap: 12, display: "flex", flexDirection: "column" }}>
            <input type="hidden" name="familySlug" value={familySlug} />
            <input type="text" name="title" placeholder="Nomi" required style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${TOKENS.parchmentDeep}`, fontSize: 13 }} />
            <textarea name="content" placeholder="Hikoya matni" required style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${TOKENS.parchmentDeep}`, fontSize: 13, minHeight: 100, fontFamily: "inherit" }} />
            <input type="date" name="storyDate" style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${TOKENS.parchmentDeep}`, fontSize: 13 }} />
            <input type="text" name="location" placeholder="Joy (ixtiyoriy)" style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${TOKENS.parchmentDeep}`, fontSize: 13 }} />
            {people?.length > 0 && (
              <select name="personId" style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${TOKENS.parchmentDeep}`, fontSize: 13 }}>
                <option value="">Kim haqida (ixtiyoriy)</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name || ""}</option>
                ))}
              </select>
            )}
            <input type="file" name="photo" accept="image/*" style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${TOKENS.parchmentDeep}`, fontSize: 13 }} />
            {formState?.error && <div style={{ fontSize: 12, color: TOKENS.danger }}>{formState.error}</div>}
            <button type="submit" style={{ padding: "10px 16px", borderRadius: 6, background: TOKENS.teal, color: TOKENS.parchment, border: "none", cursor: "pointer", fontWeight: 600 }}>Saqlash</button>
          </form>
        )}

        {stories.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: TOKENS.ink60 }}>
            <BookImage size={32} style={{ marginBottom: 16, opacity: 0.5 }} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>Hali hikoya yo'q</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>Familiyangizning tarixi va hikoyalarini yozing</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {stories.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedStory(s)}
                style={{ background: TOKENS.card, borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(30,38,33,0.08)", cursor: "pointer" }}
              >
                {s.photo_url && <img src={s.photo_url} alt="" style={{ width: "100%", height: 140, objectFit: "cover" }} />}
                <div style={{ padding: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px 0", color: TOKENS.ink }}>{s.title}</h3>
                  <p style={{ fontSize: 12, color: TOKENS.ink60, margin: 0, lineHeight: 1.5 }}>{s.content.substring(0, 100)}...</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedStory && (
        <div style={{ width: 320, background: TOKENS.card, borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 12, maxHeight: "100%", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: TOKENS.ink, margin: 0 }}>{selectedStory.title}</h2>
            <button onClick={() => setSelectedStory(null)} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={16} /></button>
          </div>
          {selectedStory.photo_url && <img src={selectedStory.photo_url} alt="" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 6 }} />}
          {selectedStory.story_date && <div style={{ fontSize: 12, color: TOKENS.teal }}>📅 {new Date(selectedStory.story_date).toLocaleDateString()}</div>}
          {selectedStory.location && <div style={{ fontSize: 12, color: TOKENS.ink60 }}>📍 {selectedStory.location}</div>}
          <div style={{ fontSize: 12, color: TOKENS.ink60, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{selectedStory.content}</div>
          {canEdit && (
            <form
              action={deleteAction}
              onSubmit={() => setSelectedStory(null)}
            >
              <input type="hidden" name="familySlug" value={familySlug} />
              <input type="hidden" name="storyId" value={selectedStory.id} />
              <button
                type="submit"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, background: TOKENS.danger, color: TOKENS.parchment, border: "none", cursor: "pointer", fontSize: 12 }}
              >
                O'chirish
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
