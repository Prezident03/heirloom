"use client";

import React, { useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle } from "react";
import * as d3 from "d3";
import { TOKENS } from "@/lib/uiTokens";

// Card / layout constants (also used for spouse-pairing math below).
const CARD_W = 136;
const CARD_H = 76;
const SPOUSE_GAP = 16;
const STEM = 22; // vertical "elbow" stem length between a parent couple and the horizontal bar above their children

/**
 * D3-based hierarchical family tree visualization.
 * Optimized for families with 100+ people.
 *
 * Features:
 * - Hierarchical tree layout, with spouses rendered as a paired unit
 *   (two cards side by side, connected by a short line) rather than as
 *   separate tree nodes.
 * - Right-angle ("elbow") connectors from each couple's midpoint down to
 *   their children, matching a typical genealogy-chart look.
 * - Zoom/pan with mouse wheel and drag; imperative zoomIn/zoomOut/center
 *   exposed via ref for an external toolbar.
 * - Click to select person.
 * - Performance optimized for large trees.
 *
 * Props:
 * - people: Person[]
 * - relationships: Relationship[]
 * - onSelectPerson: (personId) => void
 * - mePersonId: string | null
 * - width: number
 * - height: number
 * - zoom: number
 * - pan: {x, y}
 * - onZoom: (scale) => void
 * - onPan: ({x, y}) => void
 *
 * Ref API (via forwardRef):
 * - zoomIn(): void
 * - zoomOut(): void
 * - center(): void
 */
export const TreeVisualization = forwardRef(function TreeVisualization(
  {
    people,
    relationships,
    onSelectPerson,
    mePersonId,
    width = 900,
    height = 600,
    zoom = 1,
    pan = { x: 0, y: 0 },
    onZoom,
    onPan,
  },
  ref
) {
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const zoomBehaviorRef = useRef(null);
  const [isRendering, setIsRendering] = useState(false);

  // Build tree data structure from people and relationships
  const treeData = useMemo(() => {
    if (people.length === 0) return null;

    const byId = {};
    people.forEach((p) => (byId[p.id] = p));

    // Find roots (people with no parents in the relationships)
    const hasParent = new Set();
    relationships.forEach((r) => {
      if (r.type === "parent") {
        hasParent.add(r.person_b_id);
      }
    });

    const roots = people.filter((p) => !hasParent.has(p.id));
    if (roots.length === 0) return null;

    // Build tree recursively
    const buildNode = (personId, visited = new Set()) => {
      if (visited.has(personId)) return null;
      visited.add(personId);

      const person = byId[personId];
      if (!person) return null;

      // Find children
      const childRels = relationships.filter(
        (r) => r.type === "parent" && r.person_a_id === personId
      );
      const children = childRels
        .map((r) => buildNode(r.person_b_id, visited))
        .filter(Boolean);

      // Find spouse
      const spouseRel = relationships.find(
        (r) =>
          r.type === "spouse" &&
          (r.person_a_id === personId || r.person_b_id === personId)
      );
      const spouseId =
        spouseRel &&
        (spouseRel.person_a_id === personId
          ? spouseRel.person_b_id
          : spouseRel.person_a_id);
      const spousePerson = spouseId ? byId[spouseId] : null;

      return {
        id: person.id,
        name: [person.first_name, person.last_name].filter(Boolean).join(" "),
        years:
          (person.birth_date ? person.birth_date : "") +
          (person.death_date ? "–" + person.death_date : ""),
        photo: person.profile_photo_url,
        spouse: spousePerson
          ? {
              id: spousePerson.id,
              name: [spousePerson.first_name, spousePerson.last_name].filter(Boolean).join(" "),
              years:
                (spousePerson.birth_date ? spousePerson.birth_date : "") +
                (spousePerson.death_date ? "–" + spousePerson.death_date : ""),
              photo: spousePerson.profile_photo_url,
            }
          : null,
        children,
      };
    };

    // Use first root as tree root
    const root = buildNode(roots[0].id);
    return root;
  }, [people, relationships]);

  // Render D3 tree (debounced for performance)
  useEffect(() => {
    if (!treeData || !svgRef.current) return;

    setIsRendering(true);
    const renderTimeout = setTimeout(() => {
      try {
        const svg = d3.select(svgRef.current);
        const g = d3.select(gRef.current);

        // Clear previous
        g.selectAll("*").remove();

        // Create hierarchy
        const hierarchy = d3.hierarchy(treeData);

        // Create tree layout - optimized for large trees. Nodes that carry a
        // spouse need roughly double the horizontal room (two cards side by
        // side), so they get more separation from their neighbors.
        const treeLayout = d3
          .tree()
          .size([Math.max(width - 100, 400), Math.max(height - 100, 400)])
          .separation((a, b) => {
            const aUnits = a.data.spouse ? 1.9 : 1;
            const bUnits = b.data.spouse ? 1.9 : 1;
            const base = (aUnits + bUnits) / 2;
            return a.parent === b.parent ? base : base + 0.5;
          });
        const root = treeLayout(hierarchy);

        // Midpoint x of a node's "couple unit" (person + spouse if any) —
        // this is what child/parent connector lines anchor to, so lines drop
        // from between the couple rather than from one person's card only.
        const anchorX = (d) => (d.data.spouse ? d.x + (CARD_W + SPOUSE_GAP) / 2 : d.x);
        const cardTopY = (d) => d.y - CARD_H / 2;
        const cardBottomY = (d) => d.y + CARD_H / 2;

        // ---- Right-angle ("elbow") connectors, grouped by parent ----
        const linksBySource = d3.group(root.links(), (l) => l.source.data.id);
        const elbowSegments = [];
        linksBySource.forEach((links) => {
          const source = links[0].source;
          const sx = anchorX(source);
          const sy = cardBottomY(source);
          const midY = sy + STEM;
          const childXs = links.map((l) => anchorX(l.target));
          const minX = Math.min(sx, ...childXs);
          const maxX = Math.max(sx, ...childXs);

          elbowSegments.push({ x1: sx, y1: sy, x2: sx, y2: midY });
          elbowSegments.push({ x1: minX, y1: midY, x2: maxX, y2: midY });
          links.forEach((l) => {
            const cx = anchorX(l.target);
            elbowSegments.push({ x1: cx, y1: midY, x2: cx, y2: cardTopY(l.target) });
          });
        });

        g.selectAll(".tree-link")
          .data(elbowSegments)
          .enter()
          .append("line")
          .attr("class", "tree-link")
          .attr("x1", (d) => d.x1)
          .attr("y1", (d) => d.y1)
          .attr("x2", (d) => d.x2)
          .attr("y2", (d) => d.y2)
          .attr("stroke", TOKENS.parchmentDeep)
          .attr("stroke-width", 2)
          .attr("stroke-linecap", "round")
          .attr("opacity", 0.7);

        // ---- Spouse connector (short line between the two cards of a couple) ----
        g.selectAll(".spouse-link")
          .data(root.descendants().filter((d) => d.data.spouse))
          .enter()
          .append("line")
          .attr("class", "spouse-link")
          .attr("x1", (d) => d.x + CARD_W / 2)
          .attr("y1", (d) => d.y)
          .attr("x2", (d) => d.x + CARD_W + SPOUSE_GAP - CARD_W / 2)
          .attr("y2", (d) => d.y)
          .attr("stroke", TOKENS.gold)
          .attr("stroke-width", 2)
          .attr("opacity", 0.55);

        // ---- Person cards ----
        // One card per person: the tree-hierarchy person at (d.x, d.y), and
        // (if present) their spouse offset to the right by CARD_W + SPOUSE_GAP.
        const cardData = [];
        root.descendants().forEach((d) => {
          cardData.push({ id: d.data.id, name: d.data.name, years: d.data.years, photo: d.data.photo, x: d.x, y: d.y });
          if (d.data.spouse) {
            cardData.push({
              id: d.data.spouse.id,
              name: d.data.spouse.name,
              years: d.data.spouse.years,
              photo: d.data.spouse.photo,
              x: d.x + CARD_W + SPOUSE_GAP,
              y: d.y,
            });
          }
        });

        const nodes = g
          .selectAll(".tree-node")
          .data(cardData, (d) => d.id)
          .enter()
          .append("g")
          .attr("class", "tree-node")
          .attr("transform", (d) => `translate(${d.x},${d.y})`)
          .style("cursor", "pointer");

        // Add person cards (background)
        nodes
          .append("rect")
          .attr("width", CARD_W)
          .attr("height", CARD_H)
          .attr("x", -CARD_W / 2)
          .attr("y", -CARD_H / 2)
          .attr("rx", 10)
          .attr("fill", TOKENS.card)
          .attr("stroke", TOKENS.parchmentDeep)
          .attr("stroke-width", 1)
          .style("filter", "drop-shadow(0 2px 6px rgba(30,38,33,0.08))")
          .style("transition", "filter 0.2s ease");

        // Add photo circle
        nodes
          .append("circle")
          .attr("r", 22)
          .attr("cx", 0)
          .attr("cy", -9)
          .attr("fill", (d) => (d.photo ? "transparent" : TOKENS.parchmentDeep))
          .attr("stroke", (d) => (d.id === mePersonId ? TOKENS.gold : TOKENS.parchmentDeep))
          .attr("stroke-width", (d) => (d.id === mePersonId ? 2.5 : 1));

        // Photo image (clipped to the circle) when a photo exists
        const defs = svg.select("defs").empty() ? svg.append("defs") : svg.select("defs");
        defs.selectAll("clipPath").remove();
        nodes
          .filter((d) => !!d.photo)
          .each(function (d) {
            const clipId = `tree-clip-${d.id}`;
            defs.append("clipPath").attr("id", clipId).append("circle").attr("r", 22).attr("cx", 0).attr("cy", -9);
            d3.select(this)
              .append("image")
              .attr("href", d.photo)
              .attr("x", -22)
              .attr("y", -31)
              .attr("width", 44)
              .attr("height", 44)
              .attr("preserveAspectRatio", "xMidYMid slice")
              .attr("clip-path", `url(#${clipId})`)
              .attr("pointer-events", "none");
          });

        // Initials fallback when there is no photo
        nodes
          .filter((d) => !d.photo)
          .append("text")
          .attr("y", -5)
          .attr("text-anchor", "middle")
          .attr("font-family", "Fraunces, serif")
          .attr("font-size", "15px")
          .attr("fill", TOKENS.ink60)
          .attr("pointer-events", "none")
          .text((d) => d.name?.[0]?.toUpperCase() || "?");

        // Add text (name)
        nodes
          .append("text")
          .attr("y", 16)
          .attr("text-anchor", "middle")
          .attr("font-size", "11.5px")
          .attr("font-weight", "600")
          .attr("fill", TOKENS.ink)
          .attr("pointer-events", "none")
          .text((d) => {
            const name = d.name || "";
            return name.length > 15 ? name.substring(0, 13) + "…" : name;
          });

        // Add text (years)
        nodes
          .append("text")
          .attr("y", 31)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("fill", TOKENS.ink60)
          .attr("pointer-events", "none")
          .text((d) => d.years);

        // Add click handlers
        nodes.on("click", (event, d) => {
          event.stopPropagation();
          onSelectPerson(d.id);
        });

        // Add hover effects
        nodes
          .on("mouseenter", function () {
            d3.select(this).select("rect").style("filter", "drop-shadow(0 6px 14px rgba(30,38,33,0.14))");
          })
          .on("mouseleave", function () {
            d3.select(this).select("rect").style("filter", "drop-shadow(0 2px 6px rgba(30,38,33,0.08))");
          });

        setIsRendering(false);
      } catch (err) {
        console.error("Tree rendering error:", err);
        setIsRendering(false);
      }
    }, 50); // Debounce renders

    return () => clearTimeout(renderTimeout);
  }, [treeData, width, height, mePersonId, onSelectPerson]);

  // Handle zoom/pan.
  //
  // IMPORTANT: this effect attaches the d3 zoom behavior ONCE (empty deps)
  // and applies the +50/+50 centering offset only on first mount. It must
  // NOT depend on `pan`/`zoom` React state: the "zoom" handler below calls
  // onPan/onZoom to report the transform up to the parent, which stores it
  // in state and passes it back down as the `pan`/`zoom` props. If this
  // effect re-ran on every such update it would re-apply `pan.x + 50` on
  // top of a `pan.x` that already includes the *previous* +50 — an
  // unbounded feedback loop that pans the tree further off-screen on every
  // render until every node is outside the visible SVG area (this was the
  // cause of the tree appearing empty despite people existing).
  const didInitialCenter = useRef(false);
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    const zoomBehavior = d3
      .zoom()
      .scaleExtent([0.25, 2.5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        if (onPan) {
          onPan({ x: event.transform.x, y: event.transform.y });
        }
        if (onZoom) {
          onZoom(event.transform.k);
        }
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    // Apply the initial centering offset exactly once. After this, d3 owns
    // the live transform (via user drag/wheel, or the imperative ref API
    // below); we only notify React of it, we never re-derive it from React
    // state.
    if (!didInitialCenter.current) {
      didInitialCenter.current = true;
      const initialZoom = zoom || 1;
      const initialPan = pan || { x: 0, y: 0 };
      svg.call(
        zoomBehavior.transform,
        d3.zoomIdentity.translate(initialPan.x + 50, initialPan.y + 50).scale(initialZoom)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Imperative API for an external toolbar (zoom %, +/-, "Markazga" /
  // center button) — these call d3 directly, they never go through the
  // pan/zoom React state, so they can't reintroduce the feedback-loop bug
  // described above.
  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => {
        if (svgRef.current && zoomBehaviorRef.current) {
          d3.select(svgRef.current).transition().duration(200).call(zoomBehaviorRef.current.scaleBy, 1.25);
        }
      },
      zoomOut: () => {
        if (svgRef.current && zoomBehaviorRef.current) {
          d3.select(svgRef.current).transition().duration(200).call(zoomBehaviorRef.current.scaleBy, 0.8);
        }
      },
      center: () => {
        if (svgRef.current && zoomBehaviorRef.current) {
          d3.select(svgRef.current)
            .transition()
            .duration(300)
            .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(50, 50).scale(1));
        }
      },
    }),
    []
  );

  return (
    <div style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{
          border: `1px solid ${TOKENS.parchmentDeep}`,
          borderRadius: "12px",
          background: `radial-gradient(circle, ${TOKENS.parchmentDeep} 1px, transparent 1px)`,
          backgroundSize: "22px 22px",
          display: "block",
          opacity: isRendering ? 0.7 : 1,
          transition: "opacity 0.2s ease",
        }}
      >
        <g ref={gRef} />
      </svg>
      {isRendering && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: TOKENS.ink60,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Daraxt chizilmoqda...
        </div>
      )}
    </div>
  );
});
