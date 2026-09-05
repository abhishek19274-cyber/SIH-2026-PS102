import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { vendorEdges, vendors } from "../../data/mockData";
import { useApp } from "../../context/AppContext";
import { riskTone } from "../../utils/formatters";

const riskColors = {
  critical: "#DC2626",
  elevated: "#D97706",
  normal: "#16A34A",
};

const strokeStyles = {
  bank: { stroke: "#2563EB", dash: "none", width: 2, label: "Shared Bank Account" },
  shares_bank: { stroke: "#2563EB", dash: "none", width: 2, label: "Shared Bank Account" },
  address: { stroke: "#D97706", dash: "5,4", width: 1.5, label: "Shared Registered Address" },
  shares_address: { stroke: "#D97706", dash: "5,4", width: 1.5, label: "Shared Registered Address" },
  cobid: { stroke: "#DC2626", dash: "2,3", width: 2, label: "Co-bidding Collusion" },
  paid_on: { stroke: "#7C3AED", dash: "4,4", width: 1.5, label: "Shared Transaction Chain" },
};

export function VendorNetworkGraph({ networkData, onSelectVendor }) {
  const svgRef = useRef(null);
  const zoomBehaviorRef = useRef(null);
  const zoomGroupRef = useRef(null);
  const simulationRef = useRef(null);
  const { selectedVendorId, setSelectedVendorId } = useApp();
  const [hoveredNode, setHoveredNode] = useState(null);
  const hoveredNodeRef = useRef(null);

  // Maintain 100% of nodes and links — zero slicing, zero sampling, zero limits
  const graphData = useMemo(() => {
    if (networkData?.nodes?.length) {
      return {
        nodes: networkData.nodes.map((n) => ({
          ...n,
          id: String(n.id),
          kind: n.kind || (String(n.id).startsWith("p") ? "project" : "vendor"),
          name: n.name || n.label || String(n.id),
          contractValueCr: n.value
            ? Number((n.value / 10000000).toFixed(2))
            : n.contractValueCr || 0,
          risk: n.risk !== undefined ? n.risk : 50,
        })),
        links: (networkData.links || []).map((l) => ({
          source: typeof l.source === "object" ? String(l.source.id) : String(l.source),
          target: typeof l.target === "object" ? String(l.target.id) : String(l.target),
          kind: l.kind || l.type || "bank",
        })),
      };
    }
    return {
      nodes: vendors.map((v) => ({ ...v, kind: "vendor" })),
      links: vendorEdges.map((e) => ({ ...e })),
    };
  }, [networkData]);

  // Zoom In Handler
  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(280)
      .call(zoomBehaviorRef.current.scaleBy, 1.35);
  }, []);

  // Zoom Out Handler
  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(280)
      .call(zoomBehaviorRef.current.scaleBy, 0.72);
  }, []);

  // Fit View / Center Topology Handler
  const handleFitView = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current || !graphData.nodes?.length) return;
    const svg = d3.select(svgRef.current);
    const validNodes = graphData.nodes.filter((d) => d.x != null && d.y != null);
    if (!validNodes.length) {
      svg.transition().duration(400).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
      return;
    }
    const width = 800;
    const height = 480;
    const xExtent = d3.extent(validNodes, (d) => d.x);
    const yExtent = d3.extent(validNodes, (d) => d.y);
    const dx = xExtent[1] - xExtent[0] || 1;
    const dy = yExtent[1] - yExtent[0] || 1;
    const xCenter = (xExtent[0] + xExtent[1]) / 2;
    const yCenter = (yExtent[0] + yExtent[1]) / 2;
    const padding = 70;
    const scale = Math.min(
      1.1,
      Math.max(0.2, 0.85 / Math.max((dx + padding) / width, (dy + padding) / height))
    );
    const translate = [width / 2 - scale * xCenter, height / 2 - scale * yCenter];

    svg.transition()
      .duration(500)
      .call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );
  }, [graphData.nodes]);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 480;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // Zoomable Root Container Group
    const container = svg.append("g").attr("class", "graph-container");
    zoomGroupRef.current = container;

    // Hull group for high-risk cluster detection
    const hullGroup = container.append("g").attr("class", "hulls");

    // Link lines group
    const linkGroup = container.append("g").attr("class", "links");

    // Node group
    const nodeGroup = container.append("g").attr("class", "nodes");

    // Force simulation configured to naturally layout complete node topology
    const simulation = d3
      .forceSimulation(graphData.nodes)
      .force(
        "link",
        d3
          .forceLink(graphData.links)
          .id((d) => d.id)
          .distance((d) => (d.kind === "paid_on" ? 75 : 130))
      )
      .force("charge", d3.forceManyBody().strength(-240))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3
          .forceCollide()
          .radius((d) =>
            d.kind === "project" ? 12 : 20 + Math.min(12, (d.contractValueCr || 0) / 2)
          )
      );

    simulationRef.current = simulation;

    // Render Links
    const link = linkGroup
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("stroke", (d) => strokeStyles[d.kind]?.stroke || "#94A3B8")
      .attr("stroke-width", (d) => strokeStyles[d.kind]?.width || 1.5)
      .attr("stroke-dasharray", (d) => strokeStyles[d.kind]?.dash || "none")
      .attr("opacity", 0.75);

    // Node Drag Behavior (seamlessly co-exists with canvas zoom/pan)
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

    // Render Nodes
    const node = nodeGroup
      .selectAll("g")
      .data(graphData.nodes)
      .join("g")
      .call(drag)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        if (d.kind === "vendor" || String(d.id).startsWith("v")) {
          setSelectedVendorId(d.id);
          if (onSelectVendor) onSelectVendor(d);
        } else if (d.kind === "project" || String(d.id).startsWith("p")) {
          // If project node is clicked, resolve connected vendor
          const linkedEdge = graphData.links.find(
            (l) =>
              String(l.target?.id || l.target) === String(d.id) &&
              String(l.source?.id || l.source).startsWith("v")
          );
          if (linkedEdge) {
            const vId = String(linkedEdge.source?.id || linkedEdge.source);
            setSelectedVendorId(vId);
            if (onSelectVendor) onSelectVendor(d, vId);
          }
        }
      })
      .on("mouseenter", (event, d) => {
        hoveredNodeRef.current = d;
        setHoveredNode(d);
      })
      .on("mouseleave", () => {
        hoveredNodeRef.current = null;
        setHoveredNode(null);
      });

    // Node circles: Distinct presentation for Vendors vs Projects
    node
      .append("circle")
      .attr("r", (d) =>
        d.kind === "project" ? 8 : 14 + Math.min(12, (d.contractValueCr || 0) / 2.5)
      )
      .attr("fill", (d) =>
        d.kind === "project" ? "#64748B" : riskColors[riskTone(d.risk)] || "#2563EB"
      )
      .attr("stroke", (d) =>
        String(d.id) === String(selectedVendorId)
          ? "#1D4ED8"
          : d.kind === "project"
          ? "#CBD5E1"
          : "#FFFFFF"
      )
      .attr("stroke-width", (d) => (String(d.id) === String(selectedVendorId) ? 3.5 : 2));

    // Primary Text Labels with white halo
    const nodeLabels = node
      .append("text")
      .text((d) =>
        d.kind === "project"
          ? d.name.slice(0, 16) + (d.name.length > 16 ? "…" : "")
          : d.name.split(" ")[0]
      )
      .attr("text-anchor", "middle")
      .attr("dy", (d) =>
        d.kind === "project"
          ? 18
          : 26 + Math.min(12, (d.contractValueCr || 0) / 2.5)
      )
      .attr("fill", "#17202A")
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", "3")
      .attr("paint-order", "stroke fill")
      .attr("font-size", (d) => (d.kind === "project" ? "9px" : "11px"))
      .attr("font-weight", "600");

    // Risk Subtext for Vendors
    const nodeRiskSubtext = node
      .filter((d) => d.kind !== "project")
      .append("text")
      .text((d) => `Risk ${d.risk}`)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => 38 + Math.min(12, (d.contractValueCr || 0) / 2.5))
      .attr("fill", (d) => riskColors[riskTone(d.risk)] || "#5B6470")
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", "2.5")
      .attr("paint-order", "stroke fill")
      .attr("font-size", "9px")
      .attr("font-family", "monospace")
      .attr("font-weight", "700");

    // Dynamic Label Density Filter Function based on Zoom Scale k
    const applyLabelDensity = (k) => {
      nodeLabels.style("display", (d) => {
        // Selected node and hovered node always show labels
        if (String(d.id) === String(selectedVendorId) || d === hoveredNodeRef.current) return "block";
        // Deep zoomed-out: suppress clutter, show high-risk entities
        if (k < 0.65) return d.risk >= 70 ? "block" : "none";
        // Medium overview zoom: show all vendor nodes
        if (k < 1.15) return d.kind === "vendor" ? "block" : "none";
        // Zoomed in: reveal all labels including linked projects
        return "block";
      });

      nodeRiskSubtext.style("display", (d) => {
        if (String(d.id) === String(selectedVendorId) || d === hoveredNodeRef.current) return "block";
        if (k < 0.75) return d.risk >= 70 ? "block" : "none";
        if (k < 1.25) return d.kind === "vendor" ? "block" : "none";
        return "block";
      });
    };

    // D3 Zoom & Pan Behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.15, 4.5])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
        applyLabelDensity(event.transform.k);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Simulation tick handler
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);

      // Cluster hull calculation for high-risk co-bidding ring
      const highRiskNodes = graphData.nodes.filter(
        (n) => n.risk >= 60 && n.x != null && n.y != null
      );
      if (highRiskNodes.length >= 3) {
        const points = highRiskNodes.map((n) => [n.x, n.y]);
        const hull = d3.polygonHull(points);
        if (hull) {
          hullGroup
            .selectAll("path")
            .data([hull])
            .join("path")
            .attr("d", (d) => `M${d.join("L")}Z`)
            .attr("fill", "rgba(220, 38, 38, 0.06)")
            .attr("stroke", "rgba(220, 38, 38, 0.45)")
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "4,4");
        }
      }
    });

    // Apply initial density for default scale 1.0
    applyLabelDensity(1.0);

    return () => {
      simulation.stop();
    };
  }, [graphData, selectedVendorId, setSelectedVendorId, onSelectVendor]);

  return (
    <div className="relative overflow-hidden rounded border border-[#D9DDE3] bg-white shadow-xs">
      {/* Floating Graph Navigation Controls (Zoom In, Zoom Out, Fit View) */}
      <div className="absolute top-3 right-3 flex items-center gap-1 rounded border border-[#D9DDE3] bg-white p-1 shadow-xs z-10">
        <button
          onClick={handleZoomIn}
          className="flex h-7 w-7 items-center justify-center rounded text-[#5B6470] hover:bg-[#F0F2F5] hover:text-[#17202A] transition-colors"
          title="Zoom In (or mouse-wheel up)"
          aria-label="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="flex h-7 w-7 items-center justify-center rounded text-[#5B6470] hover:bg-[#F0F2F5] hover:text-[#17202A] transition-colors"
          title="Zoom Out (or mouse-wheel down)"
          aria-label="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={handleFitView}
          className="flex h-7 px-2 items-center justify-center gap-1 rounded text-[#5B6470] hover:bg-[#F0F2F5] hover:text-[#17202A] transition-colors text-[11px] font-semibold"
          title="Fit View / Center All Nodes"
          aria-label="Fit View"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Fit</span>
        </button>
      </div>

      {/* SVG Container with pan cursor */}
      <svg
        ref={svgRef}
        className="h-[460px] w-full cursor-grab active:cursor-grabbing bg-[#FAFAFA]"
        role="img"
        aria-label="Interactive force-directed D3 vendor relationship network"
      />

      {/* Graph Visual Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D9DDE3] bg-[#F8FAFC] px-3.5 py-2 text-xs text-[#5B6470]">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-blue-600" />
            <span className="text-[10px]">Solid: Shared Bank</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t border-dashed border-amber-600" />
            <span className="text-[10px]">Dashed: Shared Address</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t border-dotted border-red-600" />
            <span className="text-[10px]">Dotted: Co-bidding Collusion</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t border-dashed border-purple-600" />
            <span className="text-[10px]">Purple: Project Disbursement</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          {hoveredNode ? (
            <span className="text-blue-700 font-semibold font-mono">
              Focused: {hoveredNode.name} (Risk: {hoveredNode.risk})
            </span>
          ) : (
            <span className="text-red-700 font-mono font-medium">Cartel Ring (Convex Hull)</span>
          )}
          <span className="text-[#7A838E] font-mono hidden sm:inline">
            Scroll: Zoom · Drag: Pan
          </span>
        </div>
      </div>
    </div>
  );
}
