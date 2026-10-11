"use client";

import React, { useMemo } from "react";
import { albumToDoc } from "./model";
import { EDITOR_CSS } from "./ui";
import { EDITOR_FONT_IMPORT, setPageFormat, LEGACY_FORMAT } from "./constants";
import { Preview } from "./Preview";

/** Havola orqali ulashilgan albom: faqat varaqlab ko'rish, hech qanday tahrir yo'q. */
export default function SharedAlbumViewer({ album }) {
  const doc = useMemo(() => albumToDoc(album), [album]);
  setPageFormat(doc.format || LEGACY_FORMAT);
  const subtitle = [album.family_name && `${album.family_name} oilasi`, album.date_label, album.location].filter(Boolean).join(" · ");
  return (
    <>
      <style>{EDITOR_CSS}</style>
      <link rel="stylesheet" href={EDITOR_FONT_IMPORT} precedence="default" />
      <Preview
        pages={doc.pages}
        title={album.title}
        subtitle={subtitle}
        footer={
          <div style={{ height: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, opacity: 0.55 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: "linear-gradient(135deg, #B8863B, #D9BC85)", display: "inline-block" }} />
            Heirloom — oilaviy xotiralar albomi
          </div>
        }
      />
    </>
  );
}
