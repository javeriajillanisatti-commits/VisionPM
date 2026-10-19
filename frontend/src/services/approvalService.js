import axios from "axios"; 
 
const API_URL = `${process.env.REACT_APP_API_URL}/api/auth`; 
 
// Get Pending Requests 
const getPendingRequests = async () => { 
  const response = await axios.get( 
    `${API_URL}/pending-requests`, 
    { 
      withCredentials: true, 
    } 
  ); 
 
  return response.data; 
}; 
 
// Get CV Details 
const getCVDetails = async (userId) => { 
  const response = await axios.get( 
    `${API_URL}/cv-details/${userId}`, 
    { 
      withCredentials: true, 
    } 
  ); 
 
  return response.data; 
}; 
 
// Approve Request 
const approveRequest = async (userId) => { 
  const response = await axios.put( 
    `${API_URL}/approve/${userId}`, 
    {}, 
    { 
      withCredentials: true, 
    } 
  ); 
 
  return response.data; 
}; 
 
// Reject Request 
const rejectRequest = async (userId) => { 
  const response = await axios.put( 
    `${API_URL}/reject/${userId}`, 
    {}, 
    { 
      withCredentials: true, 
    } 
  ); 
 
  return response.data; 
}; 
 
const approvalService = { 
  getPendingRequests, 
  getCVDetails, 
  approveRequest, 
  rejectRequest, 
}; 
 
export default approvalService;