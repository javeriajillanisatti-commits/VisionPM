import {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from "react";
import axios from "axios";
import { io } from "socket.io-client";
import EmailFailedToast from "../components/common/EmailFailedToast";

const AuthContext = createContext();
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Set or remove Axios token
const setAxiosToken = token => {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    console.log("🔐 AXIOS GLOBAL TOKEN SET");
  } else {
    delete axios.defaults.headers.common.Authorization;
    console.log("🔓 AXIOS GLOBAL TOKEN REMOVED");
  }
};

const getToken = () => sessionStorage.getItem("token");

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  // Connect Socket.IO
  const connectSocket = token => {
    if (!token) {
      console.log("❌ SOCKET: No token available");
      return;
    }

    socketRef.current?.disconnect();

    socketRef.current = io(API_URL, {
    auth: { token },
    transports: ["polling"],
  });

    let hasConnectedBefore = false;
    socketRef.current.on("connect", () => {
      console.log("🟢 Socket connected:", socketRef.current.id);
      // After a dropped connection we may have missed events -> refetch everything.
      if (hasConnectedBefore) {
        window.dispatchEvent(
          new CustomEvent("app:data-changed", { detail: { resource: "*", reason: "reconnect" } })
        );
      }
      hasConnectedBefore = true;
    });

    // Backend says something changed (task, project, workspace, notification...)
    socketRef.current.on("data_changed", data =>
      window.dispatchEvent(new CustomEvent("app:data-changed", { detail: data || {} }))
    );

    socketRef.current.on("connect_error", error =>
      console.error("❌ Socket connection error:", error.message)
    );

    socketRef.current.on("email_failed", data =>
      window.dispatchEvent(
        new CustomEvent("emailFailed", { detail: data })
      )
    );

    socketRef.current.on("userStatusChanged", data =>
      window.dispatchEvent(
        new CustomEvent("userStatusChanged", { detail: data })
      )
    );
  };

  // Check existing authentication
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = getToken();
      console.log("🔍 AUTH CHECK TOKEN:", token ? "TOKEN FOUND" : "TOKEN NOT FOUND");

      if (!token) {
        setAxiosToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setAxiosToken(token);

      try {
        console.log("📡 CHECKING AUTH USER...");
        const res = await axios.get(`${API_URL}/api/auth/me`);
        console.log("✅ AUTH USER RESPONSE:", res.data);

        setUser(res.data.user);

        if (res.data.user?.role)
          sessionStorage.setItem("role", res.data.user.role);

        connectSocket(token);
        window.dispatchEvent(new Event("userAuthenticated"));
      } catch (error) {
        console.error("❌ Authentication check failed:", error);

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("role");
        setAxiosToken(null);
        setUser(null);
        socketRef.current?.disconnect();
        socketRef.current = null;

        window.dispatchEvent(new Event("userStatusChanged"));
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Log in user
  const loginUser = (token, userData) => {
    console.log("🔐 LOGIN USER CALLED");
    console.log("TOKEN RECEIVED:", token ? "YES" : "NO");
    console.log("USER RECEIVED:", userData);

    if (!token) {
      console.error("❌ LOGIN FAILED: Token is missing");
      return false;
    }

    sessionStorage.setItem("token", token);
    console.log("✅ TOKEN SAVED:", sessionStorage.getItem("token") ? "YES" : "NO");

    setAxiosToken(token);

    if (userData?.role)
      sessionStorage.setItem("role", userData.role);

    setUser(userData);
    connectSocket(token);

    window.dispatchEvent(new Event("userAuthenticated"));
    window.dispatchEvent(new Event("userStatusChanged"));

    return true;
  };

  // Log out user
  const logoutUser = async () => {
    try {
      const token = getToken();
      console.log("🚪 LOGOUT TOKEN:", token ? "FOUND" : "NOT FOUND");

      if (token) await axios.post(`${API_URL}/api/auth/logout`);
    } catch (error) {
      console.error("❌ Logout error:", error);
    } finally {
      socketRef.current?.disconnect();
      socketRef.current = null;

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("role");
      setAxiosToken(null);
      setUser(null);

      window.dispatchEvent(new Event("userStatusChanged"));
      window.dispatchEvent(new Event("userLoggedOut"));

      setTimeout(
        () => window.dispatchEvent(new Event("userStatusChanged")),
        300
      );
    }
  };

  // Provide authentication context
  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
      {children}
      <EmailFailedToast />
    </AuthContext.Provider>
  );
};

// Access authentication context
export const useAuth = () => useContext(AuthContext);