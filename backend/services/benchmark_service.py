class BenchmarkService:
    """Mock MoSPI eSankhyiki regional construction cost benchmarks."""

    REGIONAL_BENCHMARKS = {
        "structural_steel": {"unit": "kg", "base_cost": 65.0, "tolerance_pct": 15.0},
        "cement_rcc_m20": {"unit": "cu.m", "base_cost": 4800.0, "tolerance_pct": 12.0},
        "solar_street_light_12w": {"unit": "unit", "base_cost": 18500.0, "tolerance_pct": 10.0},
        "bituminous_road_work": {"unit": "sq.m", "base_cost": 850.0, "tolerance_pct": 15.0},
        "interlocking_paver_blocks": {"unit": "sq.m", "base_cost": 620.0, "tolerance_pct": 10.0},
        "borewell_drilling_150mm": {"unit": "meter", "base_cost": 1200.0, "tolerance_pct": 15.0},
        "submersible_pump_3hp": {"unit": "unit", "base_cost": 35000.0, "tolerance_pct": 12.0},
        "drinking_water_purifier_ro": {"unit": "unit", "base_cost": 145000.0, "tolerance_pct": 10.0},
        "school_dual_desk": {"unit": "unit", "base_cost": 4200.0, "tolerance_pct": 10.0},
        "sanitary_napkin_incinerator": {"unit": "unit", "base_cost": 28000.0, "tolerance_pct": 15.0},
    }

    STATE_COST_MULTIPLIERS = {
        "Maharashtra": 1.05,
        "Uttar Pradesh": 0.95,
        "Bihar": 0.92,
        "Karnataka": 1.04,
        "Tamil Nadu": 1.02,
        "Delhi": 1.10,
        "Rajasthan": 0.98,
        "West Bengal": 0.96,
        "Assam": 1.08,
        "Kerala": 1.07,
        "Madhya Pradesh": 0.94,
        "Gujarat": 1.03,
    }

    @classmethod
    def _match_key(cls, material_category: str):
        key = (material_category or "").lower().strip().replace(" ", "_").replace("-", "_")
        if key in cls.REGIONAL_BENCHMARKS:
            return key
        for k in cls.REGIONAL_BENCHMARKS:
            if k in key or key in k:
                return k
        aliases = {
            "rcc": "cement_rcc_m20",
            "steel": "structural_steel",
            "solar": "solar_street_light_12w",
            "road": "bituminous_road_work",
            "paver": "interlocking_paver_blocks",
            "borewell": "borewell_drilling_150mm",
            "pump": "submersible_pump_3hp",
            "purifier": "drinking_water_purifier_ro",
            "desk": "school_dual_desk",
            "incinerator": "sanitary_napkin_incinerator",
        }
        for token, mapped in aliases.items():
            if token in key:
                return mapped
        return None

    @classmethod
    def get_benchmark(cls, material_category: str, state: str = "Maharashtra"):
        matched = cls._match_key(material_category)
        if not matched:
            return {
                "material": material_category,
                "unit": "item",
                "benchmark_unit_cost": 10000.0,
                "upper_threshold": 11500.0,
                "tolerance_pct": 15.0,
                "state": state,
                "source": "MoSPI eSankhyiki Q2 National Index (generic)",
            }
        base = cls.REGIONAL_BENCHMARKS[matched]
        multiplier = cls.STATE_COST_MULTIPLIERS.get(state, 1.0)
        adj = base["base_cost"] * multiplier
        upper = adj * (1 + base["tolerance_pct"] / 100.0)
        return {
            "material": matched,
            "unit": base["unit"],
            "benchmark_unit_cost": round(adj, 2),
            "upper_threshold": round(upper, 2),
            "tolerance_pct": base["tolerance_pct"],
            "state": state,
            "source": f"MoSPI eSankhyiki {state} Regional WPI Adjusted Benchmark",
        }
