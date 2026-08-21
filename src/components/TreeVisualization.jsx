"use client";

import React, { useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle } from "react";
import * as d3 from "d3";
import { TOKENS } from "@/lib/uiTokens";

/**
 * D3-based hierarchical family tree visualization.
 * Optimized for families with 100+ people.
 *
 * Features:
 * - Hierarchical tree layout with spouse pairs rendered side-by-side
 * - Right-angle ("elbow") parent -> children connectors, genealogy-chart style
 * - Real profile photos (clipped circle) with initial-letter fallback
 * - Zoom/pan with mouse wheel and drag; imperative zoomIn/zoomOut/center via ref
 * - Click to select person
 * - Performance optimized for large trees
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
 * - zoomIn()
 * - zoomOut()
 * - center()
 */
const CARD_W = 140;
const CARD_H = 80;
const SPOUSE_GAP = 14;
const SPOUSE_OFFSET = CARD_W + SPOUSE_GAP; // horizontal offset of spouse card from main card

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
        const g = d3.select(gRef.current);

        // Clear previous
        g.selectAll("*").remove();
        const defs = g.append("defs");

        // Create hierarchy
        const hierarchy = d3.hierarchy(treeData);

        // Create tree layout - optimized for large trees. Extra horizontal
        // room is reserved per node so spouse cards (rendered as a second
        // card offset to the right of the primary node) don't overlap
        // neighboring branches.
        const treeLayout = d3
          .tree()
          .size([Math.max(width - 100, 400), Math.max(height - 100, 400)])
          .separation((a, b) => {
            const aWide = a.data.spouse ? 1.6 : 1;
            const bWide = b.data.spouse ? 1.6 : 1;
            return ((aWide + bWide) / 2) * (a.parent === b.parent ? 1 : 1.4);
          });
        const root = treeLayout(hierarchy);

        // Helper: x-coordinate of the *couple midpoint* for a node (used as
        // the connector anchor so lines drop from between the two spouse
        // cards rather than from the primary card alone).
        const coupleX = (d) => (d.data.spouse ? d.x + SPOUSE_OFFSET / 2 : d.x);

        // ---- Links: right-angle ("elbow") connectors, genealogy-chart style ----
        // Path: down from the parent couple-midpoint to a horizontal "bus"
        // line at the vertical midpoint between parent and child, across to
        // the child's x, then down into the child card.
        g.selectAll(".tree-link")
          .data(root.links(), (d) => `${d.source.data.id}-${d.target.data.id}`)
          .enter()
          .append("path")
          .attr("class", "tree-link")
          .attr("fill", "none")
          .attr("stroke", TOKENS.parchmentDeep)
          .attr("stroke-width", 2)
          .attr("stroke-linecap", "round")
          .attr("stroke-linejoin", "round")
          .attr("opacity", 0.6)
          .attr("d", (d) => {
            const sx = coupleX(d.source);
            const sy = d.source.y;
            const tx = d.target.x;
            const ty = d.target.y;
            const midY = sy + (ty - sy) / 2;
            return `M${sx},${sy} L${sx},${midY} L${tx},${midY} L${tx},${ty}`;
          });

        // Create nodes group
        const nodes = g
          .selectAll(".tree-node")
          .data(root.descendants(), (d) => d.data.id)
          .enter()
          .append("g")
          .attr("class", "tree-node")
          .attr("transform", (d) => `translate(${d.x},${d.y})`);

        // ---- Reusable card renderer (used for both the primary person and,
        // when present, their spouse rendered as a second card) ----
        const renderCard = (selection, personAccessor, offsetX, isMe) => {
          const card = selection
            .append("g")
            .attr("class", "person-card")
            .attr("transform", `translate(${offsetX},0)`)
            .style("cursor", "pointer");

          card
            .append("rect")
            .attr("width", CARD_W)
            .attr("height", CARD_H)
            .attr("x", -CARD_W / 2)
            .attr("y", -CARD_H / 2 + 10)
            .attr("rx", 8)
            .attr("fill", TOKENS.card)
            .attr("stroke", TOKENS.parchmentDeep)
            .attr("stroke-width", 1)
            .style("filter", "drop-shadow(0 2px 6px rgba(30,38,33,0.08))")
            .style("transition", "filter 0.2s ease");

          card.each(function (d) {
            const person = personAccessor(d);
            if (!person) return;
            const group = d3.select(this);
            const clipId = `tree-clip-${person.id}`;

            if (person.photo) {
              defs
                .append("clipPath")
                .attr("id", clipId)
                .append("circle")
                .attr("r", 24)
                .attr("cx", 0)
                .attr("cy", -10);

              group
                .append("image")
                .attr("href", person.photo)
                .attr("x", -24)
                .attr("y", -34)
                .attr("width", 48)
                .attr("height", 48)
                .attr("preserveAspectRatio", "xMidYMid slice")
                .attr("clip-path", `url(#${clipId})`);

              group
                .append("circle")
                .attr("r", 24)
                .attr("cx", 0)
                .attr("cy", -10)
                .attr("fill", "none")
                .attr("stroke", isMe(person) ? TOKENS.gold : TOKENS.parchmentDeep)
                .attr("stroke-width", isMe(person) ? 2 : 1);
            } else {
              group
                .append("circle")
                .attr("r", 24)
                .attr("cx", 0)
                .attr("cy", -10)
                .attr("fill", TOKENS.parchmentDeep)
                .attr("stroke", isMe(person) ? TOKENS.gold : TOKENS.parchmentDeep)
                .attr("stroke-width", isMe(person) ? 2 : 1);

              group
                .append("text")
                .attr("x", 0)
                .attr("y", -5)
                .attr("text-anchor", "middle")
                .attr("font-family", "Fraunces, serif")
                .attr("font-size", "16px")
                .attr("fill", TOKENS.ink60)
                .attr("pointer-events", "none")
                .text((person.name || "?").charAt(0).toUpperCase());
            }

            group
              .append("text")
              .attr("y", 15)
              .attr("text-anchor", "middle")
              .attr("font-size", "12px")
              .attr("font-weight", "600")
              .attr("fill", TOKENS.ink)
              .attr("pointer-events", "none")
              .text(() => {
                const name = person.name || "";
                return name.length > 16 ? name.substring(0, 13) + "..." : name;
              });

            group
              .append("text")
              .attr("y", 32)
              .attr("text-anchor", "middle")
              .attr("font-size", "10px")
              .attr("fill", TOKENS.ink60)
              .attr("pointer-events", "none")
              .text(person.years || "");
          });

          card
            .on("click", function (event, d) {
              event.stopPropagation();
              const person = personAccessor(d);
              if (person) onSelectPerson(person.id);
            })
            .on("mouseenter", function () {
              d3.select(this).select("rect").style("filter", "drop-shadow(0 6px 14px rgba(30,38,33,0.14))");
            })
            .on("mouseleave", function () {
              d3.select(this).select("rect").style("filter", "drop-shadow(0 2px 6px rgba(30,38,33,0.08))");
            });

          return card;
        };

        renderCard(
          nodes,
          (d) => ({ id: d.data.id, name: d.data.name, years: d.data.years, photo: d.data.photo }),
          0,
          (person) => person.id === mePersonId
        );

        // Spouse card + connecting line, only for nodes that have one
        const spouseNodes = nodes.filter((d) => !!d.data.spouse);

        spouseNodes
          .append("line")
          .attr("class", "spouse-link")
          .attr("x1", CARD_W / 2 - 14)
          .attr("y1", -10)
          .attr("x2", SPOUSE_OFFSET - (CARD_W / 2 - 14))
          .attr("y2", -10)
          .attr("stroke", TOKENS.gold)
          .attr("stroke-width", 2)
          .attr("opacity", 0.7);

        renderCard(
          spouseNodes,
          (d) => d.data.spouse,
          SPOUSE_OFFSET,
          (person) => person.id === mePersonId
        );

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
    // the live transform (via user drag/wheel); we only notify React of it,
    // we never re-derive it from React state.
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

  // Imperative API for the parent toolbar (zoom in / out / center). These
  // call d3 directly and never touch the pan/zoom React state that the
  // mount-effect above watches, so they can't reintroduce the earlier
  // pan-drift feedback loop.
  useImperativeHandle(ref, () => ({
    zoomIn() {
      if (!svgRef.current || !zoomBehaviorRef.current) return;
      d3.select(svgRef.current).transition().duration(200).call(zoomBehaviorRef.current.scaleBy, 1.25);
    },
    zoomOut() {
      if (!svgRef.current || !zoomBehaviorRef.current) return;
      d3.select(svgRef.current).transition().duration(200).call(zoomBehaviorRef.current.scaleBy, 1 / 1.25);
    },
    center() {
      if (!svgRef.current || !zoomBehaviorRef.current) return;
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(50, 50).scale(1));
    },
  }));

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
