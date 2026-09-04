"""Heterogeneous vendor-project graph + meta-path cartel detector.

Demo implementation uses NetworkX-style adjacency in pure Python so the
prototype runs without PyTorch Geometric. Attention weights are heuristic
but match the blueprint's meta-paths:
  Vendor --shares_bank--> Vendor
  Vendor --shares_address--> Vendor
  Vendor --bids_on--> Project <--bids_on-- Vendor
"""
from collections import defaultdict
from backend.services.explainer import ExplainerService


class GraphEngine:
    def __init__(self):
        self.explainer = ExplainerService

    def build(self, vendors, transactions, projects):
        vendors_by_id = {v.vendor_id: v for v in vendors}
        bank_groups = defaultdict(list)
        addr_groups = defaultdict(list)
        pan_groups = defaultdict(list)
        for v in vendors:
            bank_groups[v.bank_account_hash].append(v.vendor_id)
            addr_groups[(v.registered_address or "").strip().lower()].append(v.vendor_id)
            pan_groups[v.pan_hash].append(v.vendor_id)

        shares_bank = defaultdict(set)
        shares_addr = defaultdict(set)
        shares_pan = defaultdict(set)
        for group in bank_groups.values():
            if len(group) > 1:
                for i in group:
                    shares_bank[i].update(x for x in group if x != i)
        for group in addr_groups.values():
            if len(group) > 1:
                for i in group:
                    shares_addr[i].update(x for x in group if x != i)
        for group in pan_groups.values():
            if len(group) > 1:
                for i in group:
                    shares_pan[i].update(x for x in group if x != i)

        vendor_projects = defaultdict(set)
        project_vendors = defaultdict(set)
        for t in transactions:
            vendor_projects[t.vendor_id].add(t.project_id)
            project_vendors[t.project_id].add(t.vendor_id)

        co_bid = defaultdict(set)
        for vids in project_vendors.values():
            vids = list(vids)
            for i, a in enumerate(vids):
                for b in vids[i + 1:]:
                    co_bid[a].add(b)
                    co_bid[b].add(a)

        return {
            "vendors_by_id": vendors_by_id,
            "shares_bank": shares_bank,
            "shares_addr": shares_addr,
            "shares_pan": shares_pan,
            "vendor_projects": vendor_projects,
            "project_vendors": project_vendors,
            "co_bid": co_bid,
        }

    def score_vendor(self, vendor_id, graph):
        v = graph["vendors_by_id"].get(vendor_id)
        if not v:
            return None
        bank = graph["shares_bank"].get(vendor_id, set())
        addr = graph["shares_addr"].get(vendor_id, set())
        pan = graph["shares_pan"].get(vendor_id, set())
        cobid = graph["co_bid"].get(vendor_id, set())

        contribs = []
        signals = []
        if bank:
            names = [graph["vendors_by_id"][i].business_name for i in bank if i in graph["vendors_by_id"]]
            contribs.append({
                "feature": "shares_bank_hash",
                "impact": min(0.45, 0.22 * len(bank)),
                "description": f"Shares hashed bank account with {', '.join(names)}.",
            })
            signals.append(f"shared bank hash with {', '.join(names)}")
        if addr:
            names = [graph["vendors_by_id"][i].business_name for i in addr if i in graph["vendors_by_id"]]
            contribs.append({
                "feature": "shares_registered_address",
                "impact": min(0.22, 0.12 * len(addr)),
                "description": f"Registered at the same address as {', '.join(names)}.",
            })
            signals.append(f"same address as {', '.join(names)}")
        if pan:
            names = [graph["vendors_by_id"][i].business_name for i in pan if i in graph["vendors_by_id"]]
            contribs.append({
                "feature": "shares_pan_hash",
                "impact": min(0.30, 0.18 * len(pan)),
                "description": f"Shares PAN hash with {', '.join(names)}.",
            })
            signals.append(f"shared PAN with {', '.join(names)}")

        # circular bidding: co-bid exclusively with bank-linked vendors
        exclusive = cobid and cobid.issubset(bank.union(addr))
        if exclusive and cobid:
            contribs.append({
                "feature": "circular_co_bidding_ring",
                "impact": 0.25,
                "description": "Co-bids only with vendors already linked by bank/address — classic cover-bid pattern.",
            })
            signals.append("circular co-bidding with linked entities")

        shap = self.explainer.generate_shap_waterfall(0.05, contribs)
        score = shap["final_score"]
        cluster = None
        if bank or addr:
            members = sorted({vendor_id} | bank | addr)
            cluster = "RING-" + "-".join(str(m) for m in members)
        narrative = None
        if score >= 0.40:
            narrative = self.explainer.format_narrative(
                "Vendor cartel / bid-rigging ring",
                v.business_name,
                signals,
            )
        return {
            "vendor_id": vendor_id,
            "business_name": v.business_name,
            "lifetime_risk_score": score,
            "cartel_group_id": cluster,
            "linked_bank": list(bank),
            "linked_address": list(addr),
            "linked_pan": list(pan),
            "co_bidders": list(cobid),
            "shap": shap,
            "narrative": narrative,
            "signals": signals,
        }

    def network_payload(self, vendors, transactions, projects):
        graph = self.build(vendors, transactions, projects)
        nodes = []
        links = []
        seen_edges = set()
        scores = {}
        for v in vendors:
            scored = self.score_vendor(v.vendor_id, graph)
            scores[v.vendor_id] = scored
            nodes.append({
                "id": f"v{v.vendor_id}",
                "kind": "vendor",
                "label": v.business_name,
                "risk": scored["lifetime_risk_score"] if scored else 0,
                "cartel_group_id": scored["cartel_group_id"] if scored else None,
                "value": sum(t.invoice_amount for t in transactions if t.vendor_id == v.vendor_id),
            })
        for p in projects:
            nodes.append({
                "id": f"p{p.project_id}",
                "kind": "project",
                "label": p.work_description[:48],
                "risk": p.composite_risk_score or 0,
                "constituency": p.constituency,
            })

        def add_edge(a, b, kind):
            key = tuple(sorted([a, b]) + [kind])
            if key in seen_edges:
                return
            seen_edges.add(key)
            links.append({"source": a, "target": b, "kind": kind})

        for vid, others in graph["shares_bank"].items():
            for o in others:
                add_edge(f"v{vid}", f"v{o}", "shares_bank")
        for vid, others in graph["shares_addr"].items():
            for o in others:
                add_edge(f"v{vid}", f"v{o}", "shares_address")
        for t in transactions:
            add_edge(f"v{t.vendor_id}", f"p{t.project_id}", "paid_on")
        return {"nodes": nodes, "links": links, "scores": {k: v for k, v in scores.items() if v}}
