import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const ThemeContext = createContext();

// Create a separate localStorage key for every role.
const getThemeKey = role => {
  const cleanRole = role
    ?.toString()
    .toLowerCase()
    .replace(/\s+/g, "");

  return cleanRole
    ? `visionpm_theme_${cleanRole}`
    : "visionpm_theme_default";
};

export const ThemeProvider = ({ children }) => {
  const [themeRole, setThemeRole] = useState("");

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem(
      "visionpm_theme_default"
    );

    return savedTheme === "dark";
  });

  // Load the saved theme whenever the logged-in role changes.
  useEffect(() => {
    if (!themeRole) return;

    const themeKey = getThemeKey(themeRole);
    const savedTheme = localStorage.getItem(themeKey);

    setIsDarkMode(savedTheme === "dark");
  }, [themeRole]);

  // Apply and save the theme for the current role.
  useEffect(() => {
    if (!themeRole) return;

    const root = document.documentElement;
    const themeKey = getThemeKey(themeRole);

    root.classList.toggle("dark", isDarkMode);

    localStorage.setItem(
      themeKey,
      isDarkMode ? "dark" : "light"
    );
  }, [isDarkMode, themeRole]);

  // Toggle dark and light mode.
  const toggleThemeMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleThemeMode,
        setThemeRole,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Access the theme context.
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used within a ThemeProvider."
    );
  }

  return context;
};