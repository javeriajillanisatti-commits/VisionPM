import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api/invites`;

const getToken = () => sessionStorage.getItem("token");

const getConfig = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

export const sendInvite = async (inviteData) => {
  console.log("Sending invite:", inviteData);

  const response = await axios.post(
    `${API_URL}/send`,
    inviteData,
    getConfig()
  );

  return response.data;
};