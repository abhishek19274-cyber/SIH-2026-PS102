import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { vendorEdges, vendors } from "../../data/mockData";
import { useApp } from "../../context/AppContext";
import { riskTone } from "../../utils/formatters";

const riskColors = {
  critical: "#f43f5e",
  elevated: "#f59e0b",
  normal: "#10b981",
};

const strokeStyles = {
  bank: { stroke: "#38bdf8", dash: "none", width: 2.2, label: "Shared Bank Account" },
  shares_bank: { stroke: "#38bdf8", dash: "none", width: 2.2, label: "Shared Bank Account" },
  address: { stroke: "#f59e0b", dash: "6,4", width: 1.8, label: "Shared Registered Address" },
  shares_address: { stroke: "#f59e0b", dash: "6,4", width: 1.8, label: "Shared Registered Address" },
  cobid: { stroke: "#f43f5e", dash: "2,3", width: 1.8, label: "Co-bidding Collusion" },
  paid_on: { stroke: "#a855f7", dash: "4,4", width: 1.8, label: "Shared Transaction Chain" },
};

export function VendorNetworkGraph({ networkData, onSelectVendor }) {
  const svgRef = useRef(null);
  const { selectedVendorId, setSelectedVendorId } = useApp();
  const [hoveredNode, setHoveredNode] = useState(null);

  const graphData = useMemo(() => {
    if (networkData?.nodes?.length) {
      return {
        nodes: networkData.nodes.map((n) => ({
          ...n,
          id: String(n.id),
          name: n.name || n.label || String(n.id),
          contractValueCr: n.value ? Number((n.value / 10000000).toFixed(1)) : (n.contractValueCr || 1.2),
          risk: n.risk || 50,
        })),
        links: (networkData.links || []).map((l) => ({
          source: typeof l.source === "object" ? String(l.source.id) : String(l.source),
          target: typeof l.target === "object" ? String(l.target.id) : String(l.target),
          kind: l.kind || l.type || "bank",
        })),
      };
    }
    return {
      nodes: vendors.map((v) => ({ ...v })),
      links: vendorEdges.map((e) => ({ ...e })),
    };
  }, [networkData]);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 760;
    const height = 440;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // Glow filter definition
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "3.5")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Force simulation
    const simulation = d3
      .forceSimulation(graphData.nodes)
      .force(
        "link",
        d3
          .forceLink(graphData.links)
          .id((d) => d.id)
          .distance(120)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d) => 16 + d.contractValueCr / 3));

    // Hull group for high-risk cluster detection
    const hullGroup = svg.append("g").attr("class", "hulls");

    // Link lines
    const link = svg
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("stroke", (d) => strokeStyles[d.kind]?.stroke || "rgba(226,232,240,0.3)")
      .attr("stroke-width", (d) => strokeStyles[d.kind]?.width || 1.5)
      .attr("stroke-dasharray", (d) => strokeStyles[d.kind]?.dash || "none")
      .attr("opacity", 0.7);

    // Node group with dragging
    const nodeGroup = svg.append("g").attr("class", "nodes");

    const drag = d3
      .drag()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    const node = nodeGroup
      .selectAll("g")
      .data(graphData.nodes)
      .join("g")
      .call(drag)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedVendorId(d.id);
        if (onSelectVendor) onSelectVendor(d);
      })
      .on("mouseenter", (event, d) => setHoveredNode(d))
      .on("mouseleave", () => setHoveredNode(null));

    // Node circle
    node
      .append("circle")
      .attr("r", (d) => 12 + d.contractValueCr / 3.2)
      .attr("fill", (d) => riskColors[riskTone(d.risk)])
      .attr("stroke", (d) => (String(d.id) === String(selectedVendorId) ? "#ffffff" : "rgba(255,255,255,0.35)"))
      .attr("stroke-width", (d) => (String(d.id) === String(selectedVendorId) ? 3.5 : 1.5))
      .attr("filter", (d) => (d.risk >= 70 ? "url(#glow)" : null));

    // Node text label
    node
      .append("text")
      .text((d) => d.name.split(" ")[0])
      .attr("text-anchor", "middle")
      .attr("dy", (d) => 24 + d.contractValueCr / 3.2)
      .attr("fill", "#f8fafc")
      .attr("font-size", "11px")
      .attr("font-weight", "600");

    // Node risk subtext
    node
      .append("text")
      .text((d) => `Risk ${d.risk}`)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => 36 + d.contractValueCr / 3.2)
      .attr("fill", (d) => riskColors[riskTone(d.risk)])
      .attr("font-size", "9px")
      .attr("font-mono", "true")
      .attr("font-weight", "700");

    // Simulation tick handler
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);

      // Cluster hull calculation for high-risk co-bidding ring (Aarav, Narmada, Ganga Jal Nigam, Satpura)
      const highRiskNodes = graphData.nodes.filter((n) => n.risk >= 60);
      if (highRiskNodes.length >= 3) {
        const points = highRiskNodes.map((n) => [n.x, n.y]);
        const hull = d3.polygonHull(points);
        if (hull) {
          hullGroup
            .selectAll("path")
            .data([hull])
            .join("path")
            .attr("d", (d) => `M${d.join("L")}Z`)
            .attr("fill", "rgba(244, 63, 94, 0.08)")
            .attr("stroke", "rgba(244, 63, 94, 0.35)")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4,4");
        }
      }
    });

    return () => {
      simulation.stop();
    };
  }, [graphData, selectedVendorId, setSelectedVendorId, onSelectVendor]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0a0f1d] shadow-2xl">
      {/* SVG Container */}
      <svg
        ref={svgRef}
        className="h-[420px] w-full cursor-grab active:cursor-grabbing"
        role="img"
        aria-label="Interactive force-directed D3 vendor relationship network"
      />

      {/* Graph Visual Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 bg-slate-950/70 px-4 py-2.5 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-5 bg-sky-400" />
            <span className="text-[11px]">Solid = Shared Bank Account</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-5 border-t border-dashed border-amber-400" />
            <span className="text-[11px]">Dashed = Shared Reg. Address</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-5 border-t border-dotted border-rose-400" />
            <span className="text-[11px]">Dotted = Co-bidding Collusion</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          {hoveredNode ? (
            <span className="text-sky-300 font-semibold animate-pulse">
              Focused: {hoveredNode.name} (Risk: {hoveredNode.risk})
            </span>
          ) : (
            <span className="text-rose-400 font-medium">🔴 High Risk Cluster (Hull)</span>
          )}
          <span className="text-slate-500">Node radius = Contract Value (₹ Cr)</span>
        </div>
      </div>
    </div>
  );
}
