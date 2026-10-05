import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/navbar/Navbar";

const PublicLayout = () => (
  <div className="public-layout min-h-screen bg-white text-gray-900 transition-colors duration-200">
    {/* Show navbar */}
    <Navbar />

    {/* Render public page */}
    <main className="w-full">
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <Outlet />
      </Suspense>
    </main>
  </div>
);

export default PublicLayout;