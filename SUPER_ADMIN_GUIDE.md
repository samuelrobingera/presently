# Super-Admin Portal User Guide

**Date:** June 27, 2026  
**Version:** 1.0  
**Status:** ✅ Implemented

---

## Overview

The Super-Admin Portal is a powerful platform-wide management interface accessible only to designated super-administrators. It provides comprehensive control over all organizations using Presently.

### Key Features

- ✅ **Organization Management**: Create, edit, and delete organizations
- ✅ **Owner Assignment**: Set owner emails that automatically grant admin access on first login
- ✅ **Multi-Admin Support**: Add multiple admin emails per organization
- ✅ **Subscription Management**: Configure plans, pricing, and room licenses
- ✅ **Real-Time Search**: Find organizations by name, domain, or email
- ✅ **Statistics Dashboard**: Track total organizations, revenue, and users
- ✅ **Email-Based Access**: Works with any email (Gmail, Yahoo, etc.)

---

## Accessing the Super-Admin Portal

### Step 1: Configure Super-Admin Access

Edit `/src/utils/superAdmin.js` and add your email to the list:

```javascript
const SUPER_ADMIN_EMAILS = [
  'samuelrobingera@gmail.com',           // Your email
  'hello@buildplaylearn.xyz',          // Add more as needed
];
```

### Step 2: Login

1. Navigate to https://presently.app (or http://localhost:3000 for local dev)
2. Click "Login" and sign in with Google/Facebook
3. Once authenticated, you'll see a **"Super-Admin"** button in the top navigation
4. Click it to enter the portal

### Step 3: Portal Access

**URL:** `/super-admin`

**Access Control:**
- ✅ Only users in `SUPER_ADMIN_EMAILS` list can access
- ❌ Non-super-admins are redirected to `/app`
- ❌ Unauthenticated users are redirected to `/login`

---

## Creating an Organization

When a business contacts you to sign up, follow these steps:

### Manual Process (Current Implementation)

1. Click **"New Organization"** button
2. Fill in the form:

**Basic Information:**
- **Organization Name** (required): `Hilton Hotels`
- **Primary Domain** (required): `hilton.com`
- **Owner Email** (required): `admin@hilton.com`

**Admin Emails** (optional):
- Add additional admin emails: `manager@hilton.com`, `tech@hilton.com`
- These users will get admin access when they log in

**Subscription:**
- **Plan**: Starter / Professional / Enterprise / Enterprise Pro
- **Status**: Active / Pending / Suspended / Cancelled
- **Room Licenses**: Number of rooms they can create (e.g., 50)
- **Price/Month**: Monthly cost in USD (e.g., $499.00)

3. Click **"Create Organization"**

### What Happens Next

1. **Owner First Login:**
   - When `admin@hilton.com` logs in, the system:
     - Finds the organization by `ownerEmail`
     - Sets `ownerId` to their Firebase UID
     - Grants them **Owner** role
     - Shows them the Admin Terminal

2. **Admin First Login:**
   - When `manager@hilton.com` logs in, the system:
     - Finds the organization by email in `adminEmails` array
     - Adds their Firebase UID to `adminIds`
     - Grants them **Admin** role
     - Shows them the Admin Terminal (with limited permissions)

3. **Member Login:**
   - When someone else at `@hilton.com` logs in:
     - Finds organization by domain match
     - Grants them **Member** role
     - Cannot access Admin Terminal

---

## Organization Management

### Viewing Organizations

**Dashboard Stats:**
- Total Organizations
- Active Subscriptions
- Total Admins
- Monthly Revenue

**Organization List:**
- Name, Domain, Owner Email
- Subscription Plan, Room Count, Monthly Price
- Admin Emails
- Status (Active, Pending, Suspended)

### Searching Organizations

Use the search bar to filter by:
- Organization name: "Hilton"
- Domain: "hilton.com"
- Owner/Admin email: "admin@hilton.com"

### Editing an Organization

1. Click the **Edit** (pencil) icon on the organization card
2. Update any fields
3. Click **"Update Organization"**

**Common Edits:**
- Add/remove admin emails
- Change subscription plan
- Update pricing
- Increase room licenses
- Change status (suspend, reactivate)

### Deleting an Organization

1. Click the **Delete** (trash) icon
2. Confirm deletion
3. Organization is **soft-deleted** (marked as `active: false`)

**Note:** Deleted organizations are hidden but not permanently removed from Firestore.

---

## Multi-Tenant Access Control

### How Organization Lookup Works

When a user logs in, the system tries these strategies in order:

1. **Domain Match**: `user@acme.com` → finds org with `domain: "acme.com"`
2. **Multi-Domain Match**: Checks `domains` array for alternate domains
3. **Owner Email Match**: Exact match on `ownerEmail` field
4. **Admin Email Match**: Checks if email is in `adminEmails` array

### Supporting Generic Email Domains

**Problem:** Gmail/Yahoo users can't be matched by domain.

**Solution:** Use Owner Email or Admin Email matching.

**Example:**

```javascript
// Organization for a small business owner
{
  name: "Joe's Coffee Shop",
  domain: "joescoffee.com",  // Website domain
  ownerEmail: "joe@gmail.com",  // ← Personal Gmail!
  adminEmails: ["sarah@yahoo.com"],  // ← Personal Yahoo!
  ...
}
```

When `joe@gmail.com` logs in:
- ❌ Domain match fails (no org has `domain: "gmail.com"`)
- ✅ Owner email match succeeds
- ✅ Joe gets Owner access

---

## Role-Based Access Control (RBAC)

### Roles Hierarchy

```
Super-Admin (Platform)
    ↓
Owner (Organization)
    ↓
Admin (Organization)
    ↓
Member (Organization)
```

### Permissions Matrix

| Feature | Super-Admin | Owner | Admin | Member |
|---------|-------------|-------|-------|--------|
| Access Super-Admin Portal | ✅ | ❌ | ❌ | ❌ |
| Create Organizations | ✅ | ❌ | ❌ | ❌ |
| Delete Organizations | ✅ | ❌ | ❌ | ❌ |
| Access Admin Terminal | ✅ | ✅ | ✅ | ❌ |
| Manage Rooms | ✅ | ✅ | ✅ | ❌ |
| Manage Phase Templates | ✅ | ✅ | ✅ | ❌ |
| View Billing | ✅ | ✅ | ❌ | ❌ |
| Manage SSO/Security | ✅ | ✅ | ❌ | ❌ |
| Start Timer Sessions | ✅ | ✅ | ✅ | ✅ |

### Role Assignment

**Owner:**
- Set via `ownerEmail` when creating organization
- Automatically assigned on first login
- Only ONE owner per organization

**Admin:**
- Add emails to `adminEmails` array
- Automatically assigned on first login
- Multiple admins allowed

**Member:**
- Anyone with matching email domain
- No special configuration needed
- Read-only access to timer

---

## Subscription Plans

### Available Plans

| Plan | Room Licenses | Price/Month | Target Customer |
|------|---------------|-------------|-----------------|
| Starter | 5 | $49.00 | Small businesses |
| Professional | 15 | $149.00 | Mid-size companies |
| Enterprise | 50 | $499.00 | Large venues |
| Enterprise Pro | 100+ | Custom | Hotel chains |

### Managing Subscriptions

**Activate Subscription:**
```javascript
subscription: {
  plan: "Enterprise",
  status: "active",
  roomLicenses: 50,
  pricePerMonth: 499.00,
  startDate: "2026-07-01",
  nextBillingDate: "2026-08-01"
}
```

**Suspend Subscription:**
```javascript
subscription: {
  ...
  status: "suspended"  // User can't create new rooms
}
```

**Cancel Subscription:**
```javascript
subscription: {
  ...
  status: "cancelled"  // Org effectively disabled
}
```

---

## Common Workflows

### Workflow 1: New Enterprise Customer

**Scenario:** Hilton Hotels signs up for Enterprise Pro plan.

**Steps:**
1. Hilton contacts you via sales@presently.app
2. You collect:
   - Company name: "Hilton Hotels"
   - Email domain: "hilton.com"
   - IT Admin contact: "it-admin@hilton.com"
   - Event Managers: "events-team@hilton.com", "ops@hilton.com"
   - Number of rooms: 75 rooms across 3 properties
   - Negotiated price: $599/month

3. In Super-Admin Portal:
   - Click "New Organization"
   - Name: Hilton Hotels
   - Domain: hilton.com
   - Owner Email: it-admin@hilton.com
   - Admin Emails: events-team@hilton.com, ops@hilton.com
   - Plan: Enterprise Pro
   - Room Licenses: 75
   - Price/Month: $599.00
   - Status: Active
   - Click "Create Organization"

4. Send welcome email to `it-admin@hilton.com`:
   - Login URL: https://presently.app
   - Instructions to log in with Google/Facebook
   - Mention they'll have full admin access

5. Owner logs in → automatically gets Owner role → can manage all rooms

### Workflow 2: Add Admin to Existing Org

**Scenario:** Hilton hires a new event coordinator who needs admin access.

**Steps:**
1. Hilton contacts you: "Please add sarah@hilton.com as admin"
2. In Super-Admin Portal:
   - Search for "Hilton"
   - Click Edit button
   - Under "Admin Emails", add: sarah@hilton.com
   - Click "Update Organization"
3. Tell Hilton: "Sarah can now log in and will have admin access"

### Workflow 3: Downgrade Subscription

**Scenario:** Customer wants to reduce from Enterprise to Professional.

**Steps:**
1. Edit organization
2. Change:
   - Plan: Professional
   - Room Licenses: 15
   - Price/Month: $149.00
3. Save
4. System enforces new room limit on next session creation

### Workflow 4: Individual Consultant

**Scenario:** Freelance speaker wants to use Presently with personal Gmail.

**Steps:**
1. They contact you, provide: `speaker@gmail.com`
2. Create organization:
   - Name: "John Speaker Consulting"
   - Domain: "johnspeaker.com" (their website, if they have one)
   - Owner Email: speaker@gmail.com ← Gmail works!
   - Plan: Starter
   - Room Licenses: 5
   - Price/Month: $49.00
3. They log in with Gmail → automatically recognized → get Owner access

---

## Demo Mode

### Purpose
Test the Super-Admin Portal without Firebase.

### Demo Data

Two demo organizations are pre-loaded:

**Acme Corp:**
- Domain: acme.com
- Owner: admin@acme.com
- Plan: Enterprise Pro
- 50 room licenses

**TechStart Inc:**
- Domain: techstart.io
- Owner: founder@techstart.io
- Plan: Startup
- 10 room licenses

### Limitations in Demo Mode
- ❌ Changes don't persist (refresh resets)
- ❌ No real Firebase writes
- ❌ Stats may be mocked
- ✅ Full UI testing works

---

## Security Considerations

### Firestore Security Rules

**Required Rules** (add to `firestore.rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function
    function isSuperAdmin() {
      return request.auth != null && request.auth.token.email in [
        'samuelrobingera@gmail.com',
        'hello@buildplaylearn.xyz'
      ];
    }

    // Organizations collection
    match /organizations/{orgId} {
      // Read: authenticated users in the org OR super-admins
      allow read: if request.auth != null &&
        (request.auth.token.email == resource.data.ownerEmail ||
         request.auth.token.email in resource.data.adminEmails ||
         request.auth.uid == resource.data.ownerId ||
         request.auth.uid in resource.data.adminIds ||
         isSuperAdmin());

      // Write: only super-admins
      allow create, update, delete: if isSuperAdmin();
    }
  }
}
```

### Required Firestore Indexes

```javascript
// Composite index for organization queries
organizations:
  - ownerEmail (ascending)
  - adminEmails (array-contains)
  - domain (ascending)
  - active (ascending)
```

Create these via Firebase Console → Firestore → Indexes.

---

## Troubleshooting

### Issue: Can't Access Super-Admin Portal

**Symptom:** Button doesn't appear or redirected to `/app`

**Solution:**
1. Check `/src/utils/superAdmin.js` contains your email
2. Log out and log back in
3. Open browser console, check: `isSuperAdminUser` in AuthContext

### Issue: Organization Not Found After Creation

**Symptom:** Created org but owner can't find it when logging in

**Solution:**
1. Check `ownerEmail` matches exactly (case-sensitive)
2. Check `domain` is correct
3. Verify Firestore security rules allow read access
4. Check Firestore Indexes are created

### Issue: Member Gets Admin Access

**Symptom:** Regular employee sees Admin Terminal

**Solution:**
1. Check they're not in `adminEmails` array
2. Check their UID is not in `adminIds`
3. Verify they're not the `ownerId`
4. Re-check role assignment logic in `AuthContext.js`

### Issue: Can't Edit Organization

**Symptom:** Edit button doesn't work or changes don't save

**Solution:**
1. Check Firestore security rules allow super-admin writes
2. Check Firebase console for errors
3. Verify super-admin email list matches Firestore rules

---

## Production Deployment Checklist

### Before Launch

- [ ] Update `SUPER_ADMIN_EMAILS` with production emails
- [ ] Deploy Firestore security rules
- [ ] Create required Firestore indexes
- [ ] Test organization creation flow
- [ ] Test owner/admin login flow
- [ ] Verify RBAC permissions work correctly

### Post-Launch

- [ ] Monitor Firestore for unauthorized access attempts
- [ ] Set up alerts for failed super-admin auth attempts
- [ ] Document internal process for adding super-admins
- [ ] Train support team on organization setup

---

## API Reference

### superAdminService

```javascript
import { superAdminService } from './services/superAdminService';

// Get all organizations
const orgs = await superAdminService.getAllOrganizations(isDemo);

// Get specific organization
const org = await superAdminService.getOrganization(orgId, isDemo);

// Create organization
const newOrg = await superAdminService.createOrganization({
  name: "Company Name",
  domain: "company.com",
  ownerEmail: "owner@company.com",
  adminEmails: ["admin1@company.com"],
  subscription: {
    plan: "Enterprise",
    status: "active",
    roomLicenses: 50,
    pricePerMonth: 499.00
  }
}, isDemo);

// Update organization
await superAdminService.updateOrganization(orgId, {
  subscription: { ...updates }
}, isDemo);

// Delete organization (soft delete)
await superAdminService.deleteOrganization(orgId, isDemo);

// Search organizations
const results = await superAdminService.searchOrganizations("search term", isDemo);

// Validate organization data
const validation = superAdminService.validateOrganization(orgData);
// Returns: { isValid: boolean, errors: string[] }
```

---

## Future Enhancements

### Planned Features (Not Yet Implemented)

1. **Stripe Integration**
   - Automated subscription billing
   - Payment collection
   - Invoice generation

2. **Email Automation**
   - Welcome emails to new owners
   - Subscription renewal reminders
   - Usage reports

3. **Advanced Analytics**
   - Revenue trends
   - Customer lifetime value
   - Churn analysis

4. **Audit Logging**
   - Track all super-admin actions
   - Organization change history
   - User access logs

5. **Bulk Operations**
   - CSV import for organizations
   - Bulk subscription updates
   - Mass email notifications

---

## Support

### For Super-Admins

- **Email:** support@presently.app
- **Internal Slack:** #presently-super-admins
- **Documentation:** This guide

### For Customers

Direct them to:
- **Support:** help@presently.app
- **Documentation:** https://docs.presently.app
- **Status Page:** https://status.presently.app

---

**Last Updated:** June 27, 2026  
**Version:** 1.0  
**Author:** Presently Development Team
