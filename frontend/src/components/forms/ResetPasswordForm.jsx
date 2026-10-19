import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, Circle } from "lucide-react";
import axios from "axios";
import PublicButton from "../buttons/PublicButton";

const FloatingInput = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  id,
  toggleIcon,
  error,
  showPassword,
  onFocus,
  onBlur,
}) => (
  <div className="relative w-full group">
    <input
      type={type}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder=" "
      required
      className={`peer w-full h-[58px] border ${
        error ? "border-red-500" : "border-gray-300"
      } rounded-xl px-4 py-4 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-transparent text-gray-800`}
    />

    <label
      htmlFor={id}
      className="absolute left-3 top-1/2 -translate-y-1/2 px-1.5 bg-white text-gray-400 text-sm font-medium transition-all duration-200 pointer-events-none peer-focus:-top-0 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:font-bold peer-[:not(:placeholder-shown)]:-top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-blue-600"
    >
      {label}
    </label>

    {toggleIcon && (
      <button
        type="button"
        onClick={toggleIcon}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    )}

    {error && (
      <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{error}</p>
    )}
  </div>
);

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const { token } = useParams();

  const [showPassword, setShowPassword] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  // Check password requirements
  const passCriteria = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*]/.test(formData.password),
  };

  const allMet = Object.values(passCriteria).every(Boolean);

  // Handle input changes
  const handleChange = ({ target: { name, value } }) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name] || errors.general) {
      setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.password.trim())
      newErrors.password = "Password is required";
    else if (!allMet)
      newErrors.password = "Password requirements not met";

    if (!formData.confirmPassword.trim())
      newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    try {
      setLoading(true);

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/reset-password/${token}`,
        { password: formData.password }
      );

      setIsSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (error) {
      console.error("Reset password error:", error);
      setErrors({
        general:
          error.response?.data?.message ||
          "Invalid or expired reset link. Please request a new one.",
      });
    } finally {
      setLoading(false);
    }
  };

  const requirements = [
    { label: "8+ Characters", met: passCriteria.length },
    { label: "One Uppercase", met: passCriteria.upper },
    { label: "One Lowercase", met: passCriteria.lower },
    { label: "One Number", met: passCriteria.number },
    { label: "Special Character", met: passCriteria.special },
  ];

  return (
    <div className="relative w-full max-w-[460px] bg-white shadow-lg rounded-2xl p-8 sm:p-12 flex flex-col items-center border border-gray-100 text-gray-900 overflow-hidden">
      {/* Show success message */}
      {isSuccess && (
        <div className="absolute top-0 left-0 w-full bg-green-500 text-white py-3 px-4 text-center text-sm font-bold">
          Password Updated! Redirecting...
        </div>
      )}

      {/* Show heading */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Reset Password
      </h2>

      <p className="text-gray-500 text-sm text-center mb-10">
        Choose a strong password to secure your account.
      </p>

      <form className="w-full space-y-6" onSubmit={handleSubmit}>
        {/* Enter new password */}
        <div className="relative w-full">
          <FloatingInput
            label="New Password"
            name="password"
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            toggleIcon={() => setShowPassword((prev) => !prev)}
            showPassword={showPassword}
            error={errors.password}
            onFocus={() => setIsPassFocused(true)}
            onBlur={() => setIsPassFocused(false)}
          />

          {/* Show password requirements */}
          {isPassFocused && !allMet && (
            <div className="absolute z-20 top-full left-0 w-full mt-2 p-4 bg-slate-50 rounded-xl shadow-xl border border-gray-200 animate-in fade-in zoom-in duration-200">
              <p className="text-[10px] text-gray-500 mb-2 font-bold uppercase tracking-wider">
                Password Requirements
              </p>

              <div className="space-y-1.5">
                {requirements.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                      item.met ? "text-green-600" : "text-gray-500"
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

        {/* Confirm password */}
        <FloatingInput
          label="Confirm Password"
          name="confirmPassword"
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        {/* Show general error */}
        {errors.general && (
          <p className="text-red-500 text-sm font-bold text-center">
            {errors.general}
          </p>
        )}

        {/* Submit password reset */}
        <PublicButton
          text={
            loading
              ? "UPDATING..."
              : isSuccess
              ? "DONE ✓"
              : "RESET PASSWORD"
          }
          type="submit"
        />
      </form>
    </div>
  );
};

export default ResetPasswordForm;