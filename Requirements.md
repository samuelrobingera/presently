Requirements.md
# Product Requirements Document (PRD): Presently

## 1. Product Overview & Vision
Presently is a real-time, professional stage timer and facility event-management SaaS platform. Inspired by stagetimer.io, it ensures precision timekeeping for live presentations across three core sequential phases: Preparation, Presentation, and Q&A (plus Overtime). 

The platform leverages web-native real-time data streaming to instantly synchronize dashboards used by production technicians, stage managers, and presenters. It is optimized as a Progressive Web App (PWA) to serve individual public speakers up to large enterprise clients operating multi-room conference venues, hotels, and corporate offices.

## 2. Target User Personas & RBAC Hierarchy
The system enforces strict Role-Based Access Control (RBAC) separating administrative operational power from unauthenticated client-side presentation displays.

### Core User Personas
*   **Individual "Pro-Sumer" Presenter:** A single public user who needs automated timekeeping. They must authenticate via OAuth but only inherit client-facing presenter view privileges.
*   **Delegated Admin (Venue Technician/Coordinator):** The live controller assigned to one or many physical rooms. They manipulate active timer states, handle ad-hoc bookings, and append time extensions mid-session.
*   **Global Enterprise Admin:** The master account owner managing a multi-room facility. They configure room registries, manage billing tiers, and delegate administrative power by registering employee email identities.
*   **The Unauthenticated Presenter Display:** The target downstage interface. This requires zero login friction; it is an anonymous endpoint accessed strictly via temporary session tokens or QR code pairings.

### Specialized Domain Personas
*   **Live Streamer:** Content creators requiring zero-latency overlay widgets, integration with OBS Studio, and quick hotkey controls via stream decks.
*   **Hotel & Venue Operator:** Large enterprise clients managing multi-room facilities requiring isolated brand template libraries, customized media assets, and location-based RBAC.
*   **Event Manager:** Operations leads overseeing multi-track conferences who require macro room-monitoring views, drag-and-drop scheduling adjustments, and automated time shifts.
*   **News Broadcaster:** Control room operators requiring sub-second alignment, native integration with broadcasting protocols (NDI/OSC), and external automation compatibility.

---

## 3. System Architecture & Technical Stack
The application is structured to utilize serverless real-time web infrastructure for instant state management.
+-------------------------------------------------------------+
|                  Frontend: React 18 + Tailwind CSS           |
|                (Delivered via Progressive Web App)          |
+-------------------------------------------------------------+
|
+----------------------+----------------------+
|                      |                      |
v                      v                      v
+---------------+      +---------------+      +---------------+
| Firebase Auth |      | Cloud Firestore|      | Firebase RTDB |
|  (OAuth &     |      | (Rooms, Users, |      | (Live Timer & |
| Session Mgmt) |      |   Sessions)   |      |  Room Status) |
+---------------+      +---------------+      +---------------+

*   **Frontend Engine:** React 18 paired with Tailwind CSS for high-contrast rendering.
*   **Data Aggregation Layer (Firestore):** Stores configuration settings, historical room logs, and calendar-level multi-room availability parameters.
*   **Telemetry Streaming Layer (Realtime Database):** Tracks high-frequency, sub-second active timer states (`/timers/{sessionId}`) and live room occupancy states (`/room_status/{roomId}`).
*   **Deployment Architecture:** Hosted natively via Firebase Hosting, wrapped as a PWA offering offline installation capabilities and home screen shortcuts.

---

## 4. Functional Specifications & Behavioral Requirements

### 4.1 Tri-Phase + Overtime State Engine
The state engine moves linearly through explicit temporal states. 

$$\text{Preparation} \longrightarrow \text{Presentation} \longrightarrow \text{Q\&A} \longrightarrow \text{Overtime}$$

*   **Automation Pipeline:** Transitions between `Prep` $\rightarrow$ `Present` $\rightarrow$ `Q&A` happen **automatically** at $T = 00:00$ of the active segment.
*   **Overtime Handling:** Upon expiration of the `Q&A` phase, the session automatically falls back into an indefinite, negative-counting **Overtime State** to track total schedule slippage.
*   **Presenter Control Overrides:** The Presenter is permitted to execute a "Next Phase" bypass action if they complete their material ahead of schedule, shifting the state machine forward immediately.
*   **Admin Overrides:** The Admin retains absolute authority over the state loop. They can execute `Start`, `Pause`, `Resume`, `Stop`, and `Skip` actions.
*   **Mid-Flight Time Manipulation:** Admins can inject or subtract minutes/seconds directly into the *currently running* phase without corrupting the state sequence or forcing a clock reset.

### 4.2 Visual Signaling Matrix
The user interface minimizes text and relies heavily on universal color states to eliminate cognitive load for speakers on a dark stage:

| Phase | Standard State | Warning State (Thresholds) | Expiration / Overtime State |
| :--- | :--- | :--- | :--- |
| **Preparation** | Cool Blue / Neutral Gray | Flashing Yellow Amber (At 2 mins) | Solid Red ($T = 00:00$) |
| **Presentation**| High-Visibility Green | Solid Yellow Amber (At 5 and 2 mins) | Flashing Red ($T = 00:00$) |
| **Q&A** | Solid Purple / Dark Blue | Flashing Orange (At 1 min) | Critical Pulsing Red (Negative Counter) |
| **Overtime** | Solid Deep Red | *N/A* | **Escalating Visual Pulse:** Flashes brighter red every 2 minutes past deadline ($T \le -02:00, -04:00$, etc.) |

### 4.3 Production-Grade Presenter View & Display Mechanics
Because modern stages are deeply integrated environments, Presently bypasses traditional full-screen constraints to support professional event workflows:

*   **Display Layout Configurations:**
    1.  **Full-Screen Downstage Monitor (DSM) Layout:** A high-contrast, maximum-scale clock output designed for standalone timer hardware.
    2.  **The "Timer Bar" Overlay Layout:** An ultra-minimalist, translucent ticker pinned to the bottom margin of the video signal. This allows venue technicians to layer Presently transparently beneath presentation slide decks without masking speaker notes or media content.
*   **Pairing Protocol:** Admins generate a secure, cryptographic session URL. Venue technicians or presenters can scan a generated QR code to immediately instantiate the timer view on any local presentation machine or mobile device without an authentication loop.

### 4.4 Multi-Tenant SaaS & Tier Boundaries

#### 4.4.1 Individual "Pro-Sumer" Account Structure
*   **Authentication:** Mandatory sign-in via Google or Facebook OAuth to establish identity records in the user registry.
*   **Access Tier:** Hard-locked to **Presenter View Only**.
*   **Configuration Scope:** Zero layout or timing configuration. Starting a session spins up an unalterable, 30-minute macro-block mapped precisely to:
    $$\text{5 Min Prep} \longrightarrow \text{20 Min Presentation} \longrightarrow \text{5 Min Q\&A}$$
*   **Branding Constraints:** Strictly displays the core Presently corporate visual identity.

#### 4.4.2 Enterprise Tier
*   **Commercial Framework:** Scaled and packaged via a multi-tenant model billed **per physical room license**.
*   **Resource Engine Layout:** Enterprise dashboards gain full CRUD layout access to inventory databases mapping metadata parameters: Room Name, Structural Capacity, Local Hardware configurations, and Availability Status (`Available`, `Occupied`, `Maintenance`).
*   **Booking Topologies:** Supports a hybrid scheduling engine:
    1.  **Calendar Integration:** Dedicated request queues mapped to a central room booking calendar.
    2.  **Ad-Hoc Instantiation:** Instantaneous scheduling if a room's active database marker returns `Available`.
*   **Administrative Delegation:** Enterprise admins can escalate standard profiles to administrative statuses by binding corporate email addresses to their master account portal.

---

## 5. Security Architecture & Data Partitioning
Security rules are enforced natively at the database level to maintain multi-tenant safety.

### 5.1 Firestore Data Separation (JSON/NoSQL Schemas)
*   **/users/{userId}**: Read and write access restricted strictly to the authenticated identity matching the Document ID (`request.auth.uid == userId`).
*   **/rooms/{roomId}**: Read access is globally valid for authenticated tenants. Write privileges are locked down exclusively to the active occupant (`resource.data.occupiedBy == request.auth.uid`).
*   **/sessions/{sessionId}**: Cross-referenced dynamically. Writes are rejected unless the request origin maps to the verified session owner.

### 5.2 Realtime Database Guardrails
*   Live tracking routes are separated beneath path boundaries (`/timers/{sessionId}`). Writes to a live timing synchronization register fail automatically unless the tenant's authenticated token explicitly matches the primary session architect resource data (`data.child('userId').val() == auth.uid`).

---

## 6. Advanced Roadmap & Downstream Phases

### 6.1 Phase 5: Wear OS Haptic Telemetry (Optional Architecture)
Downstream integration of low-latency tactile synchronization targeting smart wearables via background WebSocket data loops.

*   **Pacing Alerts:** Single brief pulse ($200\text{ms}$) dispatched at $T = 02:00$ minutes remaining in active presentation blocks.
*   **Phase Shifts:** Dual medium pulses ($500\text{ms}$) triggered at phase boundaries ($T = 00:00$) to signal autonomous state updates.
*   **Termination Alert:** Continuous, high-intensity pulsing ($1500\text{ms}$) triggered immediately when the Q&A phase lapses and the session drops into critical overtime.
## 7. Understanding Backlog of Requirements (Enhancements)

### Epic 1: Brand Asset & Template Engine
*   **R1.1 - Built-in & Custom Templates:** Users must be able to select from a suite of system templates or author their own custom layout templates (defining phase structures, transitions, and style themes).
*   **R1.2 - Multi-Tenant Media Library:** Organizations (e.g., hotel chains) must be able to upload, store, and organize proprietary media assets (logos, background graphics, audio alerts) mapped to specific rooms or global templates.
*   **R1.3 - Asset-Driven Visual Cues:** Templates must support triggering media playback or rendering custom logos dynamically on phase shift boundaries (e.g., flashing a sponsor logo on Prep expiration).

### Epic 2: Interoperability & Hardware Control Matrix
*   **R2.1 - Local Input Hardware Mapping:** Provide native bindings for standard keyboard and mouse inputs to navigate rooms, override timers, and trigger phase transitions.
*   **R2.2 - Remote Control Integrations:** Integrate compatibility hooks with professional hardware controllers (Stream Deck, Steam Deck, MIDI devices) and remote control utility software (Bitfocus Companion).
*   **R2.3 - Studio Automation Protocols:** Implement input/output integration profiles for broadcast production environments, specifically Open Sound Control (OSC) commands, NDI telemetry streams, and native OBS Studio control dock compatibility.

### Epic 3: Offline-First Synchronization & Resilience
*   **R3.1 - Network Drop Tolerant Clock:** The stage timer's core clock engine must run inside a service-worker or client-side context to guarantee uninterrupted countdown rendering and local control even if the underlying Wi-Fi or network connection is dropped.
*   **R3.2 - State Reconciliation:** Once network connectivity is restored, the client must automatically synchronize its local offline logs/state with Firestore and Firebase RTDB without causing visual telemetry stuttering.

### Epic 4: Tabular Live Cockpit & Cascading Scheduler
*   **R4.1 - Tabular Room Dashboard:** Provide event admins with a centralized, tabular overview of all rooms, displaying active speakers, current phases, and color-coded telemetry statuses.
*   **R4.2 - Drag-and-Drop Event Reordering:** Allow admins to interactively reorder planned timeline events directly within the dashboard using standard drag-and-drop gestures.
*   **R4.3 - Cascading Schedule Adjustments:** If an event runs overtime, the system must automatically adjust the scheduled start and end times for all subsequent events in that room by the corresponding delay duration.

### Epic 5: Extensible Custom Timer Phases
*   **R5.1 - Dynamic Phase Definition:** Admins must have the autonomy to add, delete, rename, and custom-order phases inside individual rooms, departing from the static Prep -> Present -> Q&A cycle.
*   **R5.2 - Phase-Level Visual Mapping:** Each custom phase must support custom signaling configurations (duration, warning thresholds, alert actions, colors, and pulsing profiles).
