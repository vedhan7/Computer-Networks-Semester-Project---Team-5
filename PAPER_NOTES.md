# ACORN: IEEE Paper & Patent Draft Notes

This document provides a structured outline and technical talking points for writing an IEEE-format research paper or drafting a patent application based on the ACORN project.

## Title Ideas
*   *ACORN: An AI-Driven Intent-Based Self-Healing Framework for Smart Campus Networks*
*   *Context-Aware Network Orchestration: Bridging Academic ERPs and Intent-Based Networking*
*   *Temporal Intent Pre-Staging and Context-Relative Anomaly Detection in Smart Campus Environments*

## 1. Abstract
Traditional college campus networks are statically managed and struggle to adapt to the highly dynamic nature of academic environments. High-stakes events like online examinations or intensive lab sessions often suffer from network congestion or unexpected outages due to rigid bandwidth allocation and reactive troubleshooting. In this paper, we propose ACORN (Academic Context-Orchestrated Resilient Network), a novel AI-driven, intent-based, self-healing framework. ACORN introduces five novel contributions: (1) an ERP-to-Network Contextual Intent-Translator (ENCI) that autonomously generates network policies from academic timetables, (2) a Temporal Intent Pre-Staging (TIPS) pipeline for predictive policy enforcement, (3) a Context-Relative Anomaly Threshold Engine (CRATE) that scores network health based on scheduled activities, (4) an Academic Priority Conflict Resolver (APCR), and (5) a Context-Aware Self-Healing (CASH) matrix. Simulated results demonstrate that ACORN significantly reduces latency during critical academic events, resolves policy conflicts deterministically, and reduces mean time to recovery (MTTR) through context-aware automated healing.

## 2. Introduction
*   **Problem:** Campus networks face bursty, predictable traffic (e.g., 500 students logging into an exam portal simultaneously). Static QoS and VLANs cannot adapt.
*   **Gap:** Existing Intent-Based Networking (IBN) solutions are designed for data centers or ISPs, lacking the semantic understanding of "academic context" (i.e., what is a class, an exam, a lab).
*   **Solution:** Tie the institutional ERP (Enterprise Resource Planning - the timetable/schedule) directly to the SDN/IBN controller.
*   **USP/Novelty:** The system doesn't just react to traffic; it *anticipates* it because it knows the college timetable.

## 3. Proposed Architecture & Novel Contributions (The "Meat" of the Patent/Paper)

### A. ENCI: ERP-to-Network Contextual Intent-Translator
*   **How it works:** A module that ingests calendar data (JSON/REST from ERP). It uses a defined ontology mapping academic event types (Exam, Lab, Lecture) to network profiles.
*   **Novelty:** Automated generation of network intents (e.g., "Allocate 500Mbps and lockdown security for Exam in Hall A") without human admin intervention.

### B. TIPS: Temporal Intent Pre-Staging Pipeline
*   **How it works:** A 4-phase state machine (Draft → Staged → Armed → Active).
*   **Novelty:** Instead of reacting when an exam starts, TIPS *stages* the network configurations 30 minutes prior, *arms* the hardware 5 minutes prior, and *activates* exactly at T=0. This eliminates the configuration propagation delay that plagues traditional SDN deployments during sudden burst events.

### C. CRATE: Context-Relative Anomaly Threshold Engine
*   **How it works:** Calculates a Campus Network Health Score (CNHS) from 0-100.
*   **Novelty:** Traditional systems flag 90% bandwidth utilization as an anomaly. CRATE knows that if a "Programming Lab" is active, 90% is *expected* (Normal). But if it's a "Free Period," 90% is an anomaly. The threshold dynamically shifts based on the ERP context.

### D. APCR: Academic Priority Conflict Resolver
*   **How it works:** When two intents target the same switch/segment (e.g., a background backup vs. an active exam).
*   **Novelty:** Uses an institutional taxonomy (Exam > Lab > Lecture) to automatically resolve policy conflicts. Introduces three deterministic resolution strategies: Preemption, Graceful Degradation, and Proportional Sharing.

### E. CASH: Context-Aware Self-Healing Matrix
*   **How it works:** A 5x5 matrix mapping 5 Fault Types (Saturation, Packet Loss, Link Down, Unauthorized, Latency) against 5 Contexts (Exam, Lab, Lecture, Event, Free).
*   **Novelty:** The aggression of the automated response varies. If a link goes down during an Exam (Aggression Level 5), CASH will immediately force a hard failover, dropping non-critical connections. If a link goes down during a Free Period (Aggression Level 2), CASH will attempt a graceful soft-reset to preserve active downloads.

## 4. Implementation details
*   Discuss the FastAPI backend acting as the IBN controller.
*   Discuss the Next.js real-time dashboard using WebSockets.
*   Mention the SQLite WAL-mode architecture for high-throughput intent state tracking.

## 5. Results & Discussion (Based on Simulation)
*   **Metric 1:** *Pre-staging latency.* Show how TIPS reduces the time it takes for network policies to take effect when an event starts.
*   **Metric 2:** *CRATE accuracy.* Show how CRATE avoids false positives (alert fatigue) by suppressing alerts during high-demand scheduled events.
*   **Metric 3:** *CASH MTTR (Mean Time To Recovery).* Show how context-aware aggression resolves critical faults faster during exams compared to standard reactive healing.

## 6. Conclusion & Future Work
*   ACORN bridges the gap between institutional administration and network operations.
*   Future work: Integrating LLMs (Large Language Models) natively into ENCI for more complex natural language parsing of unstructured campus event emails, and integrating with physical SDN hardware (OpenFlow/P4).
