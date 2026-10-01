import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "../../components/assets/logo.png";
import Links from "../navbar/Links";

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const mobileLinks = [
    ["Home", "#home"],
    ["Features", "#features"],
    ["How it works", "#workflow"],
  ];

  // Navigate and close mobile menu
  const goTo = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-slate-100 transition-colors duration-200">
      <div className="max-w-8xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src={logo} alt="Logo" className="w-9 h-9" />
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-black bg-clip-text text-transparent">
            VisionPM
          </span>
        </div>

        {/* Desktop Links */}
        <Links />

        {/* Desktop Auth */}
        <div className="hidden lg:flex items-center gap-6">
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all"
          >
            Get Started
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden text-slate-600"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-slate-100 p-6 space-y-4 shadow-xl">
          {mobileLinks.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
              className="block text-slate-600 font-medium hover:text-blue-600"
            >
              {label}
            </a>
          ))}

          <button
            onClick={() => goTo("/login")}
            className="block w-full text-left text-slate-600 font-medium pt-2 border-t border-slate-50 hover:text-blue-600"
          >
            Login
          </button>

          <button
            onClick={() => goTo("/signup")}
            className="w-full bg-slate-900 text-white px-6 py-3 rounded-lg font-medium text-center hover:bg-slate-800 transition-all"
          >
            Get Started
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;