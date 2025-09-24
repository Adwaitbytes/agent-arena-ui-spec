# Hacker House Prize Tracks — Documentation Index

This document aggregates official docs and starter resources for each sponsor track. Use it as the single source of truth while integrating.

---

## NEAR — Intents & Shade Agents ($3,000)
- Overview: https://docs.near.org/
- NEAR Intents: https://docs.near-intents.org/near-intents
- Technical overview (Intents, Chain Signatures, Shade Agents): https://defuse.notion.site/Technical-overview-of-NEAR-Intents-1bdf8a584c7c808b97c4e566ba1be28d
- NEAR AI: https://docs.near.ai/

Focus
- Walletless UX via Intents (join match, stake, claim payout)
- Shade Agents for agent-owned accounts/assets
- Seamless consumer onboarding & intent-based flows

---

## OpenServ AI Track ($3,000)
- Docs: https://docs.openserv.ai/
- SDK (GitHub): https://github.com/openserv-labs/sdk
- Agent examples & tutorials: https://docs.openserv.ai/demos-and-tutorials/agent-examples

Focus
- Orchestrate multi-agent judge pipelines (rubric, consensus, moderation)
- Rapid MVP assembly with OpenServ orchestrations

---

## Randamu ($3,000)
- Docs portal: http://docs.dcipher.network
- Whitepaper/overview (Google Doc): https://docs.google.com/document/d/1fZf7dA6JcWQLnCtcgGOdfthyiDCGJRMlZn2OgoVLqHM/edit?usp=sharing

Focus
- Verifiable Random Function (VRF) for fairness, tie-breaks
- Blocklock Encryption for pre-judge secrecy
- OnlySwaps for seamless asset swaps in tournaments

---

## Golem DB — DB-Chain ($3,000)
- Docs: https://docs.golemdb.io/
- Python SDK: https://pypi.org/project/golem-base-sdk/
- Node SDK (npm): https://www.npmjs.com/package/golem-base-sdk

Focus
- Decentralized DB for matches, leaderboards, and tournaments
- Web2-like DB interactions on L2 with on-chain backing

---

## Filecoin — Synapse SDK ($1,000)
- FS Upload Dapp (reference): https://github.com/FIL-Builders/fs-upload-dapp
- Synapse SDK (reference): https://github.com/FilOzone/synapse-sdk

Focus
- Decentralized storage for replays, transcripts, large artifacts
- Content retrieval for replay viewer & highlights

---

## Judging Criteria Alignment
- Product-market fit signals (clear user value, repeatable loop)
- Technical excellence (clean APIs, verifiability, fault tolerance)
- Path to production (auth, billing, observability, DX)

---

## Suggested Integration Map (High Level)
- NEAR Intents: join/stake/claim actions → server endpoints under `/api/near/intent/*`
- OpenServ: multi-agent evaluating rubric → judge pipeline and coach agent for training
- Randamu: VRF seed + proof in each match; expose verification UI
- Golem DB: index matches, ELO/leaderboards, tournaments
- Filecoin: store replay artifacts, transcripts, summaries; link CIDs from DB

Keep this page updated as you integrate and learn nuances from each track’s docs.