import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api/member`;

// Get my workspace
export const getMyWorkspace = async () => {
  const token = sessionStorage.getItem("token");

  const response = await axios.get(
    `${API_URL}/workspace`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// get project by id
export const getProjectById = async (projectId) => {
  const token = sessionStorage.getItem("token");

  const response = await axios.get(
    `${API_URL}/projects/${projectId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// Get my projects
export const getMyProjects = async () => {
  const token = sessionStorage.getItem("token");

  const response = await axios.get(
    `${API_URL}/projects`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// Get my tasks
export const getMyTasks = async () => {
  const token = sessionStorage.getItem("token");

  const response = await axios.get(
    `${API_URL}/tasks`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};