import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [message, setMessage] = useState("Verifying your email...");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage("Invalid verification link.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/auth/verify-email/${token}`
        );

        setMessage(
          response.data.message ||
            "Email verified successfully! You can now login."
        );

        setSuccess(true);

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
            "Verification link is invalid or expired."
        );
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2
          className={`text-2xl font-bold mb-4 ${
            success ? "text-green-600" : "text-gray-800"
          }`}
        >
          {success ? "Email Verified!" : "Email Verification"}
        </h2>

        <p className="text-gray-600">{message}</p>

        {success && (
          <p className="text-sm text-gray-400 mt-3">
            Redirecting to login...
          </p>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;