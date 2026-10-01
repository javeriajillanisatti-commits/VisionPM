import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import PublicButton from "../buttons/PublicButton";

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  // Handle email input
  const handleEmailChange = (e) => {
    const value = e.target.value;

    if (value.length > 50) return;

    setEmail(value);
    setError("");
  };

  // Validate email
  const validateEmail = () => {
    const value = email.trim();
    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!value) {
      setError("Email is required");
      return false;
    }

    if (value.length > 50) {
      setError("Email cannot exceed 50 characters");
      return false;
    }

    if (
      !emailRegex.test(value) ||
      value.includes("..") ||
      value.startsWith(".") ||
      value.endsWith(".")
    ) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateEmail()) return;

    try {
      setLoading(true);

      await axios.post(
         `${process.env.REACT_APP_API_URL}/api/auth/forgot-password`,
        {
          email: email.trim().toLowerCase(),
        }
      );

      setIsSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md border border-gray-100 text-gray-900">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Forgot Password
      </h2>

      {isSuccess ? (
        <div className="text-center">
          <div className="bg-green-50 text-green-600 font-bold rounded-xl p-4 mb-4 border border-green-100">
            Reset link sent! Check your email.
          </div>

          <Link
            to="/login"
            className="text-blue-600 hover:underline text-sm font-semibold"
          >
            Back to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-medium">
              Enter Registered Email
            </label>

            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your registered email"
              maxLength={50}
              className={`w-full px-4 py-2 bg-white text-gray-900 border rounded-lg focus:outline-none focus:ring-2 font-medium ${
                error
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />

            {error && (
              <p className="text-red-500 text-sm mt-2 font-bold">{error}</p>
            )}
          </div>

          <PublicButton
            text={loading ? "Sending..." : "Send Reset Link"}
            type="submit"
          />
        </form>
      )}

      <p className="text-center mt-4 text-sm text-gray-600">
        Remembered your password?{" "}
        <Link
          to="/login"
          className="text-blue-600 hover:underline font-semibold ml-1"
        >
          Back to Login
        </Link>
      </p>
    </div>
  );
};

export default ForgotPasswordForm;