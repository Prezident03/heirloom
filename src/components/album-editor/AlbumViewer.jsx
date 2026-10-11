"use client";

import React, { useMemo } from "react";
import { Pencil } from "lucide-react";
import { albumToDoc } from "./model";
import { EDITOR_CSS } from "./ui";
import { EDITOR_FONT_IMPORT } from "./constants";
import { Preview } from "./Preview";

/** Albom ochilganda birinchi ko'rinadigan katta ko'rish rejimi. Tahrirlash — alohida tugma orqali. */
export default function AlbumViewer({ album, doc: liveDoc, canEdit, onEdit, onClose }) {
  const doc = useMemo(() => liveDoc || albumToDoc(album), [liveDoc, album]);
  const subtitle = [album.date_label, album.location, `${doc.pages.length} sahifa`].filter(Boolean).join(" · ");
  const isEmpty = doc.pages.every((p) => p.elements.length === 0);
  return (
    <>
      <style>{EDITOR_CSS}</style>
      <link rel="stylesheet" href={EDITOR_FONT_IMPORT} precedence="default" />
      <Preview
        pages={doc.pages}
        title={album.title}
        subtitle={isEmpty && canEdit ? "Albom hali bo'sh — tahrirlashni boshlang" : subtitle}
        onClose={onClose}
        actions={canEdit ? (
          <button
            type="button"
            onClick={onEdit}
            style={{ height: 40, padding: "0 16px", borderRadius: 20, border: "none", background: "#B8863B", color: "#fff", fontWeight: 600, fontSize: 13.5, display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
          >
            <Pencil size={15} /> Tahrirlash
          </button>
        ) : null}
      />
    </>
  );
}
