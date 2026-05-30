Requirements.md
# Product Requirements Document (PRD): Presently

## 1. Product Overview & Vision
Presently is a real-time, professional stage timer and facility event-management SaaS platform. Inspired by stagetimer.io, it ensures precision timekeeping for live presentations across three core sequential phases: Preparation, Presentation, and Q&A (plus Overtime). 

The platform leverages web-native real-time data streaming to instantly synchronize dashboards used by production technicians, stage managers, and presenters. It is optimized as a Progressive Web App (PWA) to serve individual public speakers up to large enterprise clients operating multi-room conference venues, hotels, and corporate offices.

## 2. Target User Personas & RBAC Hierarchy
The system enforces strict Role-Based Access Control (RBAC) separating administrative operational power from unauthenticated client-side presentation displays.

*   **Individual "Pro-Sumer" Presenter:** A single public user who needs automated timekeeping. They must authenticate via OAuth but only inherit client-facing presenter view privileges.
*   **Delegated Admin (Venue Technician/Coordinator):** The live controller assigned to one or many physical rooms. They manipulate active timer states, handle ad-hoc bookings, and append time extensions mid-session.
*   **Global Enterprise Admin:** The master account owner managing a multi-room facility. They configure room registries, manage billing tiers, and delegate administrative power by registering employee email identities.
*   **The Unauthenticated Presenter Display:** The target downstage interface. This requires zero login friction; it is an anonymous endpoint accessed strictly via temporary session tokens or QR code pairings.

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