/**
 * Helper script to initialize Firestore with sample room data.
 * Copy and paste this into your browser console while running Presently
 * on your live domain or localhost.
 */
window.setupPresentlyData = async () => {
  if (!window.firebase) {
    console.error("Firebase SDK not found on window.");
    return;
  }

  const db = window.firebase.firestore();
  
  // 1. Setup Organization with Admin/Owner roles and Billing
  const orgs = [
    { 
      id: 'org1', 
      name: 'Acme Corp', 
      domain: 'acme.com', 
      ownerId: 'admin-uid-1',
      adminIds: ['admin-uid-2'],
      settings: { ssoEnabled: true },
      ssoConfig: {
        provider: 'Okta',
        entryPoint: 'https://acme.okta.com/app/saml/presently',
        issuer: 'http://www.okta.com/exk...',
      },
      subscription: {
        plan: 'Enterprise Pro',
        status: 'active',
        nextBillingDate: '2026-06-01',
        paymentMethod: 'Visa ending in 4242'
      },
      paymentHistory: [
        { id: 'inv_1', date: '2026-05-01', amount: 499.00, status: 'paid' },
        { id: 'inv_2', date: '2026-04-01', amount: 499.00, status: 'paid' }
      ]
    },
    { 
      id: 'org2', 
      name: 'Globex', 
      domain: 'globex.com', 
      ownerId: 'globex-owner-1',
      adminIds: [],
      settings: { ssoEnabled: false } 
    }
  ];

  console.log("Initializing Organizations...");
  for (const org of orgs) {
    await db.collection('organizations').doc(org.id).set({
      ...org,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  // 2. Setup Rooms with Org IDs and Assigned Emails
  const rooms = [
    { name: 'Executive Boardroom', capacity: 12, available: true, active: true, orgId: 'org1', allowedEmails: [] },
    { name: 'Focus Room A', capacity: 4, available: true, active: true, orgId: 'org1', allowedEmails: [] },
    { name: 'The Auditorium', capacity: 200, available: true, active: true, orgId: 'org1', allowedEmails: [] },
    { 
      name: 'External Workshop Room', 
      capacity: 20, 
      available: true, 
      active: true, 
      orgId: 'org1', 
      allowedEmails: ['partner@external.com', 'speaker@guest.com'] 
    },
    { name: 'Globex Hub', capacity: 30, available: true, active: true, orgId: 'org2', allowedEmails: [] }
  ];

  console.log("Initializing Rooms...");
  for (const room of rooms) {
    await db.collection('rooms').add({
      ...room,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  // 3. Setup Sample Booking (2 minutes from now)
  const startTime = new Date(Date.now() + 2 * 60000);
  const endTime = new Date(startTime.getTime() + 45 * 60000);

  const bookings = [
    {
      roomId: 'room1', // This will be updated if we find the room doc later, but for demo we use a placeholder or known ID
      orgId: 'org1',
      userId: 'demo-user',
      userName: 'Demo Speaker',
      startTime: window.firebase.firestore.Timestamp.fromDate(startTime),
      endTime: window.firebase.firestore.Timestamp.fromDate(endTime),
      phaseConfig: {
        preparationTime: 5,
        presentationTime: 30,
        qaTime: 10
      },
      status: 'scheduled'
    }
  ];

  console.log("Initializing Sample Bookings...");
  for (const booking of bookings) {
    await db.collection('bookings').add({
      ...booking,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  console.log("Initialization complete! Refresh the page to see the rooms and scheduled sessions.");
};

console.log("setupPresentlyData script loaded. Run 'setupPresentlyData()' in console to initialize rooms.");
