import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Links = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    ["Home", "home"],
    ["Features", "features"],
    ["How it works", "workflow"],
    ["Contact", "contact"],
  ];

  // Scroll to section
  const handleScroll = (sectionId) => {
    const scroll = () => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    };

    if (location.pathname === "/") scroll();
    else {
      navigate("/");
      setTimeout(scroll, 100);
    }
  };

  const buttonClass = "text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors bg-transparent border-none cursor-pointer";

  return (
    <div className="hidden lg:flex items-center gap-8">
      {links.map(([label, id]) => (
        <button
          key={id}
          onClick={() => handleScroll(id)}
          className={buttonClass}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default Links;