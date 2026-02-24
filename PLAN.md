# Complete Experiment Execution Plan — Publication-Grade Protocol

## Goal

Run **all 15 attack scenarios through every applicable mode** (Retrieval → Planning → Full-Pipeline), producing clean, reproducible results targeting USENIX Security / ACM CCS / IEEE S&P.

> [!IMPORTANT]
> This plan proposes wiping the old ad-hoc [results/](file:///home/px4/paper/UAV_ANTIG/results) directory and replacing it with a clean, per-scenario structure. The old data is preserved in git history.

---

## 1. Results Directory Structure

Each scenario gets its **own directory** containing sub-directories for each execution mode:

```
results/
├── S01_false_observation/
│   ├── retrieval/          ← --mock (embeddings only)
│   │   ├── run_001/metrics.json
│   │   ├── run_002/metrics.json
│   │   └── ...
│   ├── planning/           ← no --mock (LLM generates plan)
│   │   ├── run_001/metrics.json  (includes planning_loop data)
│   │   └── ...
│   └── full_pipeline/      ← --full-pipeline (drone flies)
│       ├── run_001/metrics.json  (includes full_pipeline data)
│       └── ...
├── S02_fact_corruption/
│   ├── retrieval/
│   ├── planning/
│   └── full_pipeline/
├── ...
├── S07_stealth_insert/
│   └── retrieval/          ← retrieval-only (no planning/pipeline)
├── ...
├── S15_cascade/
│   └── full_pipeline/      ← full-pipeline only (needs --keep-memory)
├── baselines/
│   ├── B0_clean/
│   ├── B1_no_seed/
│   └── ...
└── defense_sweeps/
    ├── D0_off/
    ├── D1_strict/
    └── ...
```

---

## 2. Per-Scenario Run Protocol

### Phase A: Single-Drone Scenarios (9 scenarios)

| ID | Scenario | Retrieval | Planning | Full-Pipeline | Runs | Notes |
|----|----------|:-:|:-:|:-:|:-:|---|
| S01 | False Observation | ✅ | ✅ | ✅ | 5 seeds × 1 rep = 5 | Coordinate redirect |
| S02 | Fact Corruption | ✅ | ✅ | ✅ | 5 | Semantic layer — overwrites target facts |
| S03 | Skill Hijack | ⚠️ | ✅ | ✅ | 5 | Procedural — wrong tool sequence |
| S04 | Task Misrouting | ✅ | ✅ | ✅ | 5 | Coordination — both drones same target |
| S05 | Prompt Injection | ❌ | ✅ | ✅ | 5 | Needs LLM to see injected prompts |
| S11 | Authority Spoof | ✅ | ✅ | ✅ | 5 | Supervisor path — spoofed from_agent |
| S12 | Virtual NFZ | ✅ | ✅ | ✅ | 5 | SafetyValidator NFZ check |
| S13 | Skill Arbitration | ✅ | ✅ | ✅ | 5 | Tool deprecation warnings |
| S14 | Policy Hijack | ✅ | ✅ | ✅ | 5 | False emergency → conservative policy |

### Phase B: Multi-Drone Scenarios (3 scenarios)

| ID | Scenario | Mode | Runs | Notes |
|----|----------|------|:-:|---|
| S06 | Cross-Agent Contagion | Full-Pipeline (2 drones) | 5 | Inject Agent 1 → observe Agent 2 contamination |
| S10 | Propagation Amplification | Full-Pipeline (2 drones) | 5 | Single inject → measure spread |
| S15 | Comm-State Cascade | Full-Pipeline + `--keep-memory` | 3×3 | 3 sequential missions, 3 seeds |

### Phase C: Retrieval-Only Scenarios (3 scenarios)

| ID | Scenario | Mode | Runs | Notes |
|----|----------|------|:-:|---|
| S07 | Stealth Insert | Retrieval only | 5 | Sweep inject 1,2,3 |
| S08 | Volume Flood | Retrieval only | 5 | Already done — saturation at k=3 |
| S09 | Recency Exploit | Retrieval only | 5 | Compare with B5 (β=0) |

**Total runs: ~135** (9×3modes×5 + 3×5 + 3×5 + 9 cascade)

---

## 3. Metrics Captured Per Mode

### Retrieval Mode (`--mock`)
- CCR (Context Contamination Rate)
- RIS (Retrieval Integrity Score)
- MTR (Malicious Top-k Rate)
- CASR (Cross-Agent Spread Rate)
- Amplification, Prop Depth
- Defense FPR/FNR (when defense is on)

### Planning Mode (no `--mock`)
All retrieval metrics PLUS:
- `planning_loop.plan_output` — raw LLM plan JSON
- `planning_loop.plan_has_attacker_coords` — bool
- `planning_loop.plan_has_legitimate_coords` — bool
- `planning_loop.cognitive_hijack` — bool
- Plan Divergence (tools_attack vs tools_baseline)

### Full-Pipeline Mode (`--full-pipeline`)
All planning metrics PLUS:
- `full_pipeline.final_position` — actual GPS where drone ended up
- `full_pipeline.distance_to_trap_m` — meters from attacker coords
- `full_pipeline.distance_to_nearest_legit_m` — meters from real target
- `full_pipeline.flew_to_attacker_coords` — bool (within 50m)
- `full_pipeline.flew_to_legitimate_target` — bool (within 50m)
- SVR (Safety Violation Rate) — from SafetyValidator
- ACC (Action Accuracy) — GPS distance-based
- MCR (Mission Completion Rate) — did the mission complete?

---

## 4. experiment_results.md Update Protocol

After each scenario completes all its modes, append a section like:

```markdown
### S01: Episodic False Observation

| Mode | CCR | MTR | Plan Hijack? | Drone Diverted? | Distance |
|------|-----|-----|:---:|:---:|---|
| Retrieval | 0.82 | 0.87 | — | — | — |
| Planning | 0.82 | 0.87 | 🔴 YES | — | — |
| Full-Pipeline | 0.82 | 0.87 | 🔴 YES | 🔴 YES | 528m |

**Observation:** Full cognitive hijack across all layers...
**Gap:** GAP 3 (Lifecycle Taxonomy — Ingestion stage)
**Attacker:** A3 (Compromised Scout)
```

---

## 5. Paper Chapter Mapping

| Paper Section | Data Source |
|---|---|
| Ch 6: Core Results Table (Table 3) | All 15 scenarios × Retrieval metrics |
| Ch 7: Planning-Loop Results | 12 scenarios × Planning metrics |
| Ch 8: Full-Pipeline Results | 12 scenarios × Flight telemetry |
| Ch 9: Defense Evaluation | 15 × 6 defense configs |
| Ch 10: Ablation Study | B0–B10 baselines |
| Ch 11: Cross-Comparison | vs AgentPoison, BadRAG, PoisonedRAG |

---

## 6. Execution Order

```
Step 1: Clean results/ directory (archive old data)
Step 2: Run S01 through all 3 modes (validate the pipeline works)
Step 3: Run S02–S05 single-drone scenarios
Step 4: Run S07–S09 retrieval-only scenarios
Step 5: Run S11–S14 single-drone scenarios
Step 6: Run S06, S10 multi-drone scenarios
Step 7: Run S15 cascade (3 sequential missions)
Step 8: Re-run S01,S06,S12 with defense sweeps (D0–D_all)
Step 9: Run baselines B0–B10
Step 10: Aggregate all results → populate report.tex tables
```

---

## 7. Verification Plan

- Every [metrics.json](file:///home/px4/paper/UAV_ANTIG/results/e3_rich/metrics.json) includes the `planning_loop` and [full_pipeline](file:///home/px4/paper/UAV_ANTIG/tests/test_defense.py#186-255) keys
- Every scenario's observations are appended to [experiment_results.md](file:///home/px4/paper/UAV_ANTIG/experiment_results.md)
- Attack roadmap status is updated after each phase
- [results/](file:///home/px4/paper/UAV_ANTIG/results) directory mirrors the structure above
- Final data is transferred to [report.tex](file:///home/px4/paper/UAV_ANTIG/report.tex) LaTeX tables