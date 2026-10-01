import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const getConfig = () => ({
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
  },
});

export const getProjectDiscussion = async (projectId) => {
  const { data } = await axios.get(
    `${API_URL}/api/project-discussions/${projectId}`,
    getConfig()
  );
  return data;
};
