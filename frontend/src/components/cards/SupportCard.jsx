import React from "react";
import { motion } from "framer-motion";
import { Shield, Briefcase, MessageCircle, HelpCircle } from "lucide-react";

const iconMap = {
  "Account Support": Shield,
  "Workspace Help": Briefcase,
  "Feedback": MessageCircle,
  "General Query": HelpCircle,
};

const SupportCard = ({ title, desc }) => {
  const Icon = iconMap[title];

  return (
    <motion.div
      whileHover={{ scale: 1.06, y: -5 }}
      className="bg-white rounded-2xl shadow-md p-4 sm:p-6 hover:shadow-xl hover:ring-1 hover:ring-blue-500 transition-all duration-300"
    >
      <div className="mb-3 text-blue-600">
        {Icon && <Icon size={28} />}
      </div>
      <h3 className="font-semibold text-base sm:text-lg text-slate-900">
        {title}
      </h3>
      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
        {desc}
      </p>
    </motion.div>
  );
};

export default SupportCard;