import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api/workspaces`;

// Get token from sessionStorage
const getToken = () => {
  return sessionStorage.getItem("token");
};

// Common headers
const getConfig = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

// Get all workspaces
export const getAllWorkspaces = async (workspaceId = null) => {
  const response = await axios.get(API_URL, {
    params: workspaceId ? { workspaceId } : {},
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return response.data;
};

// Create workspace
export const createWorkspace = async (workspaceData) => {
  const response = await axios.post(
    API_URL,
    workspaceData,
    getConfig()
  );

  return response.data;
};

// Update workspace
export const updateWorkspace = async (id, workspaceData) => {
  const response = await axios.put(
    `${API_URL}/${id}`,
    workspaceData,
    getConfig()
  );

  return response.data;
};

// Delete workspace
export const deleteWorkspace = async (id) => {
  const response = await axios.delete(
    `${API_URL}/${id}`,
    getConfig()
  );

  return response.data;
};

// Get Workspace Health Analysis
export const getWorkspaceHealth = async (workspaceId) => {
  const response = await axios.get(
    `${API_URL}/${workspaceId}/health`,
    getConfig()
  );

  return response.data;
};

// Get Workspace Monitor Data
export const getWorkspaceMonitorData = async (workspaceId) => {
  const response = await axios.get(
    `${API_URL}/${workspaceId}/monitor`,
    getConfig()
  );

  return response.data;
};

// Get workspace members with their assigned projects
export const getWorkspaceMembersWithProjects = async (workspaceId) => {
  const response = await axios.get(
    `${API_URL}/${workspaceId}/members-projects`,
    getConfig()
  );

  return response.data?.membersData || [];
};

// Get workspace audit/activity logs
export const getWorkspaceAuditLogs = async () => {
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}/api/audit`,
    getConfig()
  );

  return response.data?.logs || [];
};
