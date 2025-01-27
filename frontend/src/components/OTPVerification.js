import React, { useState, useRef } from "react";
import { Box, Typography, Button } from "@mui/material";
import { validateOTP, searchImage } from "../services/api";

const OTPVerification = ({ phoneNumber, selfie, onVerify }) => {
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRefs = useRef([]);

    const handleInputChange = (value, index) => {
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // Ensure only the last character is kept
        setOtp(newOtp);

        // Move to the next input box if the current one is filled
        if (value && index < 3) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleBackspace = (e, index) => {
        if (e.key === "Backspace" && index > 0 && !otp[index]) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleValidateOTP = async () => {
        const enteredOtp = otp.join("");
        if (enteredOtp.length !== 4) {
            alert("Please enter the complete OTP.");
            return;
        }

        setIsLoading(true);
        try {
            // Validate OTP with the backend
            await validateOTP(phoneNumber, enteredOtp);

            // Search for images with the uploaded selfie
            const searchResponse = await searchImage(selfie);
            const matches = searchResponse.data.matches || [];

            alert("OTP validated successfully!");
            onVerify(matches); // Pass the matched images to the Home screen
        } catch (error) {
            console.error("Failed to validate OTP or fetch images:", error);
            alert("Invalid OTP or failed to fetch images. Please try again.");
        }
        setIsLoading(false);
    };

    return (
        <Box
            sx={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                width: "100vw",
                overflow: "hidden",
                padding: "20px",
            }}
        >
            {/* Background Video */}
            <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                    position: "absolute",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    zIndex: "-1", // Ensure video is in the background
                    opacity: "0.2", // Adjust opacity for visibility
                }}
            >
                <source src="/assets/background_video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* ZisionX Heading */}
            <Typography
                variant="h3"
                component="h1"
                sx={{
                    marginBottom: 3,
                    fontWeight: 700,
                    color: "#333",
                    fontFamily: "Oranienbaum, serif",
                    fontSize: "90px",
                    zIndex: 1, // Ensure it appears above the video
                }}
            >
                ZisionX
            </Typography>

            {/* Instruction Text */}
            <Typography
                variant="body1"
                sx={{
                    marginBottom: 2,
                    textAlign: "center",
                    zIndex: 1, // Ensure it appears above the video
                }}
            >
                Enter OTP to continue
            </Typography>

            {/* OTP Input Boxes */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: 3,
                    gap: "10px", // Spacing between input boxes
                    zIndex: 1, // Ensure it appears above the video
                }}
            >
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)} // Assign ref for each input
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleInputChange(e.target.value, index)}
                        onKeyDown={(e) => handleBackspace(e, index)}
                        style={{
                            width: "50px",
                            height: "50px",
                            fontSize: "24px",
                            textAlign: "center",
                            borderRadius: "10px",
                            border: "1px solid black",
                            backgroundColor: "#fff",
                            outline: "none",
                        }}
                    />
                ))}
            </Box>

            {/* Verify OTP Button */}
            <Button
                variant="contained"
                color="primary"
                fullWidth
                disabled={isLoading}
                sx={{
                    fontWeight: 700,
                    backgroundColor: isLoading ? "#ccc" : "#20424D",
                    color: "#fff",
                    height: "40px",
                    width: "50%",
                    borderRadius: "10px",
                    zIndex: 1, // Ensure it appears above the video
                    "&:hover": {
                        backgroundColor: isLoading ? "#ccc" : "#162d33",
                    },
                }}
                onClick={handleValidateOTP}
            >
                {isLoading ? "Validating..." : "Verify OTP"}
            </Button>
        </Box>
    );
};

export default OTPVerification;