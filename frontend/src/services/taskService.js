import axios from "axios"; 
 
const API_URL = `${process.env.REACT_APP_API_URL}/api/tasks`; 
const PROJECT_API_URL = `${process.env.REACT_APP_API_URL}/api/projects`; 
const RESOURCE_API_URL = `${process.env.REACT_APP_API_URL}/api/resource-allocation`; 
 
// Token Helper
const getConfig = () => ({ 
  headers: { 
    Authorization: `Bearer ${sessionStorage.getItem("token")}`, 
  }, 
}); 
 
// Create Task
export const createTask = async (taskData) => { 
  try { 
    const { data } = await axios.post( 
      API_URL, 
      taskData, 
      getConfig() 
    ); 
 
    return data; 
  } catch (error) { 
    console.error( 
      "Error creating new dynamic task endpoint item:", 
      error 
    ); 
 
    throw error.response?.data || error; 
  } 
}; 
 
// Get Dashboard Tasks
export const getDashboardTasks = async () => { 
  try { 
    const { data } = await axios.get( 
      API_URL, 
      getConfig() 
    ); 
 
    return data; 
  } catch (error) { 
    console.error( 
      "Error fetching dashboard tasks:", 
      error 
    ); 
 
    throw error.response?.data || error; 
  } 
}; 

// Get Tasks By Project
export const getTasksByProject = async (projectId) => { 
  try { 
    const { data } = await axios.get( 
      `${API_URL}/project/${projectId}`, 
      getConfig() 
    ); 
 
    return data; 
  } catch (error) { 
    console.error( 
      "Error fetching project tasks:", 
      error 
    ); 
 
    throw error.response?.data || error; 
  } 
}; 
 
// Get Single Task
export const getTaskById = async (taskId) => { 
  try { 
    const { data } = await axios.get( 
      `${API_URL}/${taskId}`, 
      getConfig() 
    ); 
 
    return data; 
  } catch (error) { 
    console.error( 
      "Error fetching task:", 
      error 
    ); 
 
    throw error.response?.data || error; 
  } 
}; 
 
// Update Task
export const updateTask = async (taskId, taskData) => { 
  try { 
    const { data } = await axios.put( 
      `${API_URL}/${taskId}`, 
      taskData, 
      getConfig() 
    ); 
 
    return data; 
  } catch (error) { 
    console.error( 
      "Error updating task:", 
      error 
    ); 
 
    throw error.response?.data || error; 
  } 
}; 
 
// Delete Task
export const deleteTask = async (taskId) => { 
  try { 
    const { data } = await axios.delete( 
      `${API_URL}/${taskId}`, 
      getConfig() 
    ); 
 
    return data; 
  } catch (error) { 
    console.error( 
      "Error deleting task:", 
      error 
    ); 
 
    throw error.response?.data || error; 
  } 
}; 
 
// Get Project Members
export const getProjectMembers = async (projectId) => { 
  try { 
    const { data } = await axios.get( 
      `${PROJECT_API_URL}/${projectId}/assigned-members`, 
      getConfig() 
    ); 
 
    return data; 
  } catch (error) { 
    console.error( 
      "Error fetching project members:", 
      error 
    ); 
 
    throw error.response?.data || error; 
  } 
}; 
 
// Get Smart Suggestions
export const getSmartSuggestions = async (data) => { 
  try { 
    const response = await axios.post( 
      `${RESOURCE_API_URL}/suggest-members`, 
      data, 
      getConfig() 
    ); 
 
    return response.data; 
  } catch (error) { 
    console.error( 
      "Error fetching smart suggestions:", 
      error 
    ); 
 
    throw error.response?.data || error; 
  } 
};

// Create subtask
export const createSubtask = async (taskId, subtaskData) => {
  try {
    const { data } = await axios.post(
      `${API_URL}/${taskId}/subtasks`,
      subtaskData,
      getConfig()
    );
    return data;
  } catch (error) {
    console.error("Error creating subtask:", error);
    throw error.response?.data || error;
  }
};

// Update subtask
export const updateSubtask = async (taskId, subtaskId, subtaskData) => {
  try {
    const { data } = await axios.put(
      `${API_URL}/${taskId}/subtasks/${subtaskId}`,
      subtaskData,
      getConfig()
    );
    return data;
  } catch (error) {
    console.error("Error updating subtask:", error);
    throw error.response?.data || error;
  }
};

// Delete subtask
export const deleteSubtask = async (taskId, subtaskId) => {
  try {
    const { data } = await axios.delete(
      `${API_URL}/${taskId}/subtasks/${subtaskId}`,
      getConfig()
    );
    return data;
  } catch (error) {
    console.error("Error deleting subtask:", error);
    throw error.response?.data || error;
  }
};
