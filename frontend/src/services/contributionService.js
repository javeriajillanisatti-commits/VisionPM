import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api/member`;

export const getMyContribution = async (projectId) => {
  const token = sessionStorage.getItem("token");

  const response = await axios.get(`${API_URL}/contribution/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
};