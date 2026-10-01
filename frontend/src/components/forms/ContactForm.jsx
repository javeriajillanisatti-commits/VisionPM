import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";

const ContactForm = ( ) => {
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", message: "", });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "firstName" || name === "lastName") {
      
      // Only allow letters, spaces, hyphens and apostrophes
      if (!/^[a-zA-Z\s'-]*$/.test(value)) return;
      if (value.length > 50) return;
    }
    // Email
    if (name === "email" && value.length > 50) return;
    //message
    if (name === "message" && value.length > 1000) return;
    setFormData((prev) => ({
      ...prev, [name]: value,
    }));
    setErrors((prev) => ({
      ...prev, [name]: "",
    }));
    setSuccess("");
  };
  const isMeaningfulText = (text) => {
    const value = text.trim();
    if (!/[a-zA-Z]/.test(value)) { return false; }
    if (/(.)\1{3,}/i.test(value)) { return false; }
    const meaningfulCharacters = value.match(/[a-zA-Z0-9]/g) || [];
    return meaningfulCharacters.length >= 2;
  };
  const hasRepeatedPhrase = (text) => {
    const collapsed = text.replace(/\s+/g, " ").trim();
    return /(.{3,50})(?: \1){2,}/i.test(collapsed);
  };
  const validate = () => {
    const err = {};
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const email = formData.email.trim();
    const message = formData.message.trim();
    const nameRegex = /^[a-zA-Z]+(?:[\s'-][a-zA-Z]+)*$/;
    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!firstName) {
      err.firstName = "First name is required";
    } else if (firstName.length < 3) {
      err.firstName = "First name must contain at least 3 characters";
    } else if (firstName.length > 50) {
      err.firstName = "First name cannot exceed 50 characters";
    } else if (!nameRegex.test(firstName)) {
      err.firstName = "First name can only contain letters, spaces, hyphens or apostrophes";
    } else if (!isMeaningfulText(firstName)) {
      err.firstName = "Please enter a meaningful first name";
    }

    if (lastName) {
      if (lastName.length < 3) {
        err.lastName = "Last name must contain at least 3 characters";
      } else if (lastName.length > 50) {
        err.lastName = "Last name cannot exceed 50 characters";
      } else if (!nameRegex.test(lastName)) {
        err.lastName = "Last name can only contain letters, spaces, hyphens or apostrophes";
      } else if (!isMeaningfulText(lastName)) {
        err.lastName = "Please enter a meaningful last name";
      }
    }
    if (!email) {
      err.email = "Email is required";
    } else if (email.length > 50) {
      err.email = "Email cannot exceed 50 characters";
    } else if (!emailRegex.test(email)) {
      err.email = "Please enter a valid email address";
    } else if (
      email.includes("..") ||
      email.startsWith(".") ||
      email.endsWith(".") ||
      email.includes("@.")
    ) {
      err.email = "Please enter a valid email address";
    }
    if (!message) {
      err.message = "Message is required";
    } else if (message.length < 10) {
      err.message =
        "Message must contain at least 10 characters";
    } else if (message.length > 1000) {
      err.message =
        "Message cannot exceed 1000 characters";
    } else if (!isMeaningfulText(message)) {
      err.message = "Please enter a meaningful message";
    } else if (hasRepeatedPhrase(message)) {
      err.message = "Please do not repeat the same message multiple times";
    } else if (
      /^(test|testing|hello|hi|abc|abcde|qwerty|ok|okay)$/i.test(message)
    ) {
      err.message = "Please enter a meaningful message";
    } else if (
      /^(www\.?|https?:\/\/)/i.test(message)
    ) {
      err.message = "Please enter a proper message instead of a URL";
    } else {
      const meaningfulCharacters = message.replace(
        /[\s.,!?'"-]/g, "");
      if (meaningfulCharacters.length < 5) { err.message = "Please enter a meaningful message"; }
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault(); setSuccess("");
    if (!validate()) return;
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/contact`,
        {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          message: formData.message.trim(),
        }
      );

      if (response.data.success) {
        setSuccess("Message sent successfully!");
        setFormData({ firstName: "", lastName: "", email: "", message: "", });
        setErrors({});
      }
    } catch (error) {
      console.error("Contact Form Error:", error);
      setErrors((prev) => ({ ...prev, submit: error.response?.data?.message || "Failed to send message", }));
    }
  };
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-2"> Get in Touch</h2>
      <p className="text-gray-500 mb-6">We’ll respond as soon as possible</p>
      {success && (
        <p className="text-green-600 mb-4 font-medium">{success}</p>)}
      {errors.submit && (
        <p className="text-red-500 mb-4 font-medium">{errors.submit}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" >
        {/*  FIRST NAME + LAST NAME */}
        <div className="grid grid-cols-2 gap-4">
          <div> <input name="firstName" value={formData.firstName} placeholder="First Name"
            onChange={handleChange}
            maxLength={50}
            className={`border p-3 rounded-xl w-full bg-white text-gray-900 border-gray-200 focus:ring-1  ${errors.firstName ? "border-red-500 focus:ring-red-400" : "focus:ring-blue-500 focus:outline-none"}`} />
            {errors.firstName && (<p className="text-red-500 text-sm mt-1"> {errors.firstName} </p>)}
          </div>
          {/* LAST NAME */}
          <div>
            <input name="lastName" value={formData.lastName} placeholder="Last Name"
              onChange={handleChange}
              maxLength={50}
              className={`border p-3 rounded-xl w-full bg-white text-gray-900 border-gray-200 focus:ring-1  ${errors.lastName ? "border-red-500 focus:ring-red-400" : "focus:ring-blue-500 focus:outline-none"}`}
            />

            {errors.lastName && (<p className="text-red-500 text-sm mt-1"> {errors.lastName}</p>)}
          </div>
        </div>

        {/*EMAIL */}
        <div>
          <input name="email" type="email" value={formData.email} placeholder="Email Address"
            onChange={handleChange} maxLength={50}
            className={`border p-3 rounded-xl w-full bg-white text-gray-900 border-gray-200 focus:ring-1 ${errors.email ? "border-red-500 focus:ring-red-400" : "focus:ring-blue-500 focus:outline-none"}`}
          />

          {errors.email && (
            <p className="text-red-500 text-sm mt-1"> {errors.email} </p>)}
        </div>

        {/*  MESSAGE*/}
        <div>
          <textarea name="message" rows="5" value={formData.message}
            placeholder="Describe your issue..." onChange={handleChange}
            maxLength={1000}
            className={`border p-3 rounded-xl w-full bg-white text-gray-900 border-gray-200 focus:ring-1  resize-none ${errors.message ? "border-red-500 focus:ring-red-400" : "focus:ring-blue-500 focus:outline-none"}`}
          />
          <div className="text-right text-sm mt-1 text-gray-400">{formData.message.length}/1000</div>
          {errors.message && (<p className="text-red-500 text-sm mt-1  "> {errors.message}</p>)}
        </div>

        {/*Sumbit button */}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-indigo-600 to-black text-white w-full py-3 rounded-xl"
        >Submit </motion.button>
      </form>
    </div>
  );
};

export default ContactForm;