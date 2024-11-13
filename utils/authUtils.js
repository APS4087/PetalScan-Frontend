// utils/authUtils.js
import errorMessages from "./errorMessages";

// Function to get custom error message based on error code
export const getCustomErrorMessage = (error) => {
  return (
    errorMessages[error.code] || "An unknown error occurred. Please try again."
  );
};
