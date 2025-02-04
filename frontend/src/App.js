import React, { useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./components/theme";
import Login from "./components/Login";
import OTPVerification from "./components/OTPVerification";
import Home from "./components/Home";
import { searchImage, uploadImage } from "./services/api";
import ReactGA from "react-ga4";

// 🔹 Replace with your Google Analytics 4 Measurement ID
const GA_MEASUREMENT_ID = "G-QSGSDM0N8M";
ReactGA.initialize(GA_MEASUREMENT_ID);

function App() {
    const [currentScreen, setCurrentScreen] = useState("login"); 
    const [userDetails, setUserDetails] = useState(null);
    const [images, setImages] = useState([]);
    const [selfie, setSelfie] = useState(null);

    // Function to send screen views to Google Analytics
    const trackScreenView = (screenName) => {
        ReactGA.send({
            hitType: "pageview",
            page: `/${screenName.toLowerCase().replace(" ", "-")}`, // e.g., "/login-screen"
            title: screenName, // e.g., "Login Screen"
        });
        console.log(`📊 GA4 Tracking: ${screenName}`); // Debug log
    };

    // Track screen changes
    useEffect(() => {
        switch (currentScreen) {
            case "login":
                trackScreenView("Login Screen");
                break;
            case "otp":
                trackScreenView("OTP Verification");
                break;
            case "home":
                trackScreenView("Home Screen");
                break;
            default:
                trackScreenView("Unknown Screen");
        }
    }, [currentScreen]); // Runs whenever `currentScreen` changes

    // Handle OTP Sent
    const handleOTPSent = (details) => {
        setUserDetails(details);
        setCurrentScreen("otp");
    };

    // Handle OTP Verified
    const handleOTPVerified = (matchedImages, uploadedSelfie) => {
        setImages(matchedImages);
        setSelfie(uploadedSelfie);
        setCurrentScreen("home");
    };

    // Handle Reupload Selfie
    const handleReupload = async (file) => {
        try {
            const formData = new FormData();
            formData.append("file", file);
            console.log("Payload sent:", formData);

            const response = await searchImage(file);
            const newImages = response.data.matches || [];
            setImages(newImages);
        } catch (error) {
            console.error("Error reuploading selfie:", error);
            alert("Failed to fetch images. Please try again.");
        }
    };

    // Handle Upload Image
    const handleUpload = async (file) => {
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("eventcode", userDetails.eventCode);

            console.log("Upload payload:", formData);
            const response = await uploadImage(formData);
            console.log("Upload response:", response);
            alert("Image uploaded successfully!");
        } catch (error) {
            console.error("Failed to upload image:", error);
            alert("Failed to upload image. Please try again.");
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {/* Render Screens Based on Current Screen */}
            {currentScreen === "login" && <Login onOTPSent={handleOTPSent} />}
            {currentScreen === "otp" && userDetails && (
                <OTPVerification
                    phoneNumber={userDetails.phoneNumber}
                    selfie={userDetails.selfie}
                    onVerify={handleOTPVerified}
                />
            )}
            {currentScreen === "home" && (
                <Home
                    phoneNumber={userDetails.phoneNumber}
                    eventCode={userDetails.eventCode}
                    initialImages={images}
                    selfie={selfie}
                    onReupload={handleReupload}
                    onUpload={handleUpload}
                />
            )}
        </ThemeProvider>
    );
}

export default App;