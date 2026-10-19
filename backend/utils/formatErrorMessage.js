const UNSAFE_NETWORK_CODES = [
  "ENETUNREACH",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "ENOTFOUND",
  "ECONNRESET",
  "EHOSTUNREACH",
];

const formatErrorMessage = (error) => {
  if (!error) return "Something went wrong. Please try again.";

  if (error.code === 11000) {
    const field = error.keyValue ? Object.keys(error.keyValue)[0] : null;
    if (field === "email") {
      return "An account with this email already exists.";
    }
    return field
      ? `This ${field} is already in use.`
      : "This record already exists.";
  }

  if (error.name === "ValidationError") {
    const firstError = Object.values(error.errors || {})[0];
    return firstError?.message || "The submitted data is invalid.";
  }

  if (
    UNSAFE_NETWORK_CODES.includes(error.code) ||
    error.name === "MongoNetworkError" ||
    error.name === "MongooseServerSelectionError"
  ) {
    return "Something went wrong on our end. Please try again in a moment.";
  }

  return error.message || "Something went wrong. Please try again.";
};

module.exports = formatErrorMessage;