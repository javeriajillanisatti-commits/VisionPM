import React, { useState, useEffect } from "react";

import logo from "../../components/assets/logo.png";
import PublicButton from "../buttons/PublicButton";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const LoginForm = () => {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [message, setMessage] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Handle messages passed from routing states
  useEffect(() => {
    if (location.state?.fromSignup && !location.state?.invitedUser) {
      setMessage(
        "Please check your email and verify your account before login."
      );
    }

    if (location.state?.verified) {
      setMessage("Email verified successfully! Now you can login.");
    }
  }, [location.state]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "email" && value.length > 50) {
      return;
    }

    if (name === "password" && value.length > 50) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setError("");
    setLoginSuccess(false);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    const email = formData.email.trim();
    const password = formData.password;

    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email) {
      errors.email = "Email is required";
    } else if (email.length > 50) {
      errors.email = "Email cannot exceed 50 characters";
    } else if (!emailRegex.test(email)) {
      errors.email = "Please enter a valid email address";
    } else if (email.includes("..")) {
      errors.email = "Please enter a valid email address";
    } else if (email.startsWith(".") || email.endsWith(".")) {
      errors.email = "Please enter a valid email address";
    }

    if (!password.trim()) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must contain at least 8 characters";
    } else if (password.length > 50) {
      errors.password = "Password cannot exceed 50 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoginSuccess(false);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
         `${process.env.REACT_APP_API_URL}/api/auth/login`,
        {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }
      );

      loginUser(response.data.token, response.data.user);

      console.log("LOGIN TOKEN:", response.data.token);

      const role = response.data.user.role;
      sessionStorage.setItem("role", role);

      // Show success message like the other forms.
      setLoginSuccess(true);

      // Keep the success message visible for 2 seconds,
      // then navigate according to the user's role.
      window.setTimeout(() => {
        if (role === "Super Admin") {
          navigate("/super-admin");
        } else if (role === "Project Admin") {
          navigate("/project-admin");
        } else if (role === "Project Manager") {
          navigate("/project-manager");
        } else if (role === "Team Member") {
          navigate("/team-member");
        }
      }, 1000);
    } catch (error) {
      setLoginSuccess(false);
      setError(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-white border border-gray-100 shadow-lg rounded-2xl p-4 min-[375px]:p-5 sm:p-8 w-full max-w-md mx-auto transition-all duration-200 overflow-hidden">
      {/* Success Message */}
      {loginSuccess && (
        <div className="absolute top-0 left-0 w-full bg-green-500 text-white py-2 text-center text-xs font-bold animate-in slide-in-from-top z-50">
           Login successful!
        </div>
      )}

      {/* Logo */}
      <div className="flex justify-center mb-4 sm:mb-6">
        <img
          src={logo}
          alt="Logo"
          className="h-11 sm:h-14 w-auto"
        />
      </div>

      {/* Heading */}
      <h2 className="text-xl min-[375px]:text-2xl font-bold text-center mb-6 sm:mb-8 text-gray-800 tracking-tight">
        Sign in
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 sm:space-y-6"
        noValidate
      >
        {/* Email Field */}
        <div className="relative">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder=" "
            maxLength={50}
            className={`peer w-full border rounded-lg px-3 py-3 focus:outline-none focus:ring-2 transition-all bg-transparent text-gray-900 ${
              fieldErrors.email
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />

          <label
            className={`absolute left-3 -top-2.5 bg-white px-1 text-sm transition-all duration-200 pointer-events-none
              peer-placeholder-shown:top-3 peer-placeholder-shown:text-base
              peer-focus:-top-2.5 peer-focus:text-sm
              ${
                fieldErrors.email
                  ? "text-red-500"
                  : "text-gray-400 peer-focus:text-blue-600 peer-[:not(:placeholder-shown)]:text-blue-600"
              }`}
          >
            Email
            <span className="text-red-500 font-bold text-xs ml-0.5">*</span>
          </label>

          {fieldErrors.email && (
            <p className="text-red-500 text-sm mt-2 font-medium">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder=" "
            maxLength={50}
            className={`peer w-full border rounded-lg px-3 py-3 pr-12 focus:outline-none focus:ring-2 transition-all bg-transparent text-gray-900 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${
              fieldErrors.password
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />

          <label
            className={`absolute left-3 -top-2.5 bg-white px-1 text-sm transition-all duration-200 pointer-events-none
              peer-placeholder-shown:top-3 peer-placeholder-shown:text-base
              peer-focus:-top-2.5 peer-focus:text-sm
              ${
                fieldErrors.password
                  ? "text-red-500"
                  : "text-gray-400 peer-focus:text-blue-600 peer-[:not(:placeholder-shown)]:text-blue-600"
              }`}
          >
            Password
            <span className="text-red-500 font-bold text-xs ml-0.5">*</span>
          </label>

          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>

          {fieldErrors.password && (
            <p className="text-red-500 text-sm mt-2 font-medium">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Routing Success / Info Message */}
        {message && !loginSuccess && (
          <p className="text-green-600 text-sm font-medium text-center leading-5">
            {message}
          </p>
        )}

        {/* Login Error */}
        {error && (
          <p className="text-red-500 text-sm font-bold text-center leading-5">
            {error}
          </p>
        )}

        {/* Submit Button */}
        <PublicButton
          type="submit"
          text={loading ? "SIGNING IN..." : "SIGN IN"}
        />
      </form>

      {/* Footer Navigation */}
      <div className="mt-6 sm:mt-8 flex flex-col items-center justify-center gap-3 text-sm w-full text-center">
        <Link
          to="/forgot-password"
          className="text-blue-600 hover:underline whitespace-nowrap text-center"
        >
          Forgot password?
        </Link>

        <p className="text-gray-600 text-center leading-5 break-words">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-blue-600 hover:underline font-semibold ml-1"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
