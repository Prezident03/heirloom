"use client";

import React, { useState, useRef, useMemo, useEffect, useActionState } from "react";
import {
  Plus, X, History, MapPinned, Users, Camera, Calendar,
} from "lucide-react";
import { TOKENS, inputStyle } from "@/lib/uiTokens";
import { personLabel } from "@/lib/relationshipLabels";

/* ---------------- Timeline (Vaqt chizig'i) ---------------- */

/** event_date matnidan boshlang'ich yilni ajratib oladi — faqat guruhlash
 * (yil sarlavhalari) uchun, client tomonda. Backend tartiblashi
 * `lib/timeline.ts`dagi `extractYear` bilan bir xil mantiqqa asoslangan. */
function extractEventYear(dateLabel) {
  if (!dateLabel) return null;
  const m = String(dateLabel).match(/\d{3,4}/);
  return m ? m[0] : null;
}

function EmptyTimeline({ canEdit, onAddEvent }) {
  return (
    <div style={{ maxWidth: 460, margin: "80px auto", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${TOKENS.gold}, ${TOKENS.goldSoft})`, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <History size={24} color="#fff" />
      </div>
      <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, margin: "0 0 8px" }}>Hali voqealar yo'q</h2>
      <p style={{ fontSize: 13, color: TOKENS.ink60, lineHeight: 1.6, margin: "0 0 22px" }}>
        Oilangiz tarixidagi muhim kunlarni — to'ylar, ko'chishlar, tug'ilgan kunlar, yutuqlarni — shu yerga qo'shib, vaqt chizig'ini yarating.
      </p>
      {canEdit && (
        <button onClick={onAddEvent} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={15} /> Birinchi voqeani qo'shish
        </button>
      )}
    </div>
  );
}

function TimelineYearMarker({ label }) {
  return (
    <div style={{ position: "relative", paddingLeft: 30, marginBottom: 14 }}>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 21, fontWeight: 600, color: TOKENS.ink }}>{label}</div>
    </div>
  );
}

function TimelineEventCard({ event, personName, onSelect }) {
  return (
    <div style={{ position: "relative", paddingLeft: 30, paddingBottom: 22 }}>
      <div style={{ position: "absolute", left: 3, top: 4, width: 13, height: 13, borderRadius: "50%", background: TOKENS.card, border: `2.5px solid ${TOKENS.gold}` }} />
      <div
        className="fm-album-card"
        onClick={onSelect}
        style={{ display: "flex", gap: 14, background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 12, padding: "14px 16px" }}
      >
        {event.photo_url ? (
          <div style={{ width: 64, height: 64, borderRadius: 8, flexShrink: 0, backgroundImage: `url(${event.photo_url})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: 8, flexShrink: 0, background: TOKENS.parchment, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <History size={20} color={TOKENS.goldSoft} />
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TOKENS.gold, letterSpacing: "0.05em" }}>
            {event.event_date || "Sana ko'rsatilmagan"}
          </div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 16.5, fontWeight: 500, margin: "2px 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {event.title}
          </div>
          {event.description && (
            <div style={{ fontSize: 12.5, color: TOKENS.ink60, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {event.description}
            </div>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            {event.location && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: TOKENS.ink40 }}><MapPinned size={11} /> {event.location}</span>}
            {personName && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: TOKENS.ink40 }}><Users size={11} /> {personName}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineEventPhotoButton({ familySlug, eventId, uploadTimelineEventPhotoAction, onError }) {
  const [state, formAction, pending] = useActionState(uploadTimelineEventPhotoAction, undefined);
  const inputRef = useRef(null);

  useEffect(() => {
    if (onError) onError(state?.error || null);
  }, [state?.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="familySlug" value={familySlug} />
      <input type="hidden" name="eventId" value={eventId} />
      <input
        ref={inputRef}
        type="file"
        name="photo"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => { if (e.target.files?.length) e.target.form.requestSubmit(); }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        title="Rasm yuklash"
        style={{
          position: "absolute", bottom: -2, right: -2, width: 28, height: 28, borderRadius: "50%",
          background: TOKENS.ink, border: `2px solid ${TOKENS.card}`, color: TOKENS.parchment,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: pending ? "default" : "pointer",
          opacity: pending ? 0.6 : 1,
        }}
      >
        <Camera size={13} />
      </button>
    </form>
  );
}

function DeleteTimelineEventConfirm({ familySlug, eventId, deleteTimelineEventAction, onCancel }) {
  const [state, formAction, pending] = useActionState(deleteTimelineEventAction, undefined);

  return (
    <div style={{ marginTop: 10, padding: 12, background: "rgba(168,69,58,0.08)", borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: TOKENS.danger, marginBottom: 10 }}>
        Rostdan ham bu voqeani o'chirasizmi? Bu amalni ortga qaytarib bo'lmaydi.
      </div>
      {state?.error && (
        <div style={{ fontSize: 11.5, color: TOKENS.danger, marginBottom: 8 }}>{state.error}</div>
      )}
      <form action={formAction} style={{ display: "flex", gap: 8 }}>
        <input type="hidden" name="familySlug" value={familySlug} />
        <input type="hidden" name="eventId" value={eventId} />
        <button type="submit" disabled={pending} style={{ flex: 1, background: TOKENS.danger, color: "#fff", border: "none", borderRadius: 6, padding: "8px", fontSize: 12, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
          {pending ? "O'chirilmoqda..." : "Ha, o'chirish"}
        </button>
        <button type="button" onClick={onCancel} disabled={pending} style={{ flex: 1, background: "transparent", color: TOKENS.ink60, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 6, padding: "8px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Bekor qilish
        </button>
      </form>
    </div>
  );
}

function TimelineEventDetailPanel({
  event,
  personName,
  canEdit,
  familySlug,
  uploadTimelineEventPhotoAction,
  photoError,
  setPhotoError,
  onClose,
  onEdit,
  confirmDelete,
  setConfirmDelete,
  deleteTimelineEventAction,
}) {
  return (
    <div className="fm-panel-enter" style={{ width: "min(320px, 100%)", flex: "1 1 320px", flexShrink: 0, background: TOKENS.card, borderLeft: `1px solid ${TOKENS.parchmentDeep}`, padding: "24px 22px", overflow: "auto", maxHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40, padding: 4 }}><X size={18} /></button>
      </div>

      <div style={{ position: "relative", width: "100%", height: 150, borderRadius: 12, marginBottom: 16 }}>
        <div
          style={{
            width: "100%", height: "100%", borderRadius: 12,
            background: event.photo_url ? undefined : TOKENS.parchment,
            backgroundImage: event.photo_url ? `url(${event.photo_url})` : undefined,
            backgroundSize: "cover", backgroundPosition: "center",
            border: `1px solid ${TOKENS.parchmentDeep}`,
            display: event.photo_url ? undefined : "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {!event.photo_url && <History size={26} color={TOKENS.goldSoft} />}
        </div>
        {canEdit && uploadTimelineEventPhotoAction && (
          <TimelineEventPhotoButton
            familySlug={familySlug}
            eventId={event.id}
            uploadTimelineEventPhotoAction={uploadTimelineEventPhotoAction}
            onError={setPhotoError}
          />
        )}
      </div>

      {photoError && (
        <div style={{ fontSize: 11, color: TOKENS.danger, textAlign: "center", marginBottom: 10, padding: "6px 10px", background: "rgba(168,69,58,0.08)", borderRadius: 6 }}>
          {photoError}
        </div>
      )}

      <div style={{ fontSize: 11.5, fontWeight: 700, color: TOKENS.gold, letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 5 }}>
        <Calendar size={12} /> {event.event_date || "Sana ko'rsatilmagan"}
      </div>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, margin: "4px 0 10px" }}>{event.title}</div>

      {event.location && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: TOKENS.ink60, marginBottom: 8 }}>
          <MapPinned size={12} /> {event.location}
        </div>
      )}
      {personName && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: TOKENS.ink60, marginBottom: 8 }}>
          <Users size={12} /> {personName}
        </div>
      )}

      <div style={{ fontSize: 12.5, color: TOKENS.ink60, lineHeight: 1.6, margin: "10px 0 4px" }}>
        {event.description || "Bu voqea haqida hali tavsif qo'shilmagan."}
      </div>

      {canEdit && (
        <>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button onClick={onEdit} style={{ flex: 1, background: "transparent", color: TOKENS.ink, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: "10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              Tahrirlash
            </button>
          </div>

          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={{ marginTop: 10, width: "100%", background: "transparent", color: TOKENS.danger, border: `1px solid ${TOKENS.danger}`, borderRadius: 8, padding: "10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              O'chirish
            </button>
          ) : (
            <DeleteTimelineEventConfirm
              familySlug={familySlug}
              eventId={event.id}
              deleteTimelineEventAction={deleteTimelineEventAction}
              onCancel={() => setConfirmDelete(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

export function AddTimelineEventModal({ familySlug, people, createTimelineEventAction, onClose }) {
  const [state, formAction, pending] = useActionState(createTimelineEventAction, undefined);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,38,33,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="fm-panel-enter" style={{ width: "100%", maxWidth: 440, background: TOKENS.card, borderRadius: 16, padding: "26px 26px 24px", border: `1px solid ${TOKENS.parchmentDeep}`, boxShadow: "0 30px 70px rgba(30,38,33,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, margin: 0 }}>Yangi voqea</h2>
          <button onClick={onClose} type="button" style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="hidden" name="familySlug" value={familySlug} />
          <input name="title" placeholder="Voqea nomi (masalan: To'y kuni)" required style={inputStyle} autoFocus />
          <div style={{ display: "flex", gap: 10 }}>
            <input name="eventDate" placeholder="Sana (masalan: 1998 yoki Iyun 2005)" style={inputStyle} />
            <input name="location" placeholder="Joy (ixtiyoriy)" style={inputStyle} />
          </div>
          {people.length > 0 && (
            <select name="personId" defaultValue="" style={inputStyle}>
              <option value="">Bog'liq odam (ixtiyoriy)</option>
              {people.map((p) => <option key={p.id} value={p.id}>{personLabel(p)}</option>)}
            </select>
          )}
          <textarea name="description" placeholder="Voqea haqida qisqacha (ixtiyoriy)" rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif" }} />
          {state?.error && <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>{state.error}</div>}
          <button type="submit" disabled={pending} style={{ marginTop: 6, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
            {pending ? "Qo'shilmoqda..." : "Voqea qo'shish"}
          </button>
        </form>
      </div>
    </div>
  );
}

function EditTimelineEventModal({ familySlug, event, people, updateTimelineEventAction, onClose }) {
  const [state, formAction, pending] = useActionState(updateTimelineEventAction, undefined);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,38,33,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="fm-panel-enter" style={{ width: "100%", maxWidth: 440, maxHeight: "88vh", overflow: "auto", background: TOKENS.card, borderRadius: 16, padding: "26px 26px 24px", border: `1px solid ${TOKENS.parchmentDeep}`, boxShadow: "0 30px 70px rgba(30,38,33,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, margin: 0 }}>Voqeani tahrirlash</h2>
          <button onClick={onClose} type="button" style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="hidden" name="familySlug" value={familySlug} />
          <input type="hidden" name="eventId" value={event.id} />
          <input name="title" placeholder="Voqea nomi" defaultValue={event.title} required style={inputStyle} />
          <div style={{ display: "flex", gap: 10 }}>
            <input name="eventDate" placeholder="Sana" defaultValue={event.event_date || ""} style={inputStyle} />
            <input name="location" placeholder="Joy (ixtiyoriy)" defaultValue={event.location || ""} style={inputStyle} />
          </div>
          {people.length > 0 && (
            <select name="personId" defaultValue={event.person_id || ""} style={inputStyle}>
              <option value="">Bog'liq odam (ixtiyoriy)</option>
              {people.map((p) => <option key={p.id} value={p.id}>{personLabel(p)}</option>)}
            </select>
          )}
          <textarea name="description" placeholder="Voqea haqida qisqacha" defaultValue={event.description || ""} rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif" }} />
          {state?.error && <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>{state.error}</div>}
          <button type="submit" disabled={pending} style={{ marginTop: 6, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
            {pending ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function TimelineView({
  familySlug,
  people,
  timelineEvents,
  canEdit,
  createTimelineEventAction,
  updateTimelineEventAction,
  deleteTimelineEventAction,
  uploadTimelineEventPhotoAction,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  const selected = timelineEvents.find((e) => e.id === selectedId) || null;
  const personNameFor = (personId) => {
    if (!personId) return null;
    const p = people.find((pp) => pp.id === personId);
    return p ? personLabel(p) : null;
  };

  // Voqealarni yil bo'yicha guruhlaymiz (allaqachon xronologik tartiblangan) —
  // render paytida o'zgaruvchini mutatsiya qilishdan qochish uchun useMemo
  // ichida, oldindan hisoblab qo'yamiz.
  const groupedEvents = useMemo(() => {
    const groups = [];
    let currentKey;
    for (const ev of timelineEvents) {
      const year = extractEventYear(ev.event_date);
      if (groups.length === 0 || year !== currentKey) {
        groups.push({ year, items: [ev] });
        currentKey = year;
      } else {
        groups[groups.length - 1].items.push(ev);
      }
    }
    return groups;
  }, [timelineEvents]);

  useEffect(() => {
    setPhotoError(null);
  }, [selectedId]);

  if (timelineEvents.length === 0) {
    return (
      <>
        <EmptyTimeline canEdit={canEdit} onAddEvent={() => setShowAddModal(true)} />
        {showAddModal && (
          <AddTimelineEventModal familySlug={familySlug} people={people} createTimelineEventAction={createTimelineEventAction} onClose={() => setShowAddModal(false)} />
        )}
      </>
    );
  }

  return (
    <div className="fm-fade" style={{ display: "flex", height: "100%", flexWrap: "wrap" }}>
      <div style={{ flex: 1, padding: "28px clamp(16px, 5vw, 48px) 60px", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", color: TOKENS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Oila tarixi</div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 500, margin: 0 }}>Vaqt chizig'i</h1>
            <div style={{ fontSize: 12.5, color: TOKENS.ink60, marginTop: 6 }}>{timelineEvents.length} ta voqea</div>
          </div>
          {canEdit && (
            <button onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 7, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "0 18px", height: 40, fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
              <Plus size={14} /> Voqea qo'shish
            </button>
          )}
        </div>

        <div style={{ position: "relative", maxWidth: 640 }}>
          <div style={{ position: "absolute", left: 9, top: 6, bottom: 20, width: 2, background: TOKENS.parchmentDeep }} />
          {groupedEvents.map((group) => (
            <React.Fragment key={group.year ?? "unknown"}>
              <TimelineYearMarker label={group.year || "Sana noaniq"} />
              {group.items.map((ev) => (
                <TimelineEventCard key={ev.id} event={ev} personName={personNameFor(ev.person_id)} onSelect={() => setSelectedId(ev.id)} />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {selected && (
        <TimelineEventDetailPanel
          event={selected}
          personName={personNameFor(selected.person_id)}
          canEdit={canEdit}
          familySlug={familySlug}
          uploadTimelineEventPhotoAction={uploadTimelineEventPhotoAction}
          photoError={photoError}
          setPhotoError={setPhotoError}
          onClose={() => { setSelectedId(null); setConfirmDelete(false); }}
          onEdit={() => setShowEditModal(true)}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
          deleteTimelineEventAction={deleteTimelineEventAction}
        />
      )}

      {showAddModal && (
        <AddTimelineEventModal familySlug={familySlug} people={people} createTimelineEventAction={createTimelineEventAction} onClose={() => setShowAddModal(false)} />
      )}

      {showEditModal && selected && (
        <EditTimelineEventModal
          familySlug={familySlug}
          event={selected}
          people={people}
          updateTimelineEventAction={updateTimelineEventAction}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
