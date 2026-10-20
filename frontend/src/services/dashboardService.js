import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api/dashboard`;

// Get Dashboard Data
export const getDashboardData = async (workspaceId) => {
  const token = sessionStorage.getItem("token");

  const response = await axios.get(
    `${API_URL}?workspaceId=${workspaceId || ""}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};