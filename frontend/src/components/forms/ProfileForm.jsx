import React, { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";

const API_BASE = process.env.REACT_APP_API_URL;

const KEYBOARD_PATTERNS = [
  "qwerty", "qwertyuiop", "asdf", "asdfgh", "asdfghjkl",
  "zxcv", "zxcvbn", "zxcvbnm", "qazwsx", "wasd",
  "poiuy", "lkjh", "mnbv", "qwe", "asd", "zxc",
];

// Build profile image URL
const getProfilePicSrc = pic =>
  !pic ? null : pic.startsWith("http") || pic.startsWith("blob:")
    ? pic
    : `${API_BASE}${pic}`;

// Normalize user data
const normalizeUserData = (user = {}) => {
  const source =
    user?.user ||
    user?.data?.user ||
    user?.data ||
    user?.profile ||
    user;

  const name =
    source.fullName ||
    source.name ||
    source.full_name ||
    source.displayName ||
    "";

  return {
    ...source,
    name,
    fullName: name,
    email: source.email || source.emailAddress || source.email_address || "",
    role: source.role || source.userRole || source.user_role || "",
    profilePic:
      source.profilePic ||
      source.profilePicture ||
      source.profile_picture ||
      "",
    skills: source.skills || [],
    workload: source.workload || 0,
    availability: source.availability || "Available",
  };
};

const buildFormData = (user = {}) => {
  const normalized = normalizeUserData(user);

  return {
    ...normalized,
    currentPassword: "",
    password: "",
    skills: Array.isArray(normalized.skills)
      ? normalized.skills.join("\n")
      : normalized.skills || "",
    workload: normalized.workload || 0,
    availability: normalized.availability || "Available",
  };
};

const getToken = () =>
  sessionStorage.getItem("token") || localStorage.getItem("token");

const ProfileForm = ({ onClose, userData, setUserData, userRole }) => {
  const { isDarkMode } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(() => buildFormData(userData));
  const fileInputRef = useRef(null);

  // Sync form with user data
  useEffect(() => {
    setFormData(buildFormData(userData));
  }, [userData]);

  // Fetch latest profile
  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        const token = getToken();
        if (!token) return console.error("Authentication token not found.");

        const role = (userRole || sessionStorage.getItem("role") || "")
          .toLowerCase()
          .replace(/\s+/g, "");

        const endpoint =
          role === "superadmin" ? "/api/auth/me" : "/api/profile";

        const res = await axios.get(`${API_BASE}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const responseUser =
          res.data?.user ||
          res.data?.data?.user ||
          res.data?.data ||
          res.data;

        const freshUser = normalizeUserData(responseUser);

        setUserData(freshUser);
        setFormData(buildFormData(freshUser));
      } catch (err) {
        console.log(
          "Fetch Latest Profile Error:",
          err.response?.data || err
        );
      }
    };

    fetchLatestProfile();
  }, [setUserData, userRole]);

  // Get profile initials
  const getInitials = name => {
    if (!name?.trim()) return "?";

    const parts = name.trim().split(/\s+/);

    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  // Validate profile form
  const validateForm = () => {
    const newErrors = {};
    const name = formData.name?.trim() || "";
    const currentPassword = formData.currentPassword || "";
    const password = formData.password || "";
    const confirm = confirmPassword || "";
    const skills = formData.skills?.trim() || "";

    const nameRegex = /^[A-Za-z]+(?:[\s'-][A-Za-z]+)*$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;

    if (!name) newErrors.name = "Full Name is required";
    else if (name.length < 3)
      newErrors.name = "Full Name must be at least 3 characters";
    else if (name.length > 50)
      newErrors.name = "Full Name cannot exceed 50 characters";
    else if (/\s{2,}/.test(name))
      newErrors.name = "Full Name cannot contain multiple consecutive spaces";
    else if (/[-']{2,}/.test(name))
      newErrors.name =
        "Full Name cannot contain consecutive hyphens or apostrophes";
    else if (!nameRegex.test(name))
      newErrors.name =
        "Full Name can contain only letters, spaces, hyphen or apostrophe";
    else if (/^['-]|['-]$/.test(name))
      newErrors.name =
        "Full Name cannot start or end with hyphen or apostrophe";
    else if (/(.)\1{2,}/i.test(name))
      newErrors.name = "Full Name looks invalid (repeated characters)";
    else {
      const words = name.toLowerCase().split(/\s+/);

      const hasDuplicateWord = words.some(
        (word, index) => words.indexOf(word) !== index
      );

      const hasRepeatingPattern = words.some(word => {
        const cleanWord = word.replace(/[-']/g, "");

        for (let length = 1; length <= 3; length++) {
          if (cleanWord.length < length * 3) continue;

          const pattern = cleanWord.slice(0, length);
          const repetitions = cleanWord.length / length;

          if (
            Number.isInteger(repetitions) &&
            pattern.repeat(repetitions) === cleanWord
          ) {
            return true;
          }
        }

        return false;
      });

      const hasKeyboardPattern = words.some(word => {
        const cleanWord = word.replace(/[-']/g, "");

        return KEYBOARD_PATTERNS.some(pattern =>
          cleanWord.includes(pattern)
        );
      });

      if (hasDuplicateWord)
        newErrors.name = "Full Name cannot have repeated words";
      else if (hasRepeatingPattern)
        newErrors.name = "Full Name looks invalid (repeating pattern)";
      else if (hasKeyboardPattern)
        newErrors.name = "Full Name looks invalid (keyboard pattern detected)";
    }

    if (isEditing && password.trim()) {
      if (!currentPassword.trim())
        newErrors.currentPassword = "Current password is required";
      else if (!passwordVerified)
        newErrors.currentPassword =
          "Please verify your current password first";
    }

    if (password.trim()) {
      if (password.length < 8)
        newErrors.password = "Password must contain at least 8 characters";
      else if (password.length > 16)
        newErrors.password = "Password cannot exceed 16 characters";
      else if (!passwordRegex.test(password))
        newErrors.password =
          "Password must contain uppercase, lowercase, number and special character";

      if (password !== confirm)
        newErrors.confirmPassword = "Passwords do not match";
    }

    if (!password.trim() && confirm.trim())
      newErrors.confirmPassword = "Enter a new password first";

    if (skills.length > 200)
      newErrors.skills = "Skills cannot exceed 200 characters";

    setErrors(newErrors);
    return !Object.keys(newErrors).length;
  };

  // Verify current password
  const verifyCurrentPassword = async () => {
    if (!formData.currentPassword?.trim()) {
      setErrors(prev => ({
        ...prev,
        currentPassword: "Please enter your current password",
      }));
      return;
    }

    try {
      const token = getToken();

      if (!token) {
        setErrors(prev => ({
          ...prev,
          currentPassword: "Authentication token not found",
        }));
        return;
      }

      await axios.post(
        `${API_BASE}/api/profile/verify-password`,
        { currentPassword: formData.currentPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPasswordVerified(true);
      setErrors(prev => ({ ...prev, currentPassword: "" }));
      alert("Current password verified successfully!");
    } catch (err) {
      setPasswordVerified(false);
      setErrors(prev => ({
        ...prev,
        currentPassword:
          err.response?.data?.message || "Current password is incorrect",
      }));
    }
  };

  // Save profile changes
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const token = getToken();

      if (!token) {
        setErrors({ submit: "Authentication token not found" });
        return;
      }

      const skillsArray = formData.skills
        ? [
            ...new Map(
              formData.skills
                .split(/[\n,]+/)
                .map(skill => skill.trim())
                .filter(Boolean)
                .map(skill => [
                  skill.toLowerCase().replace(/[^a-z0-9]/g, ""),
                  skill,
                ])
            ).values(),
          ]
        : [];

      const payload = {
        ...formData,
        name: formData.name?.trim() || "",
        fullName: formData.name?.trim() || "",
        skills: skillsArray,
      };

      if (formData.password?.trim() && passwordVerified) {
        payload.currentPassword = formData.currentPassword;
        payload.password = formData.password;
      } else {
        delete payload.currentPassword;
        delete payload.password;
      }

      const res = await axios.put(`${API_BASE}/api/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedUser = normalizeUserData(res.data);

      setUserData(updatedUser);
      setFormData(buildFormData(updatedUser));
      setConfirmPassword("");
      setPasswordVerified(false);
      setErrors({});
      setIsEditing(false);

      alert("Profile updated successfully");
    } catch (err) {
      console.log(
        "Profile Update Error:",
        err.response?.data || err
      );

      setErrors({
        submit:
          err.response?.data?.message || "Profile update failed",
      });
    }
  };

  // Upload profile picture
  const handleProfilePicture = async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2MB.");
      e.target.value = "";
      return;
    }

    try {
      const token = getToken();

      if (!token) {
        alert("Authentication token not found.");
        e.target.value = "";
        return;
      }

      const uploadData = new FormData();
      uploadData.append("profilePic", file);

      const res = await axios.post(
        `${API_BASE}/api/profile/upload-pic`,
        uploadData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const realUrl = res.data.profilePic;

      setFormData(prev => ({
        ...prev,
        profilePic: realUrl,
      }));

      setUserData(prev => ({
        ...prev,
        profilePic: realUrl,
      }));
    } catch (err) {
      console.log(
        "Profile Pic Upload Error:",
        err.response?.data || err
      );

      alert(
        err.response?.data?.message ||
          "Profile picture upload failed"
      );
    }

    e.target.value = "";
  };

  const normalizedRole =
    formData.role?.toLowerCase().replace(/\s/g, "") || "";

  const isTeamMember = normalizedRole === "teammember";
  const text = isDarkMode ? "text-slate-200" : "text-gray-800";
  const muted = isDarkMode ? "text-slate-400" : "text-gray-500";
  const border = isDarkMode ? "border-slate-700" : "border-gray-200";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`shadow-2xl rounded-3xl p-6 sm:p-8 w-full max-w-[400px] relative border animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar ${
          isDarkMode
            ? "bg-slate-900 border-slate-700"
            : "bg-white border-gray-200"
        }`}
      >
        {/* Header */}
        <div
          className={`flex justify-between items-center mb-6 pb-2 border-b ${
            isDarkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-gray-200"
          }`}
        >
          <h2 className={`text-xl font-bold tracking-tight ${text}`}>
            {isEditing ? "Edit Profile" : "Profile Info"}
          </h2>

          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode
                ? "hover:bg-slate-800"
                : "hover:bg-gray-100"
            }`}
          >
            <X size={20} className={muted} />
          </button>
        </div>

        {/* Profile picture */}
        <div className="flex flex-col items-center mb-6 relative">
          <div className="relative group">
            <div
              onClick={() =>
                isEditing && fileInputRef.current?.click()
              }
              className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold transition-all shadow-inner overflow-hidden ${
                isEditing
                  ? "cursor-pointer ring-4 ring-blue-500 ring-offset-4 opacity-80"
                  : isDarkMode
                  ? "bg-indigo-950 text-indigo-400 border-2 border-indigo-900"
                  : "bg-indigo-50 text-indigo-600 border-2 border-indigo-100"
              }`}
            >
              {formData.profilePic ? (
                <img
                  src={getProfilePicSrc(formData.profilePic)}
                  className="w-full h-full object-cover"
                  alt="Profile"
                />
              ) : (
                getInitials(formData.name || formData.fullName)
              )}
            </div>

            {isEditing && (
              <div className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white shadow-lg pointer-events-none">
                <Camera size={14} />
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleProfilePicture}
          />
        </div>

        <div className="space-y-4">
          {/* Full name */}
          <div>
            <label
              className={`block text-[13px] font-bold  tracking-widest mb-1 ${muted}`}
            >
              Full Name
            </label>

            {isEditing ? (
              <>
                <input
                  maxLength={50}
                  className={`w-full border-b-2 py-2 outline-none ${
                    errors.name
                      ? "border-red-500"
                      : `${border} ${
                          isDarkMode
                            ? "focus:border-blue-500 bg-transparent text-slate-200"
                            : "focus:border-blue-600"
                        }`
                  }`}
                  value={formData.name || formData.fullName || ""}
                  onChange={e => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      fullName: e.target.value,
                    });

                    setErrors(prev => ({
                      ...prev,
                      name: "",
                    }));
                  }}
                />

                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.name}
                  </p>
                )}
              </>
            ) : (
              <p className={`font-semibold py-1 ${text}`}>
                {formData.name ||
                  formData.fullName ||
                  "No Name Set"}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              className={`block text-[13px] font-bold tracking-widest mb-1 ${muted}`}
            >
              Email Address
            </label>

            <p className={`font-medium py-1 ${muted}`}>
              {formData.email || "No Email Set"}
            </p>
          </div>

          {/* Current password */}
          {isEditing && (
            <div>
              <label
                className={`block text-[13px] font-bold  tracking-widest mb-1 ${muted}`}
              >
                Current Password
              </label>

              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={50}
                  className={`flex-1 py-2 border-b-2 outline-none ${
                    errors.currentPassword
                      ? "border-red-500"
                      : `${border} ${
                          isDarkMode
                            ? "focus:border-blue-500 bg-transparent text-slate-200"
                            : "focus:border-blue-600"
                        }`
                  }`}
                  placeholder="Enter current password"
                  value={formData.currentPassword || ""}
                  onChange={e => {
                    setFormData({
                      ...formData,
                      currentPassword: e.target.value,
                    });

                    setPasswordVerified(false);

                    setErrors(prev => ({
                      ...prev,
                      currentPassword: "",
                    }));
                  }}
                />

                <button
                  type="button"
                  onClick={verifyCurrentPassword}
                  className={`px-3 py-2 text-white text-xs rounded-lg ${
                    passwordVerified
                      ? "bg-green-600"
                      : "bg-blue-600"
                  }`}
                >
                  {passwordVerified ? "Verified" : "Verify"}
                </button>
              </div>

              {errors.currentPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.currentPassword}
                </p>
              )}
            </div>
          )}

          {/* New password */}
          {isEditing && passwordVerified && (
            <>
              <div>
                <label
                  className={`block text-[13px] font-bold  tracking-widest mb-1 ${muted}`}
                >
                  New Password
                </label>

                <input
                  type="password"
                  maxLength={16}
                  className={`w-full py-2 border-b-2 outline-none ${
                    errors.password
                      ? "border-red-500"
                      : `${border} ${
                          isDarkMode
                            ? "focus:border-blue-500 bg-transparent text-slate-200"
                            : "focus:border-blue-600"
                        }`
                  }`}
                  placeholder="Enter new password"
                  value={formData.password || ""}
                  onChange={e => {
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    });

                    setErrors(prev => ({
                      ...prev,
                      password: "",
                      confirmPassword: "",
                    }));
                  }}
                />

                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label
                  className={`block text-[13px] font-bold tracking-widest mb-1 ${muted}`}
                >
                  Confirm New Password
                </label>

                <input
                  type="password"
                  maxLength={16}
                  className={`w-full py-2 border-b-2 outline-none ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : `${border} ${
                          isDarkMode
                            ? "focus:border-blue-500 bg-transparent text-slate-200"
                            : "focus:border-blue-600"
                        }`
                  }`}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);

                    setErrors(prev => ({
                      ...prev,
                      confirmPassword: "",
                    }));
                  }}
                />

                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Role */}
          <div>
            <label
              className={`block text-[13px] font-bold  tracking-widest mb-1 ${muted}`}
            >
              Role
            </label>

            <span
              className={`inline-block text-[10px] px-3 py-1 rounded-full font-bold uppercase ${
                isDarkMode
                  ? "bg-indigo-950 text-indigo-400"
                  : "bg-indigo-50 text-indigo-700"
              }`}
            >
              {formData.role ||
                userData.role ||
                "No Role Set"}
            </span>
          </div>

          {/* Team member details */}
          {isTeamMember && (
            <div
              className={`pt-4 mt-4 border-t space-y-4 ${
                isDarkMode
                  ? "border-slate-700"
                  : "border-gray-100"
              }`}
            >
              <div className="flex gap-4">
                <div className="flex-1">
                  <label
                    className={`block text-[13px] font-bold  tracking-widest mb-1 ${muted}`}
                  >
                    Workload
                  </label>

                  <p className="text-sm font-bold text-blue-600">
                    {formData.workload}%
                  </p>
                </div>

                <div className="flex-1">
                  <label
                    className={`block text-[13px] font-bold  tracking-widest mb-1 ${muted}`}
                  >
                    Availability
                  </label>

                  <span
                    className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full ${
                      formData.availability === "Available"
                        ? "bg-green-50 text-green-700"
                        : formData.availability === "Busy"
                        ? "bg-yellow-50 text-yellow-700"
                        : formData.availability === "At Capacity"
                        ? "bg-orange-50 text-orange-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {formData.availability}
                  </span>
                </div>
              </div>

              {/* Skills */}
              <div>
                <label
                  className={`block text-[13px] font-bold  tracking-widest mb-1 ${muted}`}
                >
                  Skills
                </label>

                {isEditing ? (
                  <>
                    <textarea
                      rows="3"
                      maxLength={200}
                      placeholder="Enter skills separated by commas or new lines (e.g. React JS, Node.js)"
                      className={`w-full text-sm border-2 rounded-xl p-2 focus:outline-none ${
                        errors.skills
                          ? "border-red-500"
                          : isDarkMode
                          ? "border-slate-700 bg-slate-800 text-slate-200 focus:border-blue-500"
                          : "border-gray-100 focus:border-blue-500"
                      }`}
                      value={formData.skills || ""}
                      onChange={e => {
                        setFormData({
                          ...formData,
                          skills: e.target.value,
                        });

                        setErrors(prev => ({
                          ...prev,
                          skills: "",
                        }));
                      }}
                    />

                    <div
                      className={`text-right text-xs mt-1 ${muted}`}
                    >
                      {formData.skills?.length || 0}/200
                    </div>

                    {errors.skills && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.skills}
                      </p>
                    )}
                  </>
                ) : (
                  <p
                    className={`text-sm p-2 rounded-xl border ${
                      isDarkMode
                        ? "text-slate-300 bg-slate-800 border-slate-700"
                        : "text-gray-600 bg-gray-50 border-gray-100"
                    }`}
                  >
                    {formData.skills || "No skills added"}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Submit error */}
          {errors.submit && (
            <p className="text-red-500 text-xs text-center font-medium">
              {errors.submit}
            </p>
          )}
        </div>

        {/* Bottom buttons */}
        <div
          className={`mt-8 flex justify-end gap-3 sticky bottom-0 pt-2 border-t ${
            isDarkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-gray-200"
          }`}
        >
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setErrors({});
                  setPasswordVerified(false);
                  setConfirmPassword("");
                  setFormData(buildFormData(userData));
                }}
                className={`px-4 py-2 text-sm font-medium ${
                  isDarkMode
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl shadow-md hover:bg-blue-700"
              >
                Save
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className={`px-6 py-2 text-white font-medium rounded-xl ${
                isDarkMode
                  ? "bg-slate-700 hover:bg-slate-600"
                  : "bg-gray-800 hover:bg-gray-900"
              }`}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;