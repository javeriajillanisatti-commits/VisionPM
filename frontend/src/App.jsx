import React from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./app/routes";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext"; // ✅ Injected proper Theme provider module

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          {/* 🚀 THEME ENFORCER WRAPPER STACK: Wraps around routes tree to ensure dark classes pass natively */}
          <ThemeProvider>
            <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
              <AppRoutes />
            </div>
          </ThemeProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
