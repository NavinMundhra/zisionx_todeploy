import axios from "axios";

const BASE_URL = "http://13.201.211.85"; // Correct backend base URL

const axiosInstance = axios.create({
    baseURL: BASE_URL, // Ensure this matches your backend URL
});

// Send OTP API
export const sendOTP = async (phoneNumber) => {
    try {
        const response = await axiosInstance.post("/api/send-otp", { phone_number: phoneNumber });
        return response;
    } catch (error) {
        console.error("Error in sendOTP API:", error);
        throw error;
    }
};

// Validate OTP API
export const validateOTP = async (phoneNumber, otp) => {
    try {
        const response = await axiosInstance.post("/api/validate-otp", { phone_number: phoneNumber, otp });
        return response;
    } catch (error) {
        console.error("Error in validateOTP API:", error);
        throw error;
    }
};

// Upload Image API
export const uploadImage = async (formData) => {
    try {
        const response = await axios.post(`${BASE_URL}/api/upload`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response;
    } catch (error) {
        console.error("Error in uploadImage API:", error);
        throw error;
    }
};

// Search Image API
export const searchImage = async (file) => {
    try {
        // Create FormData to send the file to the backend
        const formData = new FormData();
        formData.append("file", file);

        // Make the API call
        const response = await axios.post(`${BASE_URL}/api/search`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response;
    } catch (error) {
        console.error("Error in searchImage API:", error);
        throw error;
    }
};

export default axiosInstance;
