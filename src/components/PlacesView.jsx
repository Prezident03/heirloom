import React, { useState, useEffect, useActionState } from "react";
import { Plus, X, MapPinned } from "lucide-react";
import { TOKENS, inputStyle } from "@/lib/uiTokens";
import { PlacesMap } from "./PlacesMap";

/**
 * Global "+ Yangi" menyusidan chaqiriladigan joy qo'shish modali —
 * foydalanuvchi joylar bo'limida bo'lmasa ham istalgan joydan joy
 * qo'sha olishi uchun (AddTimelineEventModal bilan bir xil naqsh).
 */
export function AddPlaceModal({ familySlug, createPlaceAction, onClose }) {
  const [state, formAction, pending] = useActionState(createPlaceAction, undefined);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,38,33,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="fm-panel-enter" style={{ width: "100%", maxWidth: 440, background: TOKENS.card, borderRadius: 16, padding: "26px 26px 24px", border: `1px solid ${TOKENS.parchmentDeep}`, boxShadow: "0 30px 70px rgba(30,38,33,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, margin: 0 }}>Yangi joy</h2>
          <button onClick={onClose} type="button" style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="hidden" name="familySlug" value={familySlug} />
          <input name="name" placeholder="Joy nomi (masalan: Bobo uyi)" required style={inputStyle} autoFocus />
          <textarea name="description" placeholder="Tavsif / xotira (ixtiyoriy)" rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif" }} />
          <input type="text" name="address" placeholder="To'liq manzil (ixtiyoriy)" style={inputStyle} />
          <div style={{ display: "flex", gap: 10 }}>
            <input type="number" step="any" name="latitude" placeholder="Kenglik (latitude)" style={inputStyle} />
            <input type="number" step="any" name="longitude" placeholder="Uzunlik (longitude)" style={inputStyle} />
          </div>
          {state?.error && <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>{state.error}</div>}
          <button type="submit" disabled={pending} style={{ marginTop: 6, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
            {pending ? "Qo'shilmoqda..." : "Joy qo'shish"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function PlacesView({ places, canEdit, familySlug, createPlaceAction, updatePlaceAction, deletePlaceAction }) {
  const [showForm, setShowForm] = useState(false);
  const [formState, formAction] = useActionState(createPlaceAction, undefined);
  const [editState, editFormAction] = useActionState(updatePlaceAction, undefined);
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteState, deleteFormAction] = useActionState(deletePlaceAction, undefined);

  // Lat/lng maydonlari controlled — xaritani bosish orqali ham to'ldiriladi
  const [latVal, setLatVal] = useState("");
  const [lngVal, setLngVal] = useState("");

  const formOpen = (showForm || !!selected) && canEdit;

  // Forma ochilganda/tanlangan joy o'zgarganda lat/lng maydonlarini shu joy qiymatlariga qaytarish
  useEffect(() => {
    if (selected) {
      setLatVal(selected.latitude != null ? String(selected.latitude) : "");
      setLngVal(selected.longitude != null ? String(selected.longitude) : "");
    } else if (showForm) {
      setLatVal("");
      setLngVal("");
    }
  }, [selected, showForm]);

  const pickedLocation =
    formOpen && latVal !== "" && lngVal !== "" && !Number.isNaN(parseFloat(latVal)) && !Number.isNaN(parseFloat(lngVal))
      ? { lat: parseFloat(latVal), lng: parseFloat(lngVal) }
      : null;

  function handlePick(lat, lng) {
    setLatVal(String(Number(lat.toFixed(6))));
    setLngVal(String(Number(lng.toFixed(6))));
  }

  function handleSelectFromMap(place) {
    setSelected(place);
    setShowForm(false);
    setConfirmDelete(null);
  }

  return (
    <div style={{ display: "flex", height: "100%", gap: 20, padding: "20px 24px" }}>
      <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: TOKENS.ink, margin: 0 }}>Joylar</h1>
          {canEdit && (
            <button onClick={() => { setShowForm(!showForm); setSelected(null); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8, background: TOKENS.ink, color: TOKENS.parchment, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              <Plus size={16} /> Yangi joy
            </button>
          )}
        </div>

        <PlacesMap
          places={places}
          selectedId={selected?.id}
          onSelectPlace={handleSelectFromMap}
          pickMode={formOpen}
          pickedLocation={pickedLocation}
          onPick={handlePick}
        />
      </div>

      <div style={{ width: "min(360px, 100%)", flex: "0 0 360px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
        {formOpen && (
          <form action={selected ? editFormAction : formAction} style={{ background: TOKENS.card, padding: 16, borderRadius: 12, gap: 12, display: "flex", flexDirection: "column" }}>
            <input type="hidden" name="familySlug" value={familySlug} />
            {selected && <input type="hidden" name="placeId" value={selected.id} />}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{selected ? "Joyni tahrirlash" : "Yangi joy qo'shish"}</h3>
              <button type="button" onClick={() => { setShowForm(false); setSelected(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={16} /></button>
            </div>
            <input type="text" name="name" defaultValue={selected?.name || ""} placeholder="Joy nomi (masalan: Bobo uyi)" required style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${TOKENS.parchmentDeep}`, fontSize: 13 }} />
            <textarea name="description" defaultValue={selected?.description || ""} placeholder="Tavsif / xotira" style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${TOKENS.parchmentDeep}`, fontSize: 13, minHeight: 60, fontFamily: "inherit" }} />
            <input type="text" name="address" defaultValue={selected?.address || ""} placeholder="To'liq manzil" style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${TOKENS.parchmentDeep}`, fontSize: 13 }} />
            <div style={{ fontSize: 10.5, color: TOKENS.ink40 }}>💡 Koordinatani qo'lda kiriting yoki chapdagi xaritani bosing</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input type="number" step="any" name="latitude" value={latVal} onChange={(e) => setLatVal(e.target.value)} placeholder="Kenglik (latitude)" style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${TOKENS.parchmentDeep}`, fontSize: 13 }} />
              <input type="number" step="any" name="longitude" value={lngVal} onChange={(e) => setLngVal(e.target.value)} placeholder="Uzunlik (longitude)" style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${TOKENS.parchmentDeep}`, fontSize: 13 }} />
            </div>
            {(formState?.error || editState?.error) && <div style={{ fontSize: 12, color: TOKENS.danger }}>{formState?.error || editState?.error}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" style={{ flex: 1, padding: "10px 16px", borderRadius: 6, background: TOKENS.teal, color: TOKENS.parchment, border: "none", cursor: "pointer", fontWeight: 600 }}>Saqlash</button>
              {selected && (
                <button type="button" onClick={() => setConfirmDelete(selected.id)} style={{ padding: "10px 16px", borderRadius: 6, background: TOKENS.danger, color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>O'chirish</button>
              )}
            </div>
          </form>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, overflowY: "auto" }}>
          {places.length === 0 ? (
            <div style={{ textAlign: "center", color: TOKENS.ink60, padding: "40px 16px" }}>
              <MapPinned size={32} style={{ marginBottom: 16, opacity: 0.5 }} />
              <div style={{ fontSize: 14, fontWeight: 500 }}>Hali joy qo'shilmagan</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>Oilangizga tegishli joylarni saqlang — uylar, shaharlar, davlatlar</div>
            </div>
          ) : (
            places.map(p => (
              <div key={p.id} onClick={() => { setSelected(p); setShowForm(false); }} style={{ background: TOKENS.card, borderRadius: 8, padding: 14, cursor: "pointer", boxShadow: `0 2px 8px rgba(30,38,33,0.08)`, border: selected?.id === p.id ? `2px solid ${TOKENS.gold}` : "1px solid transparent" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: TOKENS.tealSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <MapPinned size={14} color={TOKENS.teal} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: TOKENS.ink, marginBottom: 4 }}>{p.name}</div>
                    {p.address && <div style={{ fontSize: 11.5, color: TOKENS.ink60, marginBottom: 4 }}>{p.address}</div>}
                    {p.latitude != null && p.longitude != null && (
                      <div style={{ fontSize: 10.5, color: TOKENS.teal, fontFamily: "monospace" }}>{p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}</div>
                    )}
                    {p.description && <div style={{ fontSize: 11.5, color: TOKENS.ink60, marginTop: 6, lineHeight: 1.4 }}>{p.description.substring(0, 80)}{p.description.length > 80 ? "…" : ""}</div>}
                  </div>
                </div>
                {confirmDelete === p.id && (
                  <form action={deleteFormAction} style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${TOKENS.parchmentDeep}`, display: "flex", gap: 6 }}>
                    <input type="hidden" name="familySlug" value={familySlug} />
                    <input type="hidden" name="placeId" value={p.id} />
                    <button type="submit" style={{ flex: 1, padding: "6px 10px", borderRadius: 6, background: TOKENS.danger, color: "#fff", border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 600 }}>Rostdan ham</button>
                    <button type="button" onClick={() => setConfirmDelete(null)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${TOKENS.parchmentDeep}`, background: "transparent", cursor: "pointer", fontSize: 11.5, fontWeight: 600 }}>Bekor</button>
                  </form>
                )}
                {deleteState?.error && <div style={{ marginTop: 8, fontSize: 11, color: TOKENS.danger }}>{deleteState.error}</div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
