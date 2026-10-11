"use client";

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { TOKENS } from "@/lib/uiTokens";
import { CARD_W, CARD_H, layoutFamilyTree, lineageOf } from "@/lib/treeLayout";
import { t as tr } from "@/lib/i18n";

/**
 * Oila daraxti (SVG). Joylashuv `layoutFamilyTree` da — qat'iy oraliqlar bilan,
 * shuning uchun yangi odam qo'shilganda boshqalar joyidan sakramaydi.
 * Zoom/pan d3-zoom orqali; ko'rinish (transform) ma'lumot o'zgarganda saqlanib
 * qoladi. Odam tanlanganda uning qon chizig'i ajratib ko'rsatiladi.
 *
 * Ref API: zoomIn(), zoomOut(), center() — butun daraxtni ekranga moslash,
 * focus(personId) — shu odamga silliq o'tish.
 */
const AV = 21;

function initials(name) {
  return (name || "?").trim().charAt(0).toUpperCase() || "?";
}

function truncate(text, max) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function linkPath(l) {
  const r = 10;
  const midY = l.ty - 34;
  const { sx, sy, tx, ty } = l;
  if (Math.abs(tx - sx) < 1) return `M${sx},${sy} V${ty}`;
  const dir = tx > sx ? 1 : -1;
  const rr = Math.min(r, Math.abs(tx - sx) / 2);
  return [
    `M${sx},${sy}`,
    `V${midY - rr}`,
    `Q${sx},${midY} ${sx + dir * rr},${midY}`,
    `H${tx - dir * rr}`,
    `Q${tx},${midY} ${tx},${midY + rr}`,
    `V${ty}`,
  ].join(" ");
}

const PersonCard = React.memo(function PersonCard({ card, person, selected, isMe, dimmed, highlighted, onSelect }) {
  const name = [person.first_name, person.last_name].filter(Boolean).join(" ") || "Ism kiritilmagan";
  const years = person.birth_date && person.death_date ? `${person.birth_date} – ${person.death_date}` : person.birth_date || (person.death_date ? `– ${person.death_date}` : "");
  const deceased = !!person.death_date;
  const accent = person.gender === "female" ? "#C97B84" : person.gender === "male" ? TOKENS.teal : TOKENS.goldSoft;
  const fill = selected ? TOKENS.ink : TOKENS.card;
  const nameColor = selected ? TOKENS.parchment : TOKENS.ink;
  const subColor = selected ? "rgba(242,237,226,0.65)" : TOKENS.ink60;
  const ax = -CARD_W / 2 + 14 + AV;
  const tx = ax + AV + 12;
  const clipId = `tc-${card.key}`;
  return (
    <g
      transform={`translate(${card.x},${card.y})`}
      style={{ cursor: "pointer", opacity: dimmed ? 0.32 : card.ghost ? 0.78 : 1, transition: "opacity .25s" }}
      onClick={(e) => { e.stopPropagation(); onSelect(person.id); }}
      className="fm-tree-card"
      role="button"
      aria-label={name}
    >
      <rect
        x={-CARD_W / 2} y={-CARD_H / 2} width={CARD_W} height={CARD_H} rx={14}
        fill={fill}
        stroke={selected ? TOKENS.ink : highlighted ? TOKENS.gold : TOKENS.parchmentDeep}
        strokeWidth={highlighted && !selected ? 1.6 : 1}
        strokeDasharray={card.ghost ? "5 4" : undefined}
        className="fm-tree-card-bg"
      />
      <rect x={-CARD_W / 2} y={-CARD_H / 2 + 14} width={4} height={CARD_H - 28} rx={2} fill={accent} opacity={selected ? 0.9 : 0.75} />
      <circle cx={ax} cy={0} r={AV + 2} fill={selected ? "rgba(242,237,226,0.12)" : TOKENS.parchment} stroke={isMe ? TOKENS.gold : "transparent"} strokeWidth={2} />
      {person.profile_photo_url ? (
        <>
          <clipPath id={clipId}><circle cx={ax} cy={0} r={AV} /></clipPath>
          <image href={person.profile_photo_url} x={ax - AV} y={-AV} width={AV * 2} height={AV * 2} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} style={{ filter: deceased ? "grayscale(0.85)" : undefined }} />
        </>
      ) : (
        <>
          <circle cx={ax} cy={0} r={AV} fill={selected ? "rgba(242,237,226,0.16)" : TOKENS.parchmentDeep} />
          <text x={ax} y={6} textAnchor="middle" fontFamily="Fraunces, serif" fontSize={17} fill={nameColor} pointerEvents="none">{initials(name)}</text>
        </>
      )}
      <text x={tx} y={years ? -4 : 5} fontSize={13.5} fontWeight={600} fill={nameColor} pointerEvents="none" fontFamily="Inter, sans-serif">
        {truncate(name, 19)}{deceased ? " †" : ""}
      </text>
      {years && <text x={tx} y={15} fontSize={11.5} fill={subColor} pointerEvents="none" fontFamily="Inter, sans-serif">{years}</text>}
      {isMe && (
        <g transform={`translate(${CARD_W / 2 - 30},${-CARD_H / 2 + 12})`}>
          <rect x={-16} y={-8} width={32} height={16} rx={8} fill={TOKENS.gold} />
          <text x={0} y={4} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#fff" fontFamily="Inter, sans-serif">{tr("SIZ")}</text>
        </g>
      )}
      {card.ghost && (
        <text x={CARD_W / 2 - 14} y={CARD_H / 2 - 9} textAnchor="end" fontSize={9.5} fill={subColor} fontFamily="Inter, sans-serif" pointerEvents="none">{tr("havola ↗")}</text>
      )}
    </g>
  );
});

export const TreeVisualization = forwardRef(function TreeVisualization(
  { people, relationships, onSelectPerson, mePersonId, selectedId = null, onZoom },
  ref
) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const zoomRef = useRef(null);
  const transformRef = useRef(d3.zoomIdentity);
  const userMovedRef = useRef(false);
  const [size, setSize] = useState(null);

  const layout = useMemo(() => layoutFamilyTree(people, relationships), [people, relationships]);
  const lineage = useMemo(() => (selectedId && layout.index.people[selectedId] ? lineageOf(layout.index, selectedId) : null), [layout, selectedId]);

  useLayoutEffect(() => {
    const node = wrapRef.current;
    if (!node) return undefined;
    const measure = () => setSize((s) => {
      const w = Math.max(200, node.clientWidth), h = Math.max(300, node.clientHeight);
      return s && s.w === w && s.h === h ? s : { w, h };
    });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const fitTransform = useCallback(() => {
    if (!size) return d3.zoomIdentity;
    const b = layout.bounds;
    const pad = 60;
    const k = Math.max(0.2, Math.min(1, (size.w - pad * 2) / Math.max(1, b.w), (size.h - pad * 2) / Math.max(1, b.h)));
    const cx = b.minX + b.w / 2, cy = b.minY + b.h / 2;
    return d3.zoomIdentity.translate(size.w / 2 - cx * k, size.h / 2 - cy * k).scale(k);
  }, [layout, size]);

  // d3-zoom: faqat bir marta ulanadi; transform DOM'ga to'g'ridan-to'g'ri yoziladi.
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom()
      .scaleExtent([0.15, 2.5])
      .filter((event) => !event.button && !(event.type === "dblclick"))
      .on("zoom", (event) => {
        // Foydalanuvchi o'zi surgan/kattalashtirgan bo'lsa, avtomatik moslashni to'xtatamiz.
        if (event.sourceEvent) userMovedRef.current = true;
        transformRef.current = event.transform;
        if (gRef.current) gRef.current.setAttribute("transform", event.transform.toString());
        onZoom?.(event.transform.k);
      });
    zoomRef.current = zoom;
    svg.call(zoom).on("dblclick.zoom", null);
    return () => svg.on(".zoom", null);
  }, [onZoom]);

  const animateTo = useCallback((t, ms = 380) => {
    if (!zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(ms).ease(d3.easeCubicOut).call(zoomRef.current.transform, t);
  }, []);

  const focusTransform = useCallback((personId) => {
    const card = layout.cards.find((c) => c.id === personId && !c.ghost) || layout.cards.find((c) => c.id === personId);
    if (!card || !size) return null;
    const k = Math.max(0.85, Math.min(1.2, transformRef.current.k));
    return d3.zoomIdentity.translate(size.w / 2 - card.x * k, size.h / 2 - card.y * k).scale(k);
  }, [layout, size]);

  // O'lcham aniqlangach — ekranga moslaymiz. Konteyner o'zgarsa (masalan,
  // profil paneli ochilsa) va foydalanuvchi hali o'zi surmagan bo'lsa — qayta
  // moslaymiz (tanlangan odam bo'lsa, unga). Odam qo'shilganda ko'rinish saqlanadi.
  const firstFit = useRef(true);
  useEffect(() => {
    if (!zoomRef.current || !size || !layout.cards.length || userMovedRef.current) return;
    const t = (selectedId && focusTransform(selectedId)) || fitTransform();
    if (firstFit.current) { firstFit.current = false; d3.select(svgRef.current).call(zoomRef.current.transform, t); }
    else animateTo(t, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, layout.cards.length > 0]);

  useImperativeHandle(ref, () => ({
    zoomIn() { if (zoomRef.current) d3.select(svgRef.current).transition().duration(200).call(zoomRef.current.scaleBy, 1.25); },
    zoomOut() { if (zoomRef.current) d3.select(svgRef.current).transition().duration(200).call(zoomRef.current.scaleBy, 1 / 1.25); },
    center() { userMovedRef.current = false; animateTo(fitTransform()); },
    focus(personId) {
      const t = focusTransform(personId);
      if (t) animateTo(t, 450);
    },
  }), [animateTo, fitTransform, focusTransform]);

  // React transform atributini boshqarmaydi — uni d3-zoom yozadi; har renderdan keyin tiklaymiz.
  useLayoutEffect(() => {
    if (gRef.current) gRef.current.setAttribute("transform", transformRef.current.toString());
  });

  const inLineage = (id) => !lineage || lineage.has(id);

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%", height: "100%", minHeight: 420 }}>
      <svg
        ref={svgRef}
        width={size?.w || 0}
        height={size?.h || 0}
        onClick={() => onSelectPerson?.(null)}
        style={{
          display: "block",
          borderRadius: 14,
          border: `1px solid ${TOKENS.parchmentDeep}`,
          background: `radial-gradient(circle, ${TOKENS.parchmentDeep} 1px, transparent 1px) 0 0 / 22px 22px, ${TOKENS.card}`,
          cursor: "grab",
          touchAction: "none",
        }}
      >
        <g ref={gRef}>
          {layout.links.map((l) => {
            const strong = lineage && l.from.some((id) => lineage.has(id)) && lineage.has(l.to);
            return (
              <path
                key={l.key}
                d={linkPath(l)}
                fill="none"
                stroke={strong ? TOKENS.gold : TOKENS.ink40}
                strokeOpacity={lineage && !strong ? 0.18 : strong ? 0.95 : 0.45}
                strokeWidth={strong ? 2.4 : 1.6}
                strokeLinecap="round"
              />
            );
          })}
          {layout.partners.map((p) => {
            const strong = lineage && lineage.has(p.a) && lineage.has(p.b);
            const mid = (p.x1 + p.x2) / 2;
            return (
              <g key={p.key} opacity={lineage && !strong ? 0.3 : 1}>
                <line x1={p.x1} x2={p.x2} y1={p.y} y2={p.y} stroke={TOKENS.gold} strokeWidth={2} strokeOpacity={0.8} />
                <circle cx={mid} cy={p.y} r={7} fill={TOKENS.card} stroke={TOKENS.gold} strokeWidth={1.5} />
                <path d={`M${mid},${p.y + 3} l-3.2,-3.2 a1.8,1.8 0 0 1 3.2,-1.9 a1.8,1.8 0 0 1 3.2,1.9 z`} fill={TOKENS.gold} />
              </g>
            );
          })}
          {layout.cards.map((c) => {
            const person = layout.index.people[c.id];
            if (!person) return null;
            return (
              <PersonCard
                key={c.key}
                card={c}
                person={person}
                selected={c.id === selectedId}
                isMe={c.id === mePersonId}
                dimmed={!inLineage(c.id)}
                highlighted={!!lineage && lineage.has(c.id)}
                onSelect={onSelectPerson}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
});
