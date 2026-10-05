import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";

const WorkspaceContext = createContext(null);
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Normalize workspace data
const normalizeWorkspace = ws =>
  ws
    ? {
        id: ws._id || ws.id,
        name: ws.name,
        description: ws.description || "",
      }
    : null;

// Save workspace selection
const saveWorkspace = (workspace, all = false) => {
  if (workspace) {
    sessionStorage.setItem("activeWorkspace", JSON.stringify(workspace));
    sessionStorage.setItem("allWorkspacesSelected", "false");
  } else {
    sessionStorage.removeItem("activeWorkspace");
    sessionStorage.setItem("allWorkspacesSelected", String(all));
  }
};

export const WorkspaceProvider = ({ children }) => {
  // Restore saved selection
  const [allWorkspacesSelected, setAllWorkspacesSelected] = useState(
    () => sessionStorage.getItem("allWorkspacesSelected") === "true"
  );

  const [activeWorkspace, setActiveWorkspace] = useState(() => {
    const saved = sessionStorage.getItem("activeWorkspace");
    if (!saved) return null;

    try {
      return JSON.parse(saved);
    } catch {
      sessionStorage.removeItem("activeWorkspace");
      return null;
    }
  });

  const [workspaceReady, setWorkspaceReady] = useState(false);

  // Remember which token the workspace was already loaded for,
  // so we do not load everything a second time on page refresh.
  const lastInitTokenRef = useRef(null);

  // Load and restore workspace
  const initializeWorkspace = useCallback(async () => {
    const token = sessionStorage.getItem("token");
    const userRole = sessionStorage.getItem("role");

    if (!token) {
      lastInitTokenRef.current = null;
      setWorkspaceReady(true);
      return;
    }

    lastInitTokenRef.current = token;

    try {
      setWorkspaceReady(false);

      const role = userRole?.trim().toLowerCase().replace(/\s+/g, "");

      if (role === "superadmin") {
        setActiveWorkspace(null);
        setAllWorkspacesSelected(false);
        setWorkspaceReady(true);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, workspaceRes] = await Promise.all([
        axios.get(`${API_URL}/api/profile`, { headers }),
        axios.get(`${API_URL}/api/workspaces`, { headers }),
      ]);

      const userProfile = profileRes.data?.user || profileRes.data || {};
      const workspaceList =
        workspaceRes.data?.workspaces || workspaceRes.data || [];

      // Restore Project Admin workspace
      if (role === "projectadmin") {
        if (sessionStorage.getItem("allWorkspacesSelected") === "true") {
          setActiveWorkspace(null);
          setAllWorkspacesSelected(true);
          sessionStorage.removeItem("activeWorkspace");
          setWorkspaceReady(true);
          return;
        }

        let savedWorkspace = null;
        const saved = sessionStorage.getItem("activeWorkspace");

        if (saved) {
          try {
            savedWorkspace = JSON.parse(saved);
          } catch {
            sessionStorage.removeItem("activeWorkspace");
          }
        }

        const selected = savedWorkspace?.id
          ? workspaceList.find(
              ws =>
                String(ws._id || ws.id) === String(savedWorkspace.id)
            )
          : null;

        const normalized = normalizeWorkspace(selected);
        setActiveWorkspace(normalized);
        setAllWorkspacesSelected(false);
        saveWorkspace(normalized);

        setWorkspaceReady(true);
        return;
      }

      // Restore normal user workspace
      const wsId = userProfile.workspace?._id || userProfile.workspace;

      if (wsId) {
        let workspace = workspaceList.find(
          ws => String(ws._id || ws.id) === String(wsId)
        );

        // Fetch workspace directly if missing
        if (!workspace) {
          const res = await axios.get(
            `${API_URL}/api/workspaces/${wsId}`,
            { headers }
          );
          workspace = res.data?.workspace || res.data;
        }

        const normalized = normalizeWorkspace(workspace);
        setActiveWorkspace(normalized);
        setAllWorkspacesSelected(false);
        saveWorkspace(normalized);
      } else if (workspaceList.length) {
        // Use first workspace as fallback
        const normalized = normalizeWorkspace(workspaceList[0]);
        setActiveWorkspace(normalized);
        setAllWorkspacesSelected(false);
        saveWorkspace(normalized);
      } else {
        setActiveWorkspace(null);
        setAllWorkspacesSelected(false);
        saveWorkspace(null);
      }

      setWorkspaceReady(true);
    } catch (error) {
      console.error("Workspace initialization error:", error);
      setWorkspaceReady(true);
    }
  }, []);

  // Initialize on app load
  useEffect(() => {
    initializeWorkspace();
  }, [initializeWorkspace]);

  // Refresh after login
  useEffect(() => {
    const handleUserAuthenticated = () => {
      // Already loaded for this same token (page refresh): skip duplicate requests.
      const token = sessionStorage.getItem("token");
      if (token && lastInitTokenRef.current === token) return;
      initializeWorkspace();
    };
    window.addEventListener("userAuthenticated", handleUserAuthenticated);

    return () =>
      window.removeEventListener(
        "userAuthenticated",
        handleUserAuthenticated
      );
  }, [initializeWorkspace]);

  // Change active workspace
  const changeWorkspace = workspace => {
    const normalized = normalizeWorkspace(workspace);

    setActiveWorkspace(normalized);
    setAllWorkspacesSelected(!normalized);
    saveWorkspace(normalized, !normalized);
  };

  // Clear workspace selection
  const clearWorkspaceSelection = () => {
    setActiveWorkspace(null);
    setAllWorkspacesSelected(false);
    saveWorkspace(null);
  };

  // Handle workspace selection from other components
  const handleSetWS = wsData => changeWorkspace(wsData || null);

  // Notify components and refresh
  const refreshWorkspaceList = () => {
    window.dispatchEvent(new CustomEvent("workspaceListUpdated"));
    initializeWorkspace();
  };

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        allWorkspacesSelected,
        workspaceReady,
        setActiveWorkspace: handleSetWS,
        changeWorkspace,
        clearWorkspaceSelection,
        refreshWorkspaceList,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

// Access workspace context
export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);

  if (!context)
    throw new Error("useWorkspace must be used within WorkspaceProvider");

  return context;
};