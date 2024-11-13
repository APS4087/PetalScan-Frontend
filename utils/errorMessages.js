// utils/errorMessages.js

const errorMessages = {
  // Authentication Errors
  "auth/claims-too-large":
    "The data you provided is too large. Please reduce the size and try again.",
  "auth/email-already-in-use":
    "This email address is already in use. Please use a different email.",
  "auth/id-token-expired": "Your session has expired. Please log in again.",
  "auth/id-token-revoked":
    "Your session has been revoked. Please log in again.",
  "auth/insufficient-permission":
    "You do not have permission to perform this action. Please contact support.",
  "auth/internal-error":
    "An unexpected error occurred. Please try again later.",
  "auth/invalid-argument":
    "Invalid input provided. Please check and try again.",
  "auth/invalid-claims": "Invalid data provided. Please check and try again.",
  "auth/invalid-continue-uri":
    "Invalid URL provided. Please check and try again.",
  "auth/invalid-creation-time":
    "Invalid creation time provided. Please check and try again.",
  "auth/invalid-credential":
    "Invalid credentials provided. Please check and try again.",
  "auth/invalid-disabled-field":
    "Invalid value for the disabled field. It must be true or false.",
  "auth/invalid-display-name":
    "Invalid display name provided. It must be a non-empty string.",
  "auth/invalid-dynamic-link-domain":
    "Invalid dynamic link domain provided. Please check and try again.",
  "auth/invalid-email":
    "Invalid email address provided. Please check and try again.",
  "auth/invalid-email-verified":
    "Invalid value for email verification. It must be true or false.",
  "auth/invalid-hash-algorithm":
    "Invalid hash algorithm provided. Please check and try again.",
  "auth/invalid-hash-block-size": "Invalid hash block size provided.",
  "auth/invalid-hash-derived-key-length":
    "Invalid hash derived key length provided.",
  "auth/invalid-hash-key": "Invalid hash key provided.",
  "auth/invalid-hash-memory-cost": "Invalid hash memory cost provided.",
  "auth/invalid-hash-parallelization": "Invalid hash parallelization provided.",
  "auth/invalid-hash-rounds": "Invalid hash rounds provided.",
  "auth/invalid-hash-salt-separator": "Invalid hash salt separator provided.",
  "auth/invalid-id-token": "Invalid ID token provided. Please log in again.",
  "auth/invalid-last-sign-in-time": "Invalid last sign-in time provided.",
  "auth/invalid-page-token":
    "Invalid page token provided. Please check and try again.",
  "auth/invalid-password":
    "Invalid password provided. It must be at least six characters long.",
  "auth/invalid-password-hash": "Invalid password hash provided.",
  "auth/invalid-password-salt": "Invalid password salt provided.",
  "auth/invalid-phone-number":
    "Invalid phone number provided. It must be in E.164 format.",
  "auth/invalid-photo-url":
    "Invalid photo URL provided. Please check and try again.",
  "auth/invalid-provider-data":
    "Invalid provider data provided. Please check and try again.",
  "auth/invalid-provider-id":
    "Invalid provider ID provided. Please check and try again.",
  "auth/invalid-oauth-responsetype":
    "Only one OAuth response type should be set to true.",
  "auth/invalid-session-cookie-duration":
    "Invalid session cookie duration provided. It must be between 5 minutes and 2 weeks.",
  "auth/invalid-uid":
    "Invalid user ID provided. It must be a non-empty string with at most 128 characters.",
  "auth/invalid-user-import": "Invalid user data provided for import.",
  "auth/maximum-user-count-exceeded":
    "The maximum number of users to import has been exceeded.",
  "auth/missing-android-pkg-name":
    "An Android Package Name must be provided if the Android App is required to be installed.",
  "auth/missing-continue-uri": "A valid continue URL must be provided.",
  "auth/missing-hash-algorithm":
    "A hashing algorithm and its parameters must be provided for importing users with password hashes.",
  "auth/missing-ios-bundle-id": "A Bundle ID must be provided.",
  "auth/missing-uid": "A user ID is required for this operation.",
  "auth/missing-oauth-client-secret":
    "The OAuth client secret is required to enable OIDC code flow.",
  "auth/operation-not-allowed":
    "This sign-in method is disabled for your Firebase project.",
  "auth/phone-number-already-exists":
    "This phone number is already in use. Please use a different phone number.",
  "auth/project-not-found":
    "No Firebase project was found for the provided credentials.",
  "auth/reserved-claims":
    "One or more custom user claims provided are reserved.",
  "auth/session-cookie-expired":
    "The session cookie has expired. Please log in again.",
  "auth/session-cookie-revoked":
    "The session cookie has been revoked. Please log in again.",
  "auth/too-many-requests": "Too many requests. Please try again later.",
  "auth/uid-already-exists":
    "This user ID is already in use. Please use a different user ID.",
  "auth/unauthorized-continue-uri":
    "The domain of the continue URL is not whitelisted.",
  "auth/user-not-found": "No user found with the provided identifier.",
};

export default errorMessages;
