import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api/member/workplan`;

// Get work plan by date
export const getMyWorkPlan = async (date) => {
  const token = sessionStorage.getItem("token");

  const response = await axios.get(`${API_URL}?date=${date}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

// Schedule task
export const createWorkPlan = async (payload, force = false) => {
  const token = sessionStorage.getItem("token");

  const response = await axios.post(
    `${API_URL}${force ? "?force=true" : ""}`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// Remove scheduled entry
export const deleteWorkPlan = async (id) => {
  const token = sessionStorage.getItem("token");

  const response = await axios.delete(`${API_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

// Update scheduled entry
export const updateWorkPlan = async (id, payload, force = false) => {
  const token = sessionStorage.getItem("token");

  const response = await axios.put(
    `${API_URL}/${id}${force ? "?force=true" : ""}`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};