import React, { useState } from "react";
import SupportCard from "../../components/cards/SupportCard";
import ContactForm from "../../components/forms/ContactForm";
import { motion } from "framer-motion";

const ContactPage = () => {
  const [selectedSubject, setSelectedSubject] = useState("");

  const cards = [
    { title: "Account Support", desc: "Issues with account access" },
    { title: "Workspace Help", desc: "Projects & workspace issues" },
    { title: "Feedback", desc: "Share your suggestions" },
    { title: "General Query", desc: "Other concerns" },
  ];

  return (
    <div
      id="contact"
      className="
        relative w-full overflow-hidden
        bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900
        py-14 sm:py-20
        px-4 sm:px-6
        transition-colors duration-300
      "
    >
      {/* Ambient glow accents */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 sm:w-96 sm:h-96 bg-blue-600/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-600/15 rounded-full blur-3xl" />

      <div
        className="
          relative grid grid-cols-1 md:grid-cols-2
          gap-8 sm:gap-10
          max-w-7xl mx-auto
          md:px-6
        "
      >
        {/* LEFT */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="min-w-0"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold tracking-wide uppercase mb-4">
            We're here to help
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight break-words">
            Contact Us
          </h1>

          <p className="text-blue-100/80 mb-8 sm:mb-10 text-sm sm:text-base max-w-md leading-relaxed">
            Have questions or need help? Reach out to the VisionPM team
            anytime — pick a topic below or just say hi.
          </p>

          <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
            How can we help?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {cards.map((c, i) => (
              <SupportCard
                key={i}
                title={c.title}
                desc={c.desc}
                onClick={setSelectedSubject}
                isActive={selectedSubject === c.title}
              />
            ))}
          </div>
        </motion.div>

        {/* RIGHT */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="min-w-0 w-full"
        >
          <ContactForm selectedSubject={selectedSubject} />
        </motion.div>
      </div>
    </div>
  );
};

export default ContactPage;