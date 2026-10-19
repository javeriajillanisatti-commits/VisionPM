import React from 'react';

const FeatureCard = ({ icon: Icon, title, desc, iconBg, iconColor, hoverBorder }) => {
  return (
    <div className={`bg-white p-8 rounded-2xl border-2 border-transparent transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl ${hoverBorder} cursor-pointer group shadow-sm flex flex-col items-center text-center`}>
      {/* Dynamic Icon - Centered in the middle */}
      <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl mb-6 transition-transform group-hover:scale-110 ${iconBg} ${iconColor}`}>
        <Icon size={30} strokeWidth={2.5} />
      </div>
      {/* Content */}
      <h3 className="text-2xl font-bold text-slate-900 mb-3  group-hover:text-blue-700 transition-colors">
        {title}
      </h3>
      <p className="text-gray-600 leading-relaxed font-medium">
        {desc}
      </p>
    </div>
  );
};

export default FeatureCard;