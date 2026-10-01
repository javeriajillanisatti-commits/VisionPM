import React from "react";
import ForgotPasswordForm from "../../components/forms/ForgotPasswordForm";


const ForgotPassword = () => {   
  return (
    // Outer fullscreen background container with adaptive dark utility rules applied
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-950 pt-32 pb-12 px-4 transition-colors duration-200">
       
      {/* Login Section layout container grid */}
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>

    </div>
  );
};

export default ForgotPassword;
