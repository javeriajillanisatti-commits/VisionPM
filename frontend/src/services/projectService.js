import axios from "axios"; 
 
const API_URL = `${process.env.REACT_APP_API_URL}/api/projects`; 
 
// Token Helper
const getConfig = () => ({ 
  headers: { 
    Authorization: `Bearer ${sessionStorage.getItem("token")}`, 
  }, 
}); 
 
// Get Dashboard Projects
export const getDashboardProjects = async () => { 
  const { data } = await axios.get(API_URL, getConfig()); 
  return data.projects || []; 
}; 
 
// Get Workspace Projects
export const getProjectsByWorkspace = async (workspaceId) => { 
  const { data } = await axios.get( 
    `${API_URL}/workspace/${workspaceId}`, 
    getConfig() 
  ); 
  return data.projects || []; 
}; 
 
// Get Single Project
export const getProjectById = async (projectId) => { 
  const { data } = await axios.get( 
    `${API_URL}/${projectId}`, 
    getConfig() 
  ); 
  return data.project; 
}; 
 
// Create Project
export const createProject = async (projectData) => { 
  const { data } = await axios.post( 
    API_URL, 
    projectData, 
    getConfig() 
  ); 
  return data.project; 
}; 
 
// Update Project
export const updateProject = async (projectId, projectData) => { 
  const { data } = await axios.put( 
    `${API_URL}/${projectId}`, 
    projectData, 
    getConfig() 
  ); 
  return data.project; 
}; 
 
// Delete Project
export const deleteProject = async (projectId) => { 
  const { data } = await axios.delete( 
    `${API_URL}/${projectId}`, 
    getConfig() 
  ); 
  return data; 
}; 
 
// Get Project Report
export const getProjectReport = async (projectId) => { 
  const { data } = await axios.get( 
    `${API_URL}/report/${projectId}`, 
    getConfig() 
  ); 
  return data; 
}; 
 
// Get Project Members
export const getWorkspaceMembers = async (projectId) => { 
  const { data } = await axios.get( 
    `${API_URL}/${projectId}/members`, 
    getConfig() 
  ); 
  return data; 
}; 
 
// Update Project Members
export const updateProjectMembers = async ( 
  projectId, 
  members 
) => { 
  const { data } = await axios.put( 
    `${API_URL}/${projectId}/members`, 
    { 
      members, 
    }, 
    getConfig() 
  ); 
  return data; 
};