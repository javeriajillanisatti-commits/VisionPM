import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, Circle } from "lucide-react";
import PublicButton from "../buttons/PublicButton";
import logo from "../../components/assets/logo.png";
import axios from "axios";

const SignupForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [cvFile, setCvFile] = useState(null);
  const [cvError, setCvError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInvitedUser, setIsInvitedUser] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "Project Admin",
    token: "",
  });

  // Password requirements
  const passCriteria = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*]/.test(formData.password),
  };

  const allMet = Object.values(passCriteria).every(Boolean);

  // Full name validation
  const validateFullName = name => {
    const value = name.trim();

    if (!value) {
      return "Name is required";
    }

    if (value.length < 3) {
      return "Name must be at least 3 characters";
    }

    if (value.length > 50) {
      return "Name must not exceed 50 characters";
    }

    if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(value)) {
      return "Please enter a valid name";
    }

    const lettersOnly = value
      .replace(/[^A-Za-z]/g, "")
      .toLowerCase();

    if (/(.)\1{3,}/i.test(lettersOnly)) {
      return "Please enter a meaningful name";
    }

    if (
      lettersOnly.length >= 3 &&
      new Set(lettersOnly).size === 1
    ) {
      return "Please enter a meaningful name";
    }

    return "";
  };

  // Verify invitation token
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get("token");

    const verifyInvitationToken = async tokenValue => {
      try {
        const emailFromUrl = params.get("email") || "";

        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/invites/verify/${tokenValue}?email=${encodeURIComponent(
            emailFromUrl
          )}`
        );

        const inviteData =
          response.data?.invite || response.data || {};

        if (inviteData) {
          setFormData(prev => ({
            ...prev,
            email: inviteData.email || "",
            role: inviteData.role || "Team Member",
            token: tokenValue,
          }));

          setIsInvitedUser(true);
        }
      } catch (err) {
        console.error("Token checking failed:", err);

        setErrors({
          general:
            err.response?.data?.message ||
            "Invitation link is invalid or expired.",
        });
      }
    };

    if (urlToken) {
      verifyInvitationToken(urlToken);
    }
  }, [location]);

  // Handle input changes
  const handleChange = e => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Submit form
  const handleSubmit = async e => {
    e.preventDefault();

    const newErrors = {};

    const fullNameError = validateFullName(
      formData.fullName
    );

    if (fullNameError) {
      newErrors.fullName = fullNameError;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Invalid email (name@domain.com)";
    }

    if (!allMet) {
      newErrors.password = "Requirements not met";
    }

    let hasCvError = false;

    if (
      !isInvitedUser &&
      formData.role === "Project Admin" &&
      !cvFile
    ) {
      setCvError("CV is required");
      hasCvError = true;
    } else {
      setCvError("");
    }

    setErrors(newErrors);

    if (
      Object.keys(newErrors).length > 0 ||
      hasCvError
    ) {
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();

      data.append(
        "fullName",
        formData.fullName.trim()
      );
      data.append("email", formData.email.trim());
      data.append("password", formData.password);
      data.append("role", formData.role);
      data.append("token", formData.token);

      if (
        !isInvitedUser &&
        formData.role === "Project Admin" &&
        cvFile
      ) {
        data.append("cv", cvFile);
      }

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/signup`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setIsSuccess(true);

      setTimeout(() => {
        navigate("/login", {
          state: {
            fromSignup: true,
            invitedUser: isInvitedUser,
          },
        });
      }, 1000);
    } catch (error) {
      setErrors({
        general:
          error.response?.data?.message ||
          "Signup failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-[460px] bg-white shadow-lg rounded-2xl p-8 sm:p-12 flex flex-col items-center border border-gray-100 relative transition-all duration-200">
        {/* Success Message */}
        {isSuccess && (
          <div className="absolute top-0 left-0 w-full bg-green-500 text-white py-3 px-4 text-center text-sm font-bold z-50">
            {isInvitedUser
              ? "Account created successfully! You can now login."
              : "Account created successfully! Your account is waiting for Super Admin approval."}
          </div>
        )}

        {/* Logo */}
        <div className="mb-4">
          <img
            src={logo}
            alt="Logo"
            className="h-12"
          />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">
          Sign up
        </h2>

        <form
          className="w-full space-y-6"
          onSubmit={handleSubmit}
        >
          {/* Full Name */}
          <div className="relative">
            <input
              type="text"
              name="fullName"
              id="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder=" "
              maxLength={50}
              required
              className={`peer w-full border ${
                errors.fullName
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              } rounded-lg px-3 py-3 focus:outline-none focus:ring-2 transition-all bg-transparent text-gray-900`}
            />

            <label
              htmlFor="fullName"
              className="absolute left-3 -top-2.5 bg-white px-1 text-sm text-gray-400 transition-all duration-200 pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
              Full Name
              <span className="text-red-500 font-bold text-xs ml-0.5">
                *
              </span>
            </label>

            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1 font-medium">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="relative">
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder=" "
              required
              disabled={isInvitedUser}
              className={`peer w-full border ${
                errors.email
                  ? "border-red-500"
                  : "border-gray-300"
              } rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-transparent text-gray-900 disabled:opacity-50`}
            />

            <label
              htmlFor="email"
              className="absolute left-3 -top-2.5 bg-white px-1 text-sm text-gray-400 transition-all duration-200 pointer-events-none"
            >
              Email Address
              <span className="text-red-500 font-bold text-xs ml-0.5">
                *
              </span>
            </label>

            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={
                showPassword ? "text" : "password"
              }
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              placeholder=" "
              required
              onFocus={() => setIsPassFocused(true)}
              onBlur={() => setIsPassFocused(false)}
              className="peer w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-transparent text-gray-900"
            />

            <label
              htmlFor="password"
              className="absolute left-3 -top-2.5 bg-white px-1 text-sm text-gray-400 transition-all duration-200 pointer-events-none"
            >
              Password
              <span className="text-red-500 font-bold text-xs ml-0.5">
                *
              </span>
            </label>

            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
              onClick={() =>
                setShowPassword(!showPassword)
              }
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>

            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password}
              </p>
            )}

            {/* Password Requirements */}
            {isPassFocused && !allMet && (
              <div className="absolute z-20 top-full left-0 w-full mt-2 p-4 bg-slate-900 rounded-xl shadow-xl border border-slate-700">
                <p className="text-[10px] text-slate-400 mb-2 font-bold uppercase tracking-wider text-left">
                  Password Requirements
                </p>

                <div className="space-y-1.5">
                  {[
                    {
                      label: "8+ Characters",
                      met: passCriteria.length,
                    },
                    {
                      label: "One Uppercase",
                      met: passCriteria.upper,
                    },
                    {
                      label: "One Lowercase",
                      met: passCriteria.lower,
                    },
                    {
                      label: "One Number",
                      met: passCriteria.number,
                    },
                    {
                      label: "Special Character",
                      met: passCriteria.special,
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 text-xs font-medium ${
                        item.met
                          ? "text-green-400"
                          : "text-slate-500"
                      }`}
                    >
                      {item.met ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <Circle size={12} />
                      )}
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Role */}
          {!isInvitedUser && (
            <div className="relative">
              <input
                type="text"
                name="role"
                id="role"
                value="Project Admin"
                disabled
                className="peer w-full border border-gray-200 rounded-lg px-3 py-3 bg-gray-50 text-gray-400 cursor-not-allowed"
              />

              <label
                htmlFor="role"
                className="absolute left-3 -top-2.5 bg-white px-1 text-sm text-gray-400 transition-all pointer-events-none"
              >
                Sign Up As
              </label>
            </div>
          )}

          {/* CV Upload */}
          {!isInvitedUser &&
            formData.role === "Project Admin" && (
              <div className="w-full">
                <label className="block text-sm font-bold text-gray-600 mb-2">
                  Upload CV (PDF only)
                  <span className="text-red-500 ml-1">
                    *
                  </span>
                </label>

                <input
                  type="file"
                  accept=".pdf"
                  onChange={e => {
                    const file =
                      e.target.files?.[0];

                    if (
                      file &&
                      file.type !== "application/pdf"
                    ) {
                      setCvFile(null);
                      setCvError(
                        "Only PDF files are allowed."
                      );
                      return;
                    }

                    setCvFile(file || null);
                    setCvError("");
                  }}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-700 bg-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 file:font-bold cursor-pointer"
                />

                {cvError && (
                  <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">
                    {cvError}
                  </p>
                )}
              </div>
            )}

          {/* General Error */}
          {errors.general && (
            <p className="text-red-500 text-sm font-bold text-center">
              {errors.general}
            </p>
          )}

          {/* Submit */}
          <PublicButton
            text={
              loading
                ? "SIGNING UP..."
                : isSuccess
                ? "DONE ✓"
                : "SIGN UP"
            }
            type="submit"
          />
        </form>

        {/* Login Link */}
        <p className="mt-10 text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-700 font-bold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </>
  );
};

export default SignupForm;