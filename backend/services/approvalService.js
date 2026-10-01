import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api/auth`;

// Get authentication token
const getToken = () =>
  sessionStorage.getItem("token") || localStorage.getItem("token");

// Create authorization config
const getAuthConfig = () => {
  const token = getToken();

  if (!token || token === "null" || token === "undefined")
    throw new Error("Authentication token is missing or expired");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Get pending Project Admin requests
const getPendingRequests = async () => {
  const response = await axios.get(
    `${API_URL}/pending-requests`,
    getAuthConfig()
  );

  return response.data;
};

// Get CV details
const getCVDetails = async (id) => {
  const response = await axios.get(
    `${API_URL}/cv-details/${id}`,
    getAuthConfig()
  );

  return response.data;
};

// Approve Project Admin request
const approveRequest = async (id) => {
  const response = await axios.put(
    `${API_URL}/approve/${id}`,
    {},
    getAuthConfig()
  );

  return response.data;
};

// Reject Project Admin request
const rejectRequest = async (id) => {
  const response = await axios.put(
    `${API_URL}/reject/${id}`,
    {},
    getAuthConfig()
  );

  return response.data;
};

export default {
  getPendingRequests,
  getCVDetails,
  approveRequest,
  rejectRequest,
};