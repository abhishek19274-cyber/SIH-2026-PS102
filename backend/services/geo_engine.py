"""Lightweight H3-style hexagonal indexing (no h3-py required).

Resolution 9 ≈ 174 m edge. We encode a coarse cell as a hex string of
quantized lat/lng so neighbour lookups stay cheap on SQLite.
"""
import math
from collections import defaultdict

# Approximate earth radius
R_KM = 6371.0


def _quantize(lat, lng, cell_deg=0.0015):
    """~167 m cells at the equator. cell_deg=0.0015 ≈ 167 m."""
    qlat = round(lat / cell_deg)
    qlng = round(lng / cell_deg)
    return qlat, qlng, cell_deg


def latlng_to_h3(lat, lng, resolution=9):
    qlat, qlng, cell_deg = _quantize(lat, lng)
    return f"h{resolution}_{qlat}_{qlng}"


def h3_neighbours(h3_index, k=1):
    parts = h3_index.split("_")
    if len(parts) != 3:
        return [h3_index]
    res, qlat, qlng = parts[0], int(parts[1]), int(parts[2])
    cells = []
    for dy in range(-k, k + 1):
        for dx in range(-k, k + 1):
            cells.append(f"{res}_{qlat + dy}_{qlng + dx}")
    return cells


def haversine_m(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R_KM * 1000 * math.asin(math.sqrt(a))


# Mock PM GatiShakti restricted / eco-sensitive hex cells used in the demo
RESTRICTED_ZONES = {
    "h9_13933_52600": "Eco-Sensitive Zone (Tadoba buffer, Wardha)",
    "h9_13934_52600": "Eco-Sensitive Zone (Tadoba buffer, Wardha)",
    "h9_19067_51800": "Wildlife sanctuary corridor (Assam)",
}


class GeoEngine:
    def index_project(self, lat, lng, resolution=9):
        return latlng_to_h3(lat, lng, resolution)

    def zone_conflict(self, h3_index):
        return RESTRICTED_ZONES.get(h3_index)

    def find_duplicates(self, projects, lat, lng, category, radius_m=80, exclude_id=None):
        """Return existing works of the same category within radius_m."""
        h3 = latlng_to_h3(lat, lng)
        neighbour_set = set(h3_neighbours(h3, k=1))
        hits = []
        for p in projects:
            if exclude_id and p.project_id == exclude_id:
                continue
            if (p.h3_index or "") not in neighbour_set and p.h3_index != h3:
                if abs((p.latitude or 0) - lat) > 0.01 or abs((p.longitude or 0) - lng) > 0.01:
                    continue
            dist = haversine_m(lat, lng, p.latitude, p.longitude)
            if dist <= radius_m and (p.work_category or "").lower() == (category or "").lower():
                hits.append({
                    "project_id": p.project_id,
                    "work_description": p.work_description,
                    "description": p.work_description,
                    "distance_m": round(dist, 1),
                    "h3_index": p.h3_index,
                    "implementing_agency": p.implementing_agency,
                    "constituency": p.constituency,
                    "work_category": p.work_category,
                    "scheme_note": "Possible double-funding / ghost asset at overlapping GPS.",
                })
        hits.sort(key=lambda x: x["distance_m"])
        return hits

    def verify_location(self, projects, lat, lng, category, radius_m=120, exclude_id=None):
        h3 = latlng_to_h3(lat, lng)
        zone = self.zone_conflict(h3)
        duplicates = self.find_duplicates(projects, lat, lng, category, radius_m, exclude_id)
        return {
            "h3_index": h3,
            "zone_conflict": zone,
            "duplicates": duplicates,
            "clear": not zone and not duplicates,
        }

    def cluster_by_h3(self, projects):
        buckets = defaultdict(list)
        for p in projects:
            buckets[p.h3_index or "unknown"].append({
                "project_id": p.project_id,
                "work_description": p.work_description,
                "constituency": p.constituency,
                "state": p.state,
                "composite_risk_score": p.composite_risk_score,
                "latitude": p.latitude,
                "longitude": p.longitude,
            })
        return [
            {
                "h3_index": cell,
                "count": len(items),
                "avg_risk": round(sum(i["composite_risk_score"] or 0 for i in items) / len(items), 3),
                "projects": items,
            }
            for cell, items in buckets.items()
        ]
