import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api/notifications`;

const getConfig = () => ({
  headers: {
    Authorization: `Bearer ${
      sessionStorage.getItem("token") ||
      localStorage.getItem("token")
    }`,
  },
});;

export const getMyNotifications = async () => {
  const { data } = await axios.get(API_URL, getConfig());
  return data;
};

export const markNotificationAsRead = async (id) => {
  const { data } = await axios.patch(
    `${API_URL}/${id}/read`,
    {},
    getConfig()
  );
  return data;
};

export const markAllNotificationsAsRead = async () => {
  const { data } = await axios.patch(
    `${API_URL}/read-all`,
    {},
    getConfig()
  );
  return data;
};