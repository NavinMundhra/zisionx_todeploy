import React, { useState } from "react";
import { ThemeProvider } from "@mui/material/styles"; // Import ThemeProvider
import CssBaseline from "@mui/material/CssBaseline"; // Normalize styles across browsers
import theme from "./components/theme"; // Import the custom theme
import Login from "./components/Login"; // Login screen
import OTPVerification from "./components/OTPVerification"; // OTP verification screen
import Home from "./components/Home"; // Home screen
import { searchImage, uploadImage } from "./services/api"; // Import the API functions

function App() {
    const [currentScreen, setCurrentScreen] = useState("login"); // Manage current screen
    const [userDetails, setUserDetails] = useState(null); // Store user details (phone, selfie, etc.)
    const [images, setImages] = useState([]); // Store matched images

    // Handler for when OTP is sent
    const handleOTPSent = (details) => {
        setUserDetails(details); // Save user details
        setCurrentScreen("otp"); // Switch to OTP verification screen
    };

    // Handler for when OTP is verified
    const handleOTPVerified = (matchedImages) => {
        setImages(matchedImages); // Save matched images
        setCurrentScreen("home"); // Switch to Home screen
    };

    // Handler for reuploading selfie
    const handleReupload = async (file) => {
        try {
            const formData = new FormData();
            formData.append("file", file);
            console.log("Payload sent:", formData);
            // Call the backend search API with the new selfie
            const response = await searchImage(file);
            const newImages = response.data.matches || [];
            setImages(newImages); // Update images in state
        } catch (error) {
            console.error("Error reuploading selfie:", error);
            alert("Failed to fetch images. Please try again.");
        }
    };

    // Handler for uploading an image to the backend
    const handleUpload = async (file) => {
      try {
          // Create FormData to send the file to the backend
          const formData = new FormData();
          formData.append("file", file); // Append the file
          formData.append("eventcode", userDetails.eventCode); // Append the phone number (eventCode)
  
          // Log the FormData content for debugging
          for (let [key, value] of formData.entries()) {
              console.log(`${key}:`, value); // Should log 'file' and 'phone_number'
          }
  
          // Make the API call
          const response = await uploadImage(formData);
  
          // Log the response for debugging
          console.log("Upload response:", response);
  
          alert("Image uploaded successfully!");
      } catch (error) {
          console.error("Failed to upload image:", error);
          alert("Failed to upload image. Please try again.");
      }
  };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline /> {/* Normalize and apply global styles */}
            {/* Conditional Rendering of Screens */}
            {currentScreen === "login" && <Login onOTPSent={handleOTPSent} />}
            {currentScreen === "otp" && userDetails && (
                <OTPVerification
                    phoneNumber={userDetails.phoneNumber} // Pass phone number to OTPVerification
                    selfie={userDetails.selfie} // Pass uploaded selfie
                    onVerify={handleOTPVerified} // Pass handler for OTP verification
                />
            )}
            {currentScreen === "home" && (
                <Home
                    phoneNumber={userDetails.phoneNumber} // Pass phone number
                    eventCode={userDetails.eventCode}
                    initialImages={images} // Pass matched images
                    onReupload={handleReupload} // Pass reupload handler
                    onUpload={handleUpload} // Pass upload handler
                />
            )}
        </ThemeProvider>
    );
}

export default App;