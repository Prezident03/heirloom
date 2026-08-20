import React, { useState, useMemo, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { TOKENS } from "@/lib/uiTokens";
import { relationLabelBetween, personLabel, personYears } from "@/lib/relationshipLabels";
import { buildFamilyGenerations } from "./shared";
import { TreeVisualization } from "./TreeVisualization";
import { PersonDetailPanel, EmptyFamilyTree, AddPersonModal, LinkPersonModal, EditPersonModal } from "./PersonComponents";

export function FamilyTreeView({
  familyName,
  familySlug,
  people,
  relationships,
  canEdit,
  mePersonId,
  addPersonAction,
  linkPersonAction,
  editPersonAction,
  deletePersonAction,
  uploadPersonPhotoAction,
}) {
  const [selected, setSelected] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  // Tree Canvas'ning zoom/pan holati — bu yerda "lifted" qilingan, chunki
  // <TreeVisualization> D3 asosida ishlaydi va controlled zoom/pan qabul
  // qiladi (o'zi mouse wheel / drag / pinch-zoomni ichkarida boshqaradi).
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const searchMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return people
      .map((p) => ({ id: p.id, name: personLabel(p) }))
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [people, query]);

  const goToPerson = (personId) => {
    const person = people.find((p) => p.id === personId);
    if (!person) return;
    setSelected({
      id: person.id,
      name: personLabel(person),
      years: personYears(person),
      biography: person.biography,
      photoUrl: person.profile_photo_url,
      gender: person.gender,
      raw: person,
    });
    setQuery("");
    setSearchFocused(false);
  };

  const relationToMe = useMemo(() => {
    if (!selected || !mePersonId) return null;
    return relationLabelBetween(mePersonId, selected.id, people, relationships);
  }, [selected, mePersonId, people, relationships]);

  useEffect(() => {
    setPhotoError(null);
  }, [selected?.id]);

  const generations = useMemo(() => buildFamilyGenerations(people, relationships), [people, relationships]);

  if (people.length === 0) {
    return (
      <>
        <EmptyFamilyTree familyName={familyName} canEdit={canEdit} onAddPerson={() => setShowAddModal(true)} />
        {showAddModal && (
          <AddPersonModal familySlug={familySlug} people={people} relationships={relationships} addPersonAction={addPersonAction} onClose={() => setShowAddModal(false)} />
        )}
      </>
    );
  }

  const memberCount = people.length;
  const genCount = generations.length;

  return (
    <div className="fm-fade" style={{ display: "flex", height: "100%", flexWrap: "wrap" }}>
      <div style={{ flex: 1, padding: "24px 20px 24px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", color: TOKENS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Avlodlar</div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 500, margin: 0 }}>{familyName}</h1>
            <div style={{ fontSize: 12.5, color: TOKENS.ink60, marginTop: 6 }}>{genCount} avlod · {memberCount} a'zo</div>
          </div>
          {canEdit && (
            <button onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 7, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
              <Plus size={14} /> Odam qo'shish
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: TOKENS.ink60, fontWeight: 500 }}>
            💡 Mouse wheel - zoom | Drag - pan
          </div>
          <div style={{ position: "relative", flex: "0 1 220px", minWidth: 160 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: "0 10px", height: 32 }}>
              <Search size={13} color={TOKENS.ink40} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                placeholder="Odamni qidirish..."
                style={{ border: "none", outline: "none", background: "transparent", fontSize: 12.5, width: "100%", color: TOKENS.ink, fontFamily: "Inter, sans-serif" }}
              />
            </div>
            {searchFocused && searchMatches.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, boxShadow: "0 10px 24px rgba(30,38,33,0.14)", zIndex: 10, overflow: "hidden" }}>
                {searchMatches.map((m) => (
                  <div
                    key={m.id}
                    onMouseDown={() => goToPerson(m.id)}
                    style={{ padding: "9px 12px", fontSize: 12.5, cursor: "pointer", color: TOKENS.ink }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = TOKENS.parchment)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {m.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 420, position: "relative" }}>
          <TreeVisualization
            people={people}
            relationships={relationships}
            onSelectPerson={setSelected}
            mePersonId={mePersonId}
            width={1200}
            height={600}
            zoom={zoom}
            pan={pan}
            onZoom={setZoom}
            onPan={setPan}
          />
        </div>
      </div>

      {selected && (
        <PersonDetailPanel
          selected={selected}
          mePersonId={mePersonId}
          relationToMe={relationToMe}
          canEdit={canEdit}
          familySlug={familySlug}
          uploadPersonPhotoAction={uploadPersonPhotoAction}
          photoError={photoError}
          setPhotoError={setPhotoError}
          onClose={() => { setSelected(null); setConfirmDelete(false); }}
          onEdit={() => setShowEditModal(true)}
          onLink={() => setShowLinkModal(true)}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
          deletePersonAction={deletePersonAction}
        />
      )}

      {showAddModal && (
        <AddPersonModal familySlug={familySlug} people={people} relationships={relationships} addPersonAction={addPersonAction} onClose={() => setShowAddModal(false)} />
      )}

      {showLinkModal && selected && (
        <LinkPersonModal
          familySlug={familySlug}
          person={selected}
          people={people}
          linkPersonAction={linkPersonAction}
          onClose={() => setShowLinkModal(false)}
        />
      )}

      {showEditModal && selected && (
        <EditPersonModal
          familySlug={familySlug}
          person={selected}
          editPersonAction={editPersonAction}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
