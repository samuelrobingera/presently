import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const GOOGLE_PROVIDER = new GoogleAuthProvider();
const FACEBOOK_PROVIDER = new FacebookAuthProvider();

export const authService = {
  subscribeToAuthChanges: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  login: async (providerName, isDemo = false) => {
    if (isDemo) {
      return {
        uid: 'demo_user_' + Date.now(),
        displayName: `Demo User (${providerName})`,
        email: `demo@${providerName}.com`,
        isDemo: true
      };
    }

    let provider;
    if (providerName === 'google') {
      provider = GOOGLE_PROVIDER;
      provider.addScope('profile');
      provider.addScope('email');
    } else if (providerName === 'facebook') {
      provider = FACEBOOK_PROVIDER;
      provider.addScope('email');
    }

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Update user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastLogin: serverTimestamp(),
      provider: providerName
    }, { merge: true });

    return user;
  },

  logout: async (isDemo = false) => {
    if (!isDemo) {
      await signOut(auth);
    }
  },

  lookupOrganization: async (email, isDemo = false) => {
    if (!email) return null;
    const domain = email.split('@')[1];

    if (isDemo) {
      if (domain === 'acme.com') {
        return {
          id: 'org1',
          name: 'Acme Corp',
          domain: 'acme.com',
          ownerId: 'demo_user_acme',
          ownerEmail: 'admin@acme.com',
          adminIds: [],
          adminEmails: ['manager@acme.com', 'tech@acme.com'],
          settings: { ssoEnabled: true },
          subscription: { plan: 'Enterprise Pro', status: 'active', nextBillingDate: '2026-06-01' },
          paymentHistory: [{ id: 'inv_1', date: '2026-05-01', amount: 499.00, status: 'paid' }]
        };
      }
      return null;
    }

    try {
      // Strategy 1: Try domain match (primary method for corporate domains)
      let q = query(
        collection(db, 'organizations'),
        where('active', '==', true),
        where('domain', '==', domain)
      );
      let snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const orgDoc = snapshot.docs[0];
        return { id: orgDoc.id, ...orgDoc.data() };
      }

      // Strategy 2: Try multi-domain match (for orgs with multiple domains)
      q = query(
        collection(db, 'organizations'),
        where('active', '==', true),
        where('domains', 'array-contains', domain)
      );
      snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const orgDoc = snapshot.docs[0];
        return { id: orgDoc.id, ...orgDoc.data() };
      }

      // Strategy 3: Try owner email exact match
      q = query(
        collection(db, 'organizations'),
        where('active', '==', true),
        where('ownerEmail', '==', email)
      );
      snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const orgDoc = snapshot.docs[0];
        return { id: orgDoc.id, ...orgDoc.data() };
      }

      // Strategy 4: Try admin emails array match
      q = query(
        collection(db, 'organizations'),
        where('active', '==', true),
        where('adminEmails', 'array-contains', email)
      );
      snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const orgDoc = snapshot.docs[0];
        return { id: orgDoc.id, ...orgDoc.data() };
      }

      // No organization found
      return null;
    } catch (error) {
      console.error('Error looking up organization:', error);
      throw error;
    }
  },

  getUserSettings: async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() ? userDoc.data().settings : null;
    } catch (error) {
      console.error('Error getting user settings:', error);
      return null;
    }
  },

  saveUserSettings: async (userId, settings) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving user settings:', error);
      throw error;
    }
  }
};
