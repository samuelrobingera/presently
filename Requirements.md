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

### Epic 1: Brand Asset & Template Engine [PENDING]
**Status:** 🔴 Not Started  
**Priority:** Medium  
**Estimated Effort:** 2-3 weeks

*   **R1.1 - Built-in & Custom Templates:** Users must be able to select from a suite of system templates or author their own custom layout templates (defining phase structures, transitions, and style themes).
*   **R1.2 - Multi-Tenant Media Library:** Organizations (e.g., hotel chains) must be able to upload, store, and organize proprietary media assets (logos, background graphics, audio alerts) mapped to specific rooms or global templates.
*   **R1.3 - Asset-Driven Visual Cues:** Templates must support triggering media playback or rendering custom logos dynamically on phase shift boundaries (e.g., flashing a sponsor logo on Prep expiration).

**Dependencies:** None  
**Blocker:** Requires Firebase Storage setup for media uploads

---

### Epic 2: Interoperability & Hardware Control Matrix [PENDING]
**Status:** 🔴 Not Started  
**Priority:** High (for broadcast/streaming users)  
**Estimated Effort:** 3-4 weeks

*   **R2.1 - Local Input Hardware Mapping:** Provide native bindings for standard keyboard and mouse inputs to navigate rooms, override timers, and trigger phase transitions.
*   **R2.2 - Remote Control Integrations:** Integrate compatibility hooks with professional hardware controllers (Stream Deck, Steam Deck, MIDI devices) and remote control utility software (Bitfocus Companion).
*   **R2.3 - Studio Automation Protocols:** Implement input/output integration profiles for broadcast production environments, specifically Open Sound Control (OSC) commands, NDI telemetry streams, and native OBS Studio control dock compatibility.

**Dependencies:** None  
**Technical Notes:** 
- R2.1 requires global keyboard event listeners
- R2.2 needs WebMIDI API and WebSocket connections
- R2.3 requires OSC protocol implementation (UDP/WebSocket bridge)

---

### Epic 3: Offline-First Synchronization & Resilience [✅ COMPLETED]
**Status:** ✅ Completed - June 19, 2026  
**Documentation:** `EPIC3_IMPLEMENTATION.md`, `EPIC3_SUMMARY.md`

*   **R3.1 - Network Drop Tolerant Clock:** ✅ The stage timer's core clock engine runs in client-side React state with local countdown logic, guaranteeing uninterrupted rendering during network drops.
*   **R3.2 - State Reconciliation:** ✅ Automatic state synchronization via `syncService.reconcileState()` when connectivity is restored, with queued updates applied without visual stuttering.

**Implementation Highlights:**
- Local IndexedDB storage via `offlineStorage.js`
- Network status detection with `useNetworkStatus` hook
- Queued update system in `syncService.js`
- Optimistic UI updates with 5-second Firebase sync throttling

---

### Epic 4: Tabular Live Cockpit & Cascading Scheduler [✅ COMPLETED]
**Status:** ✅ Completed - June 26, 2026  
**Documentation:** `EPIC4_IMPLEMENTATION.md`, `EPIC4_SUMMARY.md`

*   **R4.1 - Tabular Room Dashboard:** ✅ Centralized multi-room overview with active speakers, current phases, and color-coded telemetry statuses in `RoomDashboard.jsx`.
*   **R4.2 - Drag-and-Drop Event Reordering:** ✅ Interactive timeline reordering via HTML5 drag-and-drop API in `EventTimeline.jsx`.
*   **R4.3 - Cascading Schedule Adjustments:** ✅ Automatic adjustment of subsequent event times when events run overtime via `eventScheduler.applyCascadingDelay()`.

**Implementation Highlights:**
- Real-time Firestore listeners for live updates (<500ms latency)
- Batch atomic writes for consistency
- Optimistic UI updates for smooth drag-and-drop
- Demo mode support for offline testing

---

### Epic 5: Extensible Custom Timer Phases [✅ COMPLETED]
**Status:** ✅ Completed - June 27, 2026  
**Documentation:** `EPIC5_IMPLEMENTATION.md`, `EPIC5_SUMMARY.md`

*   **R5.1 - Dynamic Phase Definition:** ✅ Admins can add, delete, rename, and custom-order phases via drag-and-drop interface in `PhaseConfigurator.jsx`.
*   **R5.2 - Phase-Level Visual Mapping:** ✅ Each custom phase supports custom colors, warning thresholds, alert actions (solid, flash, pulse), and pulsing profiles configured in `PhaseVisualEditor.jsx`.

**Implementation Highlights:**
- `phaseConfigService.js` for CRUD operations on phase templates
- Dynamic styling engine in `timerUtils.js` replacing hardcoded phase logic
- Live preview panel showing Normal/Warning/Critical states
- Backward compatible with existing hardcoded phases
- Zero breaking changes

---

## 8. Security Considerations & Known Issues

### 8.1 Security Issues Identified

#### 🔴 CRITICAL: Firebase Security Rules Need Hardening
**Issue:** Current Firestore security rules may allow unauthorized access to phase configurations  
**Impact:** Users could potentially read/modify other organizations' phase templates  
**Status:** 🟡 Needs Review  
**Remediation:**
```javascript
// Required Firestore rules for /phaseConfigs
match /phaseConfigs/{configId} {
  allow read: if request.auth != null &&
    (resource.data.userId == request.auth.uid ||
     resource.data.orgId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizations);
  
  allow write: if request.auth != null &&
    request.auth.token.role in ['owner', 'admin'] &&
    (request.resource.data.userId == request.auth.uid ||
     request.resource.data.orgId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizations);
}
```

#### 🟡 MEDIUM: RTDB Rules for Custom Phases
**Issue:** Firebase Realtime Database rules don't validate phaseConfigId  
**Impact:** Sessions could reference non-existent or unauthorized phase configs  
**Status:** 🟡 Needs Implementation  
**Remediation:** Add validation in `/timers/{sessionId}` rules to verify phaseConfigId exists and user has access

#### 🟡 MEDIUM: XSS Risk in Custom Phase Names
**Issue:** Phase names are user-input strings rendered directly in UI  
**Impact:** Potential XSS if malicious HTML/JS injected in phase names  
**Status:** 🟢 Low Risk (React escapes by default)  
**Remediation:** Add explicit sanitization in `phaseConfigService.validatePhaseConfig()`

#### 🟢 LOW: Rate Limiting on Phase Config Creation
**Issue:** No rate limiting on phase template creation  
**Impact:** Users could spam Firestore with excessive templates  
**Status:** 🔴 Not Implemented  
**Remediation:** Implement Firebase App Check and rate limiting rules

### 8.2 Privacy Considerations

- ✅ **Data Isolation:** Org-level filtering prevents cross-tenant data leakage
- ✅ **Authentication Required:** All phase config operations require Firebase Auth
- ⚠️ **Audit Logging:** No audit trail for phase config changes (Future Enhancement)
- ⚠️ **GDPR Compliance:** Phase templates may contain personal data (phase names referencing individuals)

### 8.3 Security Best Practices Implemented

- ✅ **Client-side validation** before Firestore writes
- ✅ **Demo mode** prevents accidental production writes during testing
- ✅ **Soft deletes** (active: false) preserve data integrity
- ✅ **Read-only default config** cannot be deleted or modified
- ✅ **Multi-tenant isolation** via orgId/userId filtering

---

## 9. Code Quality & Technical Debt

### 9.1 Technical Debt Identified

#### 🔴 HIGH: Hardcoded Phase Logic Still Exists
**Location:** `timerUtils.js` - `getLegacyPhaseStyles()`  
**Issue:** Legacy hardcoded phase styling preserved for backward compatibility  
**Impact:** Code duplication, maintenance burden  
**Remediation:** 
- Migrate all sessions to use phaseConfigId
- Deprecate legacy function in 3 months
- Remove in 6 months

#### 🟡 MEDIUM: No Type Safety
**Issue:** JavaScript lacks compile-time type checking  
**Impact:** Runtime errors possible for phase config structure mismatches  
**Remediation:** 
- Migrate to TypeScript (Estimated: 2-3 weeks)
- Add PropTypes validation as interim solution
- Zod schema validation for Firestore documents

#### 🟡 MEDIUM: Large Component Files
**Location:** `PhaseConfigurator.jsx` (550 lines)  
**Issue:** Component exceeds recommended 300-line limit  
**Impact:** Harder to maintain and test  
**Remediation:** Split into subcomponents:
- `PhaseConfigList.jsx` (sidebar)
- `PhaseConfigEditor.jsx` (main editor)
- `PhaseCard.jsx` (individual phase card)

#### 🟢 LOW: Inconsistent Error Handling
**Issue:** Some services use console.error, others throw exceptions  
**Impact:** Inconsistent user error messages  
**Remediation:** Standardize error handling with centralized ErrorService

### 9.2 Code Quality Metrics

**Epic 5 Implementation:**
- ✅ **Modularity:** Services completely separate from UI components
- ✅ **Testability:** Demo mode enables comprehensive testing without Firebase
- ✅ **Documentation:** 1,500+ lines of implementation docs
- ⚠️ **Test Coverage:** 0% (no automated tests written)
- ⚠️ **Accessibility:** No ARIA labels or keyboard navigation tested
- ⚠️ **Performance:** No load testing for 50+ phase templates

### 9.3 Recommended Improvements

1. **Add Unit Tests** (Priority: High)
   - Jest + React Testing Library
   - Target: 80% code coverage
   - Focus on `phaseConfigService.js` and `timerUtils.js`

2. **Add Integration Tests** (Priority: Medium)
   - Cypress for E2E testing
   - Test drag-and-drop interactions
   - Test phase transitions in live timer

3. **Performance Optimization** (Priority: Low)
   - Memoize phase style calculations
   - Virtual scrolling for 50+ templates
   - Lazy load PhaseVisualEditor

4. **Accessibility Audit** (Priority: High)
   - Add ARIA labels to drag handles
   - Keyboard shortcuts for phase reordering
   - Screen reader announcements for timer

---

## 10. Future Roadmap (Epic 6+)

### Epic 6: Automated Testing & Quality Assurance [PROPOSED]
**Priority:** 🔴 Critical  
**Estimated Effort:** 3-4 weeks

**Requirements:**
- **R6.1 - Unit Test Coverage:** Achieve 80%+ code coverage with Jest
- **R6.2 - E2E Testing:** Cypress tests for critical user flows
- **R6.3 - Visual Regression Testing:** Percy or Chromatic for UI consistency
- **R6.4 - Performance Testing:** Lighthouse CI for performance budgets
- **R6.5 - Security Scanning:** OWASP dependency checks, SonarQube analysis

**Rationale:** Current 0% test coverage poses risk for production deployments

---

### Epic 7: Mobile App (iOS/Android) [PROPOSED]
**Priority:** 🟡 Medium  
**Estimated Effort:** 8-12 weeks

**Requirements:**
- **R7.1 - React Native App:** Native mobile apps for iOS/Android
- **R7.2 - Haptic Feedback:** Native vibration alerts for phase transitions
- **R7.3 - Background Timers:** Continue countdown when app backgrounded
- **R7.4 - Offline-First:** Full functionality without network
- **R7.5 - Apple Watch Integration:** Wrist-based timer control (Phase 5 spec)

**Dependencies:** Epic 6 (testing infrastructure)

---

### Epic 8: Advanced Analytics & Reporting [PROPOSED]
**Priority:** 🟢 Low  
**Estimated Effort:** 2-3 weeks

**Requirements:**
- **R8.1 - Phase Usage Analytics:** Track which custom phases are most popular
- **R8.2 - Punctuality Reports:** Detailed overtime analysis per phase
- **R8.3 - Export to CSV/PDF:** Downloadable reports for stakeholders
- **R8.4 - Data Visualization:** Interactive charts (Chart.js, Recharts)
- **R8.5 - Predictive Insights:** ML-based suggestions for optimal phase durations

**Dependencies:** Epic 4 (event data collection)

---

### Epic 9: AI-Powered Suggestions [PROPOSED]
**Priority:** 🟢 Low  
**Estimated Effort:** 4-6 weeks

**Requirements:**
- **R9.1 - Phase Template Recommendations:** AI suggests phase configs based on event type
- **R9.2 - Duration Optimization:** Machine learning predicts optimal phase durations
- **R9.3 - Anomaly Detection:** Alert admins when events consistently run overtime
- **R9.4 - Natural Language Config:** "Create a 45-minute workshop format" generates template
- **R9.5 - Voice Control:** Alexa/Google Assistant integration

**Dependencies:** Epic 8 (analytics data for ML training)

---

### Epic 10: White-Label & API Platform [PROPOSED]
**Priority:** 🟡 Medium  
**Estimated Effort:** 6-8 weeks

**Requirements:**
- **R10.1 - White-Label Branding:** Custom domains, logos, colors for enterprise clients
- **R10.2 - Public REST API:** Third-party integrations via documented API
- **R10.3 - Webhook System:** Real-time event notifications to external systems
- **R10.4 - OAuth 2.0 Provider:** Allow other apps to integrate with Presently
- **R10.5 - GraphQL API:** Flexible data queries for power users

**Dependencies:** Epic 6 (API testing)

---

## 11. Backlog Prioritization

### Q3 2026 (July - September)
1. **Epic 6: Automated Testing** - CRITICAL for production stability
2. **Epic 1: Brand Asset & Template Engine** - High customer demand
3. **Security Hardening** - Implement all 🔴 critical security fixes

### Q4 2026 (October - December)
1. **Epic 2: Hardware Control Matrix** - Unlock broadcast market
2. **Epic 7: Mobile App** - Expand market reach
3. **Technical Debt Cleanup** - TypeScript migration, component splitting

### 2027 Roadmap
1. **Epic 8: Advanced Analytics** - Data-driven insights for enterprise
2. **Epic 10: White-Label & API** - Enable ecosystem growth
3. **Epic 9: AI-Powered Suggestions** - Competitive differentiation

---

## 12. Success Metrics

### Technical Health Metrics
- **Test Coverage:** Target 80%+ (Current: 0%)
- **Build Time:** <30 seconds (Current: ~15 seconds)
- **Bundle Size:** <500KB gzipped (Current: ~350KB)
- **Lighthouse Score:** 90+ (Current: Not measured)
- **Security Vulnerabilities:** 0 critical, 0 high (Current: 2 critical, 2 medium)

### Product Success Metrics
- **Enterprise Adoption:** 50+ organizations by Q4 2026
- **Session Volume:** 10,000+ timed sessions per month
- **Custom Phase Usage:** 30%+ of sessions use custom phase configs
- **Customer Satisfaction:** NPS score 50+ (Current: Not measured)

---

**Document Version:** 2.0  
**Last Updated:** June 27, 2026  
**Status:** ✅ Backlog Updated with Epic 3, 4, 5 completion and future roadmap
