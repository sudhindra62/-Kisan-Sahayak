# KisanSahayak: AI-Powered Farmer Assistance Platform

**KisanSahayak is an industry-level Next.js app empowering farmers. It features offline-first scheme analysis, a multilingual AI chatbot with voice support, and actionable guidance for scheme eligibility. Built with Genkit, Firebase, and ShadCN for a premium, accessible user experience even in low-connectivity areas.**

---

## 🏛️ Technical Architecture (Judge/VIVA Preparation)

### 1. The Reasoning Engine (Hybrid AI-Data)
KisanSahayak utilizes a **Hybrid AI-Data Architecture**:
*   **Knowledge Base**: A structured repository of state and national agricultural schemes.
*   **Inference Layer (ML)**: Uses **Google Gemini 2.5 Flash**. This model performs **Zero-shot Classification** to determine eligibility based on semantic meaning rather than exact keyword matches.
*   **Suitability Algorithm**: Implements **Gaussian Bell-Curve Scoring** to map live weather to biological tolerance ranges.

### 2. 📡 Data Authenticity & Provenance (Live Data Proof)
We ensure 100% technical transparency for our agronomic advice:
*   **Operational Forecasts**: Sourced from **ECMWF IFS (Integrated Forecast System)** and **NOAA GFS**.
*   **Regional Accuracy**: High-resolution (9km) grid points tailored to Indian state centroids.
*   **Historical Baselines**: Accesses the **ERA5 Reanalysis** dataset (30-year averages from 1991–2020) to detect climate anomalies.
*   **Transparency Audit**: A dedicated 'Live Data Proof Panel' in the UI allows users to inspect the **Raw API JSON Response** and Model Attribution.

### 3. Security & Safety
*   **UID-Based Isolation**: Uses Firebase Security Rules to ensure data is strictly scoped to the authenticated User ID (UID).
*   **Encrypted Pipeline**: All communications are secured via TLS/SSL, and sensitive AI processing happens within protected Server Actions.

---

## 🌟 Key Features
*   **Offline-First Philosophy**: Core functionalities work without an internet connection using local TS calculation engines.
*   **Multilingual Assistant**: Supports voice-to-text and text-to-speech in multiple Indian languages.
*   **Water Stress Balancing**: Implements the **FAO-56 standard** for calculating supplemental irrigation needs.
*   **Auto-Report Generation**: Generates high-fidelity, official-format Government of India subsidy claim documents (.docx) with digital seals.

By combining a user-centric design with powerful ML reasoning and verifiable satellite data, KisanSahayak transforms the farmer's experience from a bureaucratic struggle into a guided partnership.
