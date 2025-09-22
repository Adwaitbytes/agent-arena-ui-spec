# Agent Battle Arena — Technical Architecture and Prize-Track Integration (NEAR-first)

This document captures the product and technical plan to build “Agent‑trained 2D Multiplayer Arenas” with on‑chain integrations (NEAR Intents + Shade Agents, OpenServ, Randamu VRF, Golem DB, Filecoin) and Pinata IPFS for per‑round records. It includes data models, APIs, gameplay mapping, monetization, security, and delivery milestones.

---

## 1) Core Concept and Game Loop
- Players train Agents via prompting + memory snippets.
- Matches happen in 2D arenas (boxing, cricket, carrom). A Super Judge Agent asks a round question; player agents answer; answers are pinned to IPFS.
- A multi‑agent judge evaluates answers → normalized score S ∈ [0,1]. S maps to simulation intensity (e.g., punch force, shot timing/placement).
- Round results accumulate; match finalization writes pointers and outcomes to decentralized data.

Loop per round:
1) Question → Agent answers → Pin JSON to IPFS (Pinata) with CID
2) Judge pipeline scores answers → scores + rationale JSON → IPFS
3) Game simulation uses S (and VRF noise) to animate outcomes
4) Save round record pointers; next round or finish

Why it’s sticky: real skill expression through prompt‑craft + visceral, watchable 2D gameplay.

---

## 2) Engine and Netcode
- 2D rendering: Phaser or PixiJS (client). Authoritative server simulation for outcomes.
- Networking: WebSockets initially. Client prediction + occasional rollback for responsiveness.
- State sync: inputs = {player intent, score S, VRF slice R}. Server authoritative sim.
- Anti‑cheat: only server determines physics outcome; clients send inputs only.

---

## 3) Agents and Judging
- Player Agent: prompt_profile + memory_snippets (RAG‑lite); train with practice drills.
- Super Judge Agent: multi‑agent rubric + pairwise comparison + self‑consistency.
  - Criteria: relevance, specificity, reasoning, creativity; moderation flags.
  - Outputs: score [0..1], rationale, flags; ties broken with VRF.
- Storage: Pinata IPFS for per‑round JSON (answers + judge output).

---

## 4) Score → Gameplay Mapping (Intensity Curves)
- Boxing: Force F = clamp(Fmin + S^γ * (Fmax − Fmin) + ε(R), Fmin, Fmax); hit chance scales with S.
- Cricket: Timing window and power widen with S; higher boundary chance.
- Carrom: Strike angle error shrinks with S; power scales with S.
- Tune γ≈1.6; ε(R) small randomized noise from VRF for non‑determinism.

---

## 5) Verifiable Randomness
- Randamu VRF seeds: toss/serve, micro‑variation ε(R), tie‑breaks.
- Store VRF proofs in match record; expose in UI for transparency.

---

## 6) Prize‑Track Integrations (Focus: NEAR First)

### A) NEAR (Intents + Shade Agents)
- Walletless onboarding and outcome‑based actions using NEAR Intents:
  - Join match, Stake, Claim payout → as intents executed by solvers.
- Shade Agents: in‑TEE agent accounts that can own assets; ideal for custody‑free agent play and settlement.
- Flow:
  1) Express intent “Join ranked match (stake X)” → solver executes → Chain Signatures finalize.
  2) After match, intent “Payout winners” with server‑signed results + IPFS CIDs as evidence.
- Why it wins: Real consumer UX with intents, account abstraction, and solver‑executed outcomes.

References:
- NEAR Protocol docs: https://docs.near.org/
- NEAR Intents: https://docs.near-intents.org/near-intents
- Shade Agents overview: https://defuse.notion.site/Technical-overview-of-NEAR-Intents-1bdf8a584c7c808b97c4e566ba1be28d
- NEAR AI: https://docs.near.ai/

### B) OpenServ AI
- Orchestrates judge pipeline: rubric‑agent, consistency‑agent, ethics‑agent → consensus.
- Also powers training‑coach agent for prompt improvement.

### C) Randamu
- VRF for fairness; optionally Blocklock Encryption for sensitive pre‑judge data; OnlySwaps in tournaments.

### D) Golem DB (DB‑Chain)
- Decentralized database on L2 for match index, leaderboards/ELO, tournament structures.

### E) Filecoin (Synapse SDK)
- Store replays and transcripts (large artifacts). Gateway retrieval for replays and highlights.

### F) Pinata (IPFS)
- Per‑round JSON payloads pinned via JWT; structured for quick retrieval.

---

## 7) Data Model (Initial)
- agents: id, owner_user_id, name, prompt_profile, memory_snippets (json), stats (json), created_at
- matches: id, mode, status, started_at, ended_at, vrf_proof, intents_tx, shade_agent_id
- match_players: id, match_id, agent_id, user_id, seat
- rounds: id, match_id, idx, question, ipfs_cid, judge_scores (json), result_summary, created_at
- leaderboard: id, agent_id, season_id, mmr, wins, losses, updated_at

---

## 8) API Surface (Phase 1)
- POST /api/match/create → {matchId, lobbyToken}
- POST /api/match/:id/round → triggers question + answers + judge; stores IPFS CIDs and scores
- POST /api/match/:id/finish → finalize; push summary to Golem DB; emit NEAR intent for payout
- GET /api/leaderboard/:season → paginated MMR
- GET/POST /api/agents → create/list agents; GET /api/agents/:id

---

## 9) UX Flows
- Train Agent loop: practice vs CPU judge with instant feedback; one‑click apply suggestions.
- Quick Match (30s): arcade pacing, small rewards; viral sharing.
- Seasons/Tournaments: badges, cosmetics, scheduled events.
- Social: shareable replay links, highlights, rematch deep links.
- Walletless onboarding with NEAR Intents; progressive disclosure.

---

## 10) Monetization
- Freemium: daily caps for free tier.
- Pro: unlimited matches, cosmetics/VFX, priority queue, replay archive ($9–$15/mo).
- Cosmetics economy: skins, trails, hit effects; bundles + season passes.
- Tournaments: entry fees via intents; platform fee 5–10%; sponsorships.
- Creator marketplace: sell prompt profiles/skins; royalties.

---

## 11) Safety, Fairness, Compliance
- Judge transparency: rubric breakdown; VRF proofs viewable.
- Moderation: toxicity/IP checks → quarantine/appeals.
- Anti‑collusion: randomized questions (VRF), matchup limits, anomaly detection.
- Privacy: keep PII off‑chain; store pointers.

---

## 12) Milestones
- Week 1 MVP: Boxing prototype (intensity mapping), agent creation + practice judge loop (Pinata), 1v1 match flow (judge stub), VRF toss + tie‑breaks, Golem DB index + leaderboard.
- Week 2: NEAR Intents (join/stake/claim) + Shade Agent demo; Filecoin replays; tournaments v1; cosmetics shop v1; live leaderboard + shareable replays.

---

## 13) NEAR Integration Plan (Implementation)
1) Server API (Next.js /api/near/*):
   - POST /api/near/intent/create: create intents payloads (join/stake/claim) and return URLs/signables.
   - POST /api/near/intent/confirm: verify solver execution receipts and persist intents_tx to matches.
2) Client: Walletless intent flows → open returned URL (deep link) or embedded widgets.
3) Shade Agents: create or link an agent account per player (later: custody for agent assets).
4) Security: verify receipts and attach IPFS CIDs (evidence) for payouts.

Required configuration (ask user):
- NEAR_NETWORK (testnet/mainnet)
- NEAR_INTENTS_BASE_URL or solver endpoint
- NEAR_RELAYER_ACCOUNT_ID (if sponsoring)
- NEAR_RELAYER_PRIVATE_KEY (secure, server‑only)
- Optional: SHADE_AGENT_FACTORY_CONTRACT, SHADE_AGENT_CODE_HASH

---

## 14) External Credentials Needed (to be requested from you)
- Pinata JWT (to pin JSON per round): obtain from https://pinata.cloud → API Keys → New JWT (enable pinning).
- NEAR Intents configuration:
  - Network: decide testnet vs mainnet (recommend testnet for dev)
  - Solver/Intents endpoint: from NEAR Intents docs or your chosen provider
  - Relayer account + private key (for gas sponsorship) created via NEAR CLI/wallet
- Randamu VRF access (API key/endpoint) if required for on‑chain proof retrieval.
- Filecoin Synapse credentials if using paid providers.
- Golem DB connection details (DB‑Chain endpoint/keys).

I’ll ask for these once the code scaffolding is in place to plug them in safely.

---

## 15) Immediate Next Steps in Code (this repo)
- Create database schema and API routes for Agents, Matches, Rounds, Leaderboard.
- Add leaderboard UI integration with new API.
- Scaffold NEAR intents API endpoints (server) with env‑based configuration and no secrets on client.
- Add Pinata util to pin JSON (server‑only), replacing with OpenServ judge later.

---

Appendix A — Per‑Round JSON Shape (IPFS)
```
{
  "matchId": 123,
  "round": 1,
  "mode": "boxing",
  "question": "How do you counter a southpaw with longer reach?",
  "answers": {
    "agentA": { "text": "...", "meta": {"prompt_profile_version": 2} },
    "agentB": { "text": "...", "meta": {"prompt_profile_version": 1} }
  },
  "judge": {
    "scores": {"agentA": 0.78, "agentB": 0.62},
    "rationale": "Agent A provided better timing and footwork reasoning",
    "flags": {"toxicity": false, "plagiarism": false }
  },
  "timestamps": {"askedAt": 1737572000000, "judgedAt": 1737572008000}
}
```

Appendix B — Intensity Mapping Defaults
- γ=1.6; noise ε ∈ [−0.03, 0.03]; calibrated per mode after playtests.