# Admin Access & Session Termination Issues

**Date:** June 27, 2026  
**Status:** 🔴 Requires Implementation

---

## Issue 1: Admin Rights Management

### Current Implementation

The admin access system is currently **domain-based** and works as follows:

```javascript
// AuthContext.js Lines 29-43
const org = await authService.lookupOrganization(firebaseUser.email, false);
if (org) {
  if (org.ownerId === firebaseUser.uid) {
    setUserRole('owner');
  } else if (org.adminIds && org.adminIds.includes(firebaseUser.uid)) {
    setUserRole('admin');
  } else {
    setUserRole('member');
  }
}
```

**How it works:**
1. User logs in with Google/Facebook OAuth
2. System extracts email domain (e.g., `user@acme.com` → `acme.com`)
3. Firestore lookup: `organizations` collection where `domain == 'acme.com'`
4. If organization found:
   - Check if `ownerId == user.uid` → **Owner** role
   - Check if `adminIds` array includes `user.uid` → **Admin** role
   - Otherwise → **Member** role

### Current Problems

❌ **No Initial Setup Mechanism**
- When a business contacts you, there's no UI to create the organization
- No way to set the initial `ownerId` 
- No admin panel to configure `adminIds`

❌ **Domain-Only Logic**
- Only works for corporate email domains (`@acme.com`, `@hotel.com`)
- Fails for generic domains (`@gmail.com`, `@yahoo.com`)
- No support for multi-domain organizations

❌ **No Self-Service Onboarding**
- Individual users can't upgrade to enterprise themselves
- No payment flow to create organization

### Your Original Vision vs Current Reality

**Your Idea:** 
> "When a business reaches out to me for configuration, I will configure the Administrator"

**Reality:** 
- ✅ The RBAC structure exists (`owner`, `admin`, `member`)
- ✅ The permission checks are in place
- ❌ **Missing:** A super-admin panel for YOU to configure organizations
- ❌ **Missing:** Organization creation workflow

---

## Proposed Solution: Super-Admin Portal

### Option A: Firestore Console (Quick Solution)

**For MVP Launch:**
Manually create organizations via Firebase Console when businesses contact you.

**Steps:**
1. Business contacts you: "We want Presently for our hotel chain"
2. You collect:
   - Organization name
   - Email domain(s)
   - Owner email (their IT admin)
   - Billing details
3. You manually create Firestore document:

```javascript
// Firestore: /organizations/{orgId}
{
  id: "org_hilton_hotels",
  name: "Hilton Hotels",
  domain: "hilton.com",
  domains: ["hilton.com", "hilton.net"], // Multiple domain support
  ownerId: null, // Set when owner first logs in
  ownerEmail: "admin@hilton.com",
  adminIds: [],
  adminEmails: ["techsupport@hilton.com", "events@hilton.com"],
  subscription: {
    plan: "Enterprise Pro",
    status: "active",
    roomLicenses: 50,
    pricePerMonth: 499.00,
    startDate: "2026-07-01",
    nextBillingDate: "2026-08-01"
  },
  settings: {
    ssoEnabled: false,
    ssoProvider: null,
    brandingEnabled: true
  },
  createdAt: Timestamp,
  createdBy: "super-admin",
  active: true
}
```

4. When `admin@hilton.com` logs in:
   - System finds org by `ownerEmail` or `domain`
   - Sets `ownerId` to their `uid`
   - Grants them Owner role

**Pros:**
- ✅ Works immediately, no code changes
- ✅ You have full control
- ✅ Can launch with this approach

**Cons:**
- ❌ Manual process (doesn't scale)
- ❌ Requires Firebase console access
- ❌ No audit trail

---

### Option B: Super-Admin Panel (Scalable Solution)

**For Production Scale:**
Build a dedicated super-admin interface accessible only to you.

**Architecture:**

```
┌─────────────────────────────────────────┐
│   Regular Presently App                 │
│   https://presently.app                 │
│   • User login                          │
│   • Timer interface                     │
│   • Org Admin Terminal (for admins)    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   Super-Admin Portal                    │
│   https://admin.presently.app           │
│   • Your login only                     │
│   • Create/Edit/Delete organizations    │
│   • Set owner & admin emails            │
│   • Billing management                  │
│   • Platform-wide analytics             │
└─────────────────────────────────────────┘
```

**Components to Build:**

1. **SuperAdminAuth Service**
```javascript
// Hardcoded list of super-admins
const SUPER_ADMINS = [
  'your-email@presently.app'
];

export const isSuperAdmin = (email) => {
  return SUPER_ADMINS.includes(email);
};
```

2. **Organization Management UI**
```
/super-admin/organizations
  • List all organizations
  • Create new organization
  • Edit organization settings
  • Assign owner/admins by email
  • Manage subscriptions
  • View usage analytics
```

3. **Firestore Security Rules**
```javascript
// Only super-admins can write to organizations
match /organizations/{orgId} {
  allow read: if request.auth != null &&
    (request.auth.token.email in resource.data.adminEmails ||
     request.auth.token.email == resource.data.ownerEmail);
  
  allow write: if request.auth != null &&
    request.auth.token.email in ['your-email@presently.app'];
}
```

**Implementation Estimate:** 2-3 days

---

### Option C: Self-Service Onboarding (Future)

**For Full SaaS Experience:**
Let businesses sign up and pay directly.

**Flow:**
1. Business visits `/signup`
2. Enters company name, domain, credit card
3. Payment processed via Stripe
4. Organization created automatically
5. They become Owner immediately

**Implementation Estimate:** 1-2 weeks (requires Stripe integration)

---

## Recommended Immediate Action

### For Launch This Week:

**Use Option A (Manual Firestore Creation) + Enhanced Auth Logic**

1. **Update `authService.lookupOrganization()` to support email matching:**

```javascript
// authService.js
lookupOrganization: async (email, isDemo = false) => {
  if (!email) return null;
  const domain = email.split('@')[1];

  if (isDemo) { /* existing demo logic */ }

  try {
    // Check 1: Domain match
    let q = query(collection(db, 'organizations'), where('domain', '==', domain));
    let snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }

    // Check 2: Multi-domain match
    q = query(collection(db, 'organizations'), where('domains', 'array-contains', domain));
    snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }

    // Check 3: Owner email match
    q = query(collection(db, 'organizations'), where('ownerEmail', '==', email));
    snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }

    // Check 4: Admin email match
    q = query(collection(db, 'organizations'), where('adminEmails', 'array-contains', email));
    snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }

    return null;
  } catch (error) {
    console.error('Error looking up organization:', error);
    throw error;
  }
}
```

2. **Create Firestore index for new queries:**
```
organizations: ownerEmail (ascending)
organizations: adminEmails (array-contains)
```

3. **When business contacts you:**
   - Create organization document manually
   - Provide them the login URL
   - They log in and automatically get admin access

---

## Issue 2: Session Termination Not Working in Live Display

### Current Problem

**Symptom:** When admin clicks "Terminate Session" in TimerInterface, the DisplayView (live presenter monitor) doesn't update and keeps showing the timer.

**Root Cause:** The issue is in demo mode vs production mode handling.

### Current Code Analysis

**TimerContext.js - stopTimer() function:**
```javascript
const stopTimer = async () => {
  if (timerState.sessionId) {
    // ... telemetry logging ...
    
    await timerService.completeSession(timerState.sessionId, currentRoom?.id, isDemo);
    await offlineStorage.clearTimerState();
  }
  // ... reset local state ...
};
```

**timerService.js - completeSession() function:**
```javascript
completeSession: async (sessionId, roomId, isDemo = false) => {
  if (isDemo || !sessionId) return; // ← EXITS EARLY IN DEMO MODE

  try {
    // 1. Update Firestore session
    await updateDoc(doc(db, 'sessions', sessionId), {
      completedAt: firestoreTimestamp(),
      status: 'completed'
    });

    // 2. Clear room status
    // ...

    // 3. Remove from RTDB ← THIS IS THE KEY
    await remove(ref(rtdb, `timers/${sessionId}`));
  } catch (error) {
    console.error('Error completing session:', error);
    throw error;
  }
}
```

**DisplayView.jsx - subscription:**
```javascript
useEffect(() => {
  if (!sessionId || !isAuthed) return;
  const unsubscribe = timerService.subscribeToTimer(sessionId, (data) => {
    setTimerState(data); // ← Updates when RTDB changes
  });
  return () => unsubscribe();
}, [sessionId, isAuthed]);
```

### The Issue

1. ✅ **In Production (Firebase connected):**
   - Admin clicks "Terminate Session"
   - `completeSession()` runs
   - Removes session from RTDB: `remove(ref(rtdb, 'timers/${sessionId}'))`
   - DisplayView subscription fires with `null` data
   - DisplayView shows "Awaiting Signal Transmission"
   - **Works correctly!**

2. ❌ **In Demo Mode (no Firebase):**
   - Admin clicks "Terminate Session"
   - `completeSession()` **exits early** because `isDemo = true`
   - RTDB session **NOT removed**
   - DisplayView **keeps showing old data**
   - **Broken!**

3. ❌ **In Development (Firebase not configured):**
   - Same as demo mode
   - Session data only lives in local state
   - DisplayView never subscribed to real updates
   - **Broken!**

### The Real Question

**"Is it because the app is not deployed yet?"**

**Answer:** Sort of, but more specifically:

- ❌ It's broken because **Firebase is not configured** in your local environment
- ❌ In demo mode, the termination logic is **intentionally skipped**
- ✅ Once deployed with Firebase configured, it **will work correctly**

**However**, there's a design flaw:

**Demo mode should simulate termination behavior** even without Firebase!

---

## Proposed Solution: Fix Demo Mode Termination

### Option 1: Add Demo Termination Logic

Update `timerService.js` to handle demo termination:

```javascript
completeSession: async (sessionId, roomId, isDemo = false) => {
  if (isDemo) {
    // Simulate termination in demo mode
    // Broadcast a termination event via localStorage or custom event
    window.dispatchEvent(new CustomEvent('demo-session-terminated', {
      detail: { sessionId }
    }));
    return;
  }

  if (!sessionId) return;

  try {
    // ... existing Firebase logic ...
  }
}
```

Update `DisplayView.jsx` to listen for demo termination:

```javascript
useEffect(() => {
  const handleDemoTermination = (event) => {
    if (event.detail.sessionId === sessionId) {
      setTimerState(null); // Clear display
    }
  };

  window.addEventListener('demo-session-terminated', handleDemoTermination);
  return () => window.removeEventListener('demo-session-terminated', handleDemoTermination);
}, [sessionId]);
```

### Option 2: Shared State Management (Better)

Use React Context to share demo state between components:

```javascript
// DemoTimerContext.js
const DemoTimerContext = createContext();

export const DemoTimerProvider = ({ children }) => {
  const [demoSessions, setDemoSessions] = useState({});

  const createDemoSession = (sessionId, data) => {
    setDemoSessions(prev => ({ ...prev, [sessionId]: data }));
  };

  const updateDemoSession = (sessionId, updates) => {
    setDemoSessions(prev => ({
      ...prev,
      [sessionId]: { ...prev[sessionId], ...updates }
    }));
  };

  const terminateDemoSession = (sessionId) => {
    setDemoSessions(prev => {
      const updated = { ...prev };
      delete updated[sessionId];
      return updated;
    });
  };

  return (
    <DemoTimerContext.Provider value={{
      demoSessions,
      createDemoSession,
      updateDemoSession,
      terminateDemoSession
    }}>
      {children}
    </DemoTimerContext.Provider>
  );
};
```

Then DisplayView can subscribe to demo state directly.

---

## Recommended Actions

### Immediate (This Week)

1. **Admin Access:**
   - ✅ Use Option A (manual Firestore setup)
   - ✅ Update `lookupOrganization()` to support email matching
   - ✅ Document the manual setup process for your sales flow

2. **Session Termination:**
   - ✅ Implement Option 1 (demo termination events) - **1 hour of work**
   - ✅ Test in demo mode before deployment
   - ✅ Confirm Firebase RTDB is configured in production

### Short-Term (Next 2 Weeks)

1. **Admin Access:**
   - Build basic Super-Admin Portal (Option B)
   - Add organization CRUD interface
   - Secure with super-admin email check

2. **Session Termination:**
   - Migrate to Option 2 (shared state management)
   - Add better error handling
   - Add visual feedback for termination

### Long-Term (Next Quarter)

1. **Admin Access:**
   - Self-service onboarding (Option C)
   - Stripe payment integration
   - Automated organization provisioning

2. **Session Termination:**
   - Add confirmation dialogs
   - Add session archive/history
   - Add session recovery for accidental termination

---

## Testing Plan

### Admin Access Testing

**Test Case 1: Owner Access**
1. Create organization in Firestore with `ownerEmail: "owner@test.com"`
2. Log in as `owner@test.com`
3. ✅ Should see "Owner" role
4. ✅ Should see Admin Terminal
5. ✅ Should see all admin tabs

**Test Case 2: Admin Access**
1. Add email to `adminEmails: ["admin@test.com"]`
2. Log in as `admin@test.com`
3. ✅ Should see "Admin" role
4. ✅ Should see Admin Terminal
5. ❌ Should NOT see Security tab (owner only)

**Test Case 3: Member Access**
1. Log in as `member@test.com` (not in adminEmails)
2. ✅ Should see "Member" role
3. ❌ Should NOT see Admin Terminal
4. ✅ Should only see timer interface

### Session Termination Testing

**Test Case 1: Demo Mode**
1. Start session in demo mode
2. Open DisplayView in new tab
3. Click "Terminate Session"
4. ✅ DisplayView should clear immediately

**Test Case 2: Production Mode**
1. Start session with Firebase
2. Open DisplayView (anonymous auth)
3. Click "Terminate Session"
4. ✅ DisplayView should show "Awaiting Signal"
5. ✅ RTDB session should be removed

**Test Case 3: Network Failure**
1. Start session with Firebase
2. Disconnect internet
3. Click "Terminate Session"
4. ✅ Local state should clear
5. ⚠️ DisplayView will stay stale (expected)
6. Reconnect internet
7. ✅ DisplayView should eventually sync

---

## Summary

### Admin Access
- **Current:** Domain-based, no setup UI
- **Problem:** No way to create organizations when businesses sign up
- **Quick Fix:** Manual Firestore + email matching (1 hour)
- **Proper Fix:** Super-Admin Portal (2-3 days)

### Session Termination
- **Current:** Works in production, broken in demo
- **Problem:** Demo mode skips termination logic
- **Quick Fix:** Add demo termination events (1 hour)
- **Proper Fix:** Shared state management (4 hours)

### Priority

🔴 **HIGH:** Fix demo termination (blocks testing)
🟡 **MEDIUM:** Add email matching to org lookup (blocks sales)
🟢 **LOW:** Build super-admin portal (can wait until post-launch)

---

**Next Steps:**
1. Review this document
2. Decide: Quick fixes only, or invest in proper solutions?
3. If quick fixes: I can implement both in ~2 hours
4. If proper solutions: I can implement in 1 day

Let me know your preference!
