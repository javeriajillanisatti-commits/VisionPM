import React from "react";
import SignupForm from "../../components/forms/SignupForm";

const Signup = () => {
  return (
    
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center pt-32 pb-12 px-4 relative transition-colors duration-200">
      {/* Signup Form Container */}
      <div className="w-full max-w-md">
        <SignupForm />
      </div>
    </div>
  );
};

export default Signup;
