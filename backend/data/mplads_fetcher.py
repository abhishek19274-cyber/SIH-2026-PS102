"""Fetch real MPLADS data from MoSPI DigiGov portal REST API.

Endpoints reverse-engineered from https://mplads.mospi.gov.in/digigov/dashboard.html
The portal uses POST requests to /rest/PreLoginDashboardData/* endpoints.

Usage:
    from backend.data.mplads_fetcher import MpladsApiFetcher
    fetcher = MpladsApiFetcher()
    states = fetcher.get_states()
    works = fetcher.get_tile_report("Works Sanctioned")
"""
import json
import os
import ssl
import time
import urllib.request
import urllib.error

BASE_URL = "https://mplads.mospi.gov.in/rest/PreLoginDashboardData"

# Cache directory for raw API responses
CACHE_DIR = os.path.join(os.path.dirname(__file__), "mplads_raw")


def _ssl_context():
    """Permissive SSL context for government servers."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


def _post_json(endpoint, payload, timeout=120):
    """POST JSON to the MoSPI API and return parsed response."""
    url = f"{BASE_URL}/{endpoint}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json, text/javascript, */*",
        "Origin": "https://mplads.mospi.gov.in",
        "Referer": "https://mplads.mospi.gov.in/digigov/dashboard.html",
    })
    try:
        with urllib.request.urlopen(req, context=_ssl_context(), timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw)
    except urllib.error.URLError as e:
        print(f"[MpladsAPI] Network error for {endpoint}: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"[MpladsAPI] JSON decode error for {endpoint}: {e}")
        return None


class MpladsApiFetcher:
    """Fetches real MPLADS data from the MoSPI DigiGov portal."""

    # Default filter combo: "0,0,0,2" = All states, All constituencies, All MPs, Lok Sabha
    LOK_SABHA_COMBO = "0,0,0,2"
    RAJYA_SABHA_COMBO = "0,0,0,1"

    # Tile report keys (the "key" parameter for getTilesReportData)
    REPORT_KEYS = [
        "Allocated Limit",
        "Works Recommended",
        "Works Sanctioned",
        "Works Completed",
        "Expenditure on Completed and On-going Works as on Date",
    ]

    def __init__(self, cache_dir=None, use_cache=True):
        self.cache_dir = cache_dir or CACHE_DIR
        self.use_cache = use_cache
        if not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir, exist_ok=True)

    def _cache_path(self, name):
        safe_name = name.replace(" ", "_").replace("/", "_").replace(":", "_")
        return os.path.join(self.cache_dir, f"{safe_name}.json")

    def _load_cache(self, name):
        path = self._cache_path(name)
        if self.use_cache and os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                print(f"[MpladsAPI] Loaded from cache: {name}")
                return data
            except Exception:
                pass
        return None

    def _save_cache(self, name, data):
        path = self._cache_path(name)
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
            print(f"[MpladsAPI] Cached: {name}")
        except Exception as e:
            print(f"[MpladsAPI] Cache save error: {e}")

    # ── Core API methods ──────────────────────────────────────────────────

    def get_states(self):
        """Get all 36 states/UTs.
        Returns: [{"STATE_ID": "1", "STATE_NAME": "Andhra Pradesh"}, ...]
        """
        cached = self._load_cache("states")
        if cached:
            return cached

        data = _post_json("getStateData", {})
        if data:
            self._save_cache("states", data)
        return data or []

    def get_tiles(self, combo=None):
        """Get summary dashboard tiles (allocated, sanctioned, completed, expenditure).
        Returns dict with keys like 'Allocated Limit', 'Works Recommended', etc.
        """
        combo = combo or self.LOK_SABHA_COMBO
        cache_key = f"tiles_{combo}"
        cached = self._load_cache(cache_key)
        if cached:
            return cached

        data = _post_json("getTilesData", {"uname": combo})
        if data:
            self._save_cache(cache_key, data)
        return data or {}

    def get_tile_report(self, report_key, combo=None):
        """Get detailed per-work report data.

        Args:
            report_key: One of REPORT_KEYS (e.g. "Works Sanctioned")
            combo: Filter string "STATE_ID,CONSTITUENCY_ID,MP_ID,HOUSE_TYPE"

        Returns: list of work record dicts with fields like:
            STATE_NAME, CONSTITUENCY_NAME, MP_NAME, IDA NAME, ACTIVITY_NAME,
            RECOMMENDED_AMOUNT, SANCTION_AMOUNT, EXPENDITURE_AMT, WORK_STATUS,
            RECOMMENDATION_DATE, IA_NAME, HOUSE_NAME, LETTER_NO, etc.
        """
        combo = combo or self.LOK_SABHA_COMBO
        cache_key = f"report_{report_key}_{combo}"
        cached = self._load_cache(cache_key)
        if cached:
            return cached

        print(f"[MpladsAPI] Fetching report: {report_key} (combo={combo})...")
        raw = _post_json("getTilesReportData", {
            "combo": combo,
            "key": report_key,
        }, timeout=180)

        if raw is None:
            return []

        # The response is a dict with the report_key as key, value is JSON string
        # of an array of records
        records = []
        if isinstance(raw, dict):
            for key, val in raw.items():
                if isinstance(val, str):
                    try:
                        parsed = json.loads(val)
                        if isinstance(parsed, list):
                            records.extend(parsed)
                    except json.JSONDecodeError:
                        pass
                elif isinstance(val, list):
                    records.extend(val)
        elif isinstance(raw, list):
            records = raw

        if records:
            self._save_cache(cache_key, records)
            print(f"[MpladsAPI] Got {len(records)} records for '{report_key}'")
        else:
            print(f"[MpladsAPI] No records found for '{report_key}'")

        return records

    def get_constituencies(self, state_id):
        """Get constituencies for a state.
        Returns: [{"ID": "123", "CAPTION": "CONSTITUENCY_NAME"}, ...]
        """
        cache_key = f"constituencies_{state_id}"
        cached = self._load_cache(cache_key)
        if cached:
            return cached

        data = _post_json("getConstituencyData", {"id": str(state_id)})
        if data:
            self._save_cache(cache_key, data)
        return data or []

    def get_mp_names(self, state_id, house_type="2"):
        """Get MP names by state.
        house_type: "2" = Lok Sabha, "1" = Rajya Sabha
        Returns: [{"ID": "123", "CAPTION": "MP Name"}, ...]
        """
        combo = f"{state_id},{house_type},0"
        cache_key = f"mpnames_{combo}"
        cached = self._load_cache(cache_key)
        if cached:
            return cached

        data = _post_json("getMpNamesData", {"state_combo": combo})
        if data:
            self._save_cache(cache_key, data)
        return data or []

    # ── High-level convenience methods ────────────────────────────────────

    def fetch_all_works(self, report_keys=None, house="lok"):
        """Fetch all work records across multiple report types.

        Args:
            report_keys: List of report keys to fetch. Defaults to
                         ["Works Sanctioned", "Works Completed"]
            house: "lok" or "rajya"

        Returns: dict mapping report_key -> list of records
        """
        if report_keys is None:
            report_keys = ["Works Sanctioned", "Works Completed"]

        combo = self.LOK_SABHA_COMBO if house == "lok" else self.RAJYA_SABHA_COMBO
        results = {}

        for key in report_keys:
            records = self.get_tile_report(key, combo)
            results[key] = records
            time.sleep(1)  # Be respectful to the government server

        return results

    def fetch_state_wise_reports(self, state_ids=None, report_key="Works Sanctioned"):
        """Fetch reports for specific states.

        Args:
            state_ids: List of state IDs to fetch. If None, fetches top 15 states.
            report_key: Which report to fetch.

        Returns: list of all records across requested states.
        """
        if state_ids is None:
            # Top states by MPLADS activity
            state_ids = [
                "33", "29", "6", "16", "31", "26", "35",
                "17", "20", "10", "12", "13", "24", "2", "32",
            ]

        all_records = []
        for sid in state_ids:
            combo = f"{sid},0,0,2"
            records = self.get_tile_report(report_key, combo)
            all_records.extend(records)
            time.sleep(0.5)

        return all_records


# ── CLI Entry Point ───────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    fetcher = MpladsApiFetcher()

    print("=" * 60)
    print("MPLADS DigiGov Data Fetcher")
    print("=" * 60)

    # Step 1: Fetch states
    print("\n[1/3] Fetching states...")
    states = fetcher.get_states()
    if states:
        print(f"  Found {len(states)} states/UTs:")
        for s in states[:5]:
            print(f"    {s.get('STATE_ID')}: {s.get('STATE_NAME')}")
        if len(states) > 5:
            print(f"    ... and {len(states) - 5} more")
    else:
        print("  ERROR: Could not fetch states. Check network connectivity.")
        sys.exit(1)

    # Step 2: Fetch summary tiles
    print("\n[2/3] Fetching summary tiles...")
    tiles = fetcher.get_tiles()
    if tiles:
        for k, v in tiles.items():
            if isinstance(v, list) and len(v) > 0:
                print(f"  {k}: {v[0] if len(v) == 1 else v[:2]}")
            else:
                print(f"  {k}: {v}")

    # Step 3: Fetch a sample report
    print("\n[3/3] Fetching 'Works Sanctioned' report (all India)...")
    records = fetcher.get_tile_report("Works Sanctioned")
    if records:
        print(f"  Got {len(records)} work records!")
        print(f"  Sample fields: {list(records[0].keys())}")
        print(f"  Sample record:")
        for k, v in list(records[0].items())[:10]:
            print(f"    {k}: {v}")
    else:
        print("  No records returned (server may be slow, check cache later)")

    print("\n" + "=" * 60)
    print("Done! Cached data in:", fetcher.cache_dir)
