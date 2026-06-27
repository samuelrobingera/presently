/**
 * Super-Admin Utilities
 *
 * Manages super-admin authentication and authorization.
 * Super-admins have platform-wide access to manage all organizations.
 *
 * SECURITY NOTE:
 * Update SUPER_ADMIN_EMAILS with your actual email addresses.
 * This list should be stored securely in production (environment variables or Firebase Config).
 */

// List of email addresses with super-admin privileges
// TODO: Move to environment variable in production
const SUPER_ADMIN_EMAILS = [
  'samuelrobingera@gmail.com',    // Primary super-admin
  'hello@buildplaylearn.xyz',     // Secondary super-admin
  // Add more super-admin emails here
];

/**
 * Check if an email has super-admin privileges
 * @param {string} email - User email address
 * @returns {boolean} True if user is super-admin
 */
export const isSuperAdmin = (email) => {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
};

/**
 * Check if a user object has super-admin privileges
 * @param {object} user - User object with email property
 * @returns {boolean} True if user is super-admin
 */
export const isUserSuperAdmin = (user) => {
  return user && user.email && isSuperAdmin(user.email);
};

/**
 * Get list of super-admin emails (for display purposes only)
 * @returns {string[]} Array of super-admin emails
 */
export const getSuperAdminEmails = () => {
  return [...SUPER_ADMIN_EMAILS];
};

/**
 * Firestore security rules for super-admin
 * Copy this to your firestore.rules file:
 *
 * ```
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // Helper function to check super-admin status
 *     function isSuperAdmin() {
 *       return request.auth.token.email in [
 *         'thummmal@gmail.com',
 *         'admin@presently.app'
 *       ];
 *     }
 *
 *     // Organizations collection
 *     match /organizations/{orgId} {
 *       // Read: authenticated users in the org
 *       allow read: if request.auth != null &&
 *         (request.auth.token.email == resource.data.ownerEmail ||
 *          request.auth.token.email in resource.data.adminEmails ||
 *          request.auth.uid == resource.data.ownerId ||
 *          request.auth.uid in resource.data.adminIds);
 *
 *       // Write: only super-admins
 *       allow create, update, delete: if request.auth != null && isSuperAdmin();
 *     }
 *   }
 * }
 * ```
 */
