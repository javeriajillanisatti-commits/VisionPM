import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#0b132d] text-white py-16 px-6">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        
        {/* Call to Action Heading */}
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
          Ready to Manage Your Projects Smarter?
        </h2>

        {/* Subtitle / Description Text */}
        <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Start organizing your work, collaborating with your team, and achieving project success with VisionPM.
        </p>

        {/* Divider and Copyright Section */}
        <div className="border-t border-[#172554] pt-8 mt-10">
          <p className="text-slate-400 text-xs md:text-sm tracking-wide">
            © 2026 VisionPM. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;