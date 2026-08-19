"use client";

import React, { useState, useRef, useCallback } from "react";
import { ChevronUp, ChevronDown, Trash2, Copy } from "lucide-react";
import { TOKENS } from "@/lib/uiTokens";

interface PageElement {
  id: string;
  type: "photo" | "text";
  photo_url?: string;
  text_content?: string;
  position_x: number;
  position_y: number;
  position_w: number;
  position_h: number;
  rotation: number;
  z_index: number;
}

interface AlbumEditorCanvasProps {
  elements: PageElement[];
  onUpdatePosition: (elementId: string, x: number, y: number, w: number, h: number, zIndex: number, rotation: number) => Promise<void>;
  onDelete: (elementId: string) => Promise<void>;
  onDuplicate: (elementId: string) => Promise<void>;
  onChangeZIndex: (elementId: string, direction: "up" | "down") => Promise<void>;
}

export function AlbumEditorCanvas({
  elements,
  onUpdatePosition,
  onDelete,
  onDuplicate,
  onChangeZIndex,
}: AlbumEditorCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sortedElements = [...elements].sort((a, b) => a.z_index - b.z_index);

  return (
    <div style={{ display: "flex", gap: 20, height: "600px" }}>
      {/* Canvas */}
      <div
        ref={canvasRef}
        style={{
          flex: 1,
          background: "#FFF",
          borderRadius: 8,
          border: `1px solid ${TOKENS.parchmentDeep}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Elements */}
        {sortedElements.map((element) => {
          const isSelected = selectedId === element.id;

          return (
            <div
              key={element.id}
              onClick={() => setSelectedId(element.id)}
              style={{
                position: "absolute",
                left: `${element.position_x}%`,
                top: `${element.position_y}%`,
                width: `${element.position_w}%`,
                height: `${element.position_h}%`,
                transform: `rotate(${element.rotation}deg)`,
                border: isSelected ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.parchmentDeep}`,
                background: element.type === "photo" ? `url(${element.photo_url})` : TOKENS.parchment,
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderRadius: 4,
                cursor: "pointer",
                boxShadow: isSelected ? `0 0 0 2px ${TOKENS.gold}40` : "none",
                transition: "all 0.2s ease",
              }}
            >
              {element.type === "text" && (
                <div style={{ padding: 8, fontSize: 12, color: TOKENS.ink, overflow: "hidden" }}>
                  {element.text_content}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Properties Panel */}
      {selectedId && (
        <div
          style={{
            width: 280,
            background: TOKENS.card,
            border: `1px solid ${TOKENS.parchmentDeep}`,
            borderRadius: 8,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: TOKENS.ink }}>
            Element Properties
          </h3>

          {/* Position Info */}
          <div style={{ fontSize: 12, color: TOKENS.ink60, lineHeight: 1.6 }}>
            <div>X: {elements.find((e) => e.id === selectedId)?.position_x.toFixed(1)}%</div>
            <div>Y: {elements.find((e) => e.id === selectedId)?.position_y.toFixed(1)}%</div>
            <div>W: {elements.find((e) => e.id === selectedId)?.position_w.toFixed(1)}%</div>
            <div>H: {elements.find((e) => e.id === selectedId)?.position_h.toFixed(1)}%</div>
          </div>

          {/* Z-Index Controls */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={async () => {
                setLoading(true);
                await onChangeZIndex(selectedId, "up");
                setLoading(false);
              }}
              disabled={loading}
              style={{
                flex: 1,
                padding: "8px 12px",
                background: TOKENS.ink,
                color: TOKENS.parchment,
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                opacity: loading ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={async () => {
                setLoading(true);
                await onChangeZIndex(selectedId, "down");
                setLoading(false);
              }}
              disabled={loading}
              style={{
                flex: 1,
                padding: "8px 12px",
                background: TOKENS.ink,
                color: TOKENS.parchment,
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                opacity: loading ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={async () => {
                setLoading(true);
                await onDuplicate(selectedId);
                setLoading(false);
              }}
              disabled={loading}
              style={{
                flex: 1,
                padding: "8px 12px",
                background: TOKENS.gold,
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                opacity: loading ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Copy size={14} />
            </button>
            <button
              onClick={async () => {
                setLoading(true);
                await onDelete(selectedId);
                setSelectedId(null);
                setLoading(false);
              }}
              disabled={loading}
              style={{
                flex: 1,
                padding: "8px 12px",
                background: "#e74c3c",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                opacity: loading ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
