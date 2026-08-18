"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as d3 from "d3";
import { TOKENS } from "@/lib/uiTokens";

/**
 * D3-based hierarchical family tree visualization.
 *
 * Props:
 * - people: Person[]
 * - relationships: Relationship[]
 * - onSelectPerson: (personId) => void
 * - mePersonId: string | null
 * - width: number
 * - height: number
 */
export function TreeVisualization({
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
}) {
  const svgRef = useRef(null);
  const gRef = useRef(null);

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

      return {
        id: person.id,
        name: [person.first_name, person.last_name].filter(Boolean).join(" "),
        years:
          (person.birth_date ? person.birth_date : "") +
          (person.death_date ? "–" + person.death_date : ""),
        photo: person.profile_photo_url,
        spouse: spouseId ? byId[spouseId] : null,
        children,
      };
    };

    // Use first root as tree root
    const root = buildNode(roots[0].id);
    return root;
  }, [people, relationships]);

  // Render D3 tree
  useEffect(() => {
    if (!treeData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    // Clear previous
    g.selectAll("*").remove();

    // Create hierarchy
    const hierarchy = d3.hierarchy(treeData);

    // Create tree layout with calculated width/height
    const treeLayout = d3.tree().size([Math.max(width - 100, 400), Math.max(height - 100, 400)]);
    const root = treeLayout(hierarchy);

    // Create links group
    g.selectAll(".tree-link")
      .data(root.links())
      .enter()
      .append("line")
      .attr("class", "tree-link")
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y)
      .attr("stroke", TOKENS.parchmentDeep)
      .attr("stroke-width", 2)
      .attr("stroke-linecap", "round");

    // Create nodes
    const nodes = g
      .selectAll(".tree-node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "tree-node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer");

    // Add person cards
    nodes
      .append("rect")
      .attr("width", 140)
      .attr("height", 80)
      .attr("x", -70)
      .attr("y", -40)
      .attr("rx", 8)
      .attr("fill", TOKENS.card)
      .attr("stroke", TOKENS.parchmentDeep)
      .attr("stroke-width", 1)
      .style("filter", "drop-shadow(0 2px 6px rgba(30,38,33,0.08))");

    // Add photo circle
    nodes
      .append("circle")
      .attr("r", 24)
      .attr("cx", 0)
      .attr("cy", -10)
      .attr("fill", TOKENS.parchmentDeep)
      .attr("stroke", (d) => (d.data.id === mePersonId ? TOKENS.gold : TOKENS.parchmentDeep))
      .attr("stroke-width", (d) => (d.data.id === mePersonId ? 2 : 1));

    // Add text (name)
    nodes
      .append("text")
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("fill", TOKENS.ink)
      .text((d) => {
        const name = d.data.name;
        return name.length > 16 ? name.substring(0, 13) + "..." : name;
      });

    // Add text (years)
    nodes
      .append("text")
      .attr("y", 32)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", TOKENS.ink60)
      .text((d) => d.data.years);

    // Add click handlers
    nodes.on("click", (event, d) => {
      event.stopPropagation();
      onSelectPerson(d.data.id);
    });

    // Add hover effects
    nodes
      .on("mouseenter", function () {
        d3.select(this).select("rect").style("filter", "drop-shadow(0 6px 14px rgba(30,38,33,0.14))");
      })
      .on("mouseleave", function () {
        d3.select(this).select("rect").style("filter", "drop-shadow(0 2px 6px rgba(30,38,33,0.08))");
      });

  }, [treeData, width, height, mePersonId, onSelectPerson]);

  // Handle zoom/pan
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    const zoomBehavior = d3
      .zoom()
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        if (onPan) {
          onPan({ x: event.transform.x, y: event.transform.y });
        }
        if (onZoom) {
          onZoom(event.transform.k);
        }
      });

    svg.call(zoomBehavior);

    // Apply current transform
    if (pan && zoom) {
      svg.call(
        zoomBehavior.transform,
        d3.zoomIdentity.translate(pan.x + 50, pan.y + 50).scale(zoom)
      );
    }
  }, [pan, zoom, onPan, onZoom]);

  return (
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
      }}
    >
      <g ref={gRef} />
    </svg>
  );
}
