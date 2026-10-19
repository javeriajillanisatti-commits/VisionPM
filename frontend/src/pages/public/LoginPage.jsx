import React from "react";
import LoginForm from "../../components/forms/LoginForm";

const LoginPage = () => {
  return (
   
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 pt-32 pb-12 px-4 transition-colors duration-200">
      {/* Login Section */}
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
