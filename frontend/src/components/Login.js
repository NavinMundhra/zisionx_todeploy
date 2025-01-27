import React, { useState } from "react";
import { TextField, Button, Typography, Box } from "@mui/material";

const Login = ({ onOTPSent }) => {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [eventCode, setEventCode] = useState("");
    const [selfie, setSelfie] = useState(null);
    const [selfieUploaded, setSelfieUploaded] = useState(false);

    const handleSelfieChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelfie(file); // Store the selfie file
            setSelfieUploaded(true); // Mark the selfie as uploaded
        }
    };

    const handleSendOTP = async () => {
        if (!phoneNumber || !eventCode || !selfie) {
            alert("Please fill in all details and upload a selfie.");
            return;
        }

        try {
            alert("Your OTP is 0000. Please enter it on the next screen.");
            onOTPSent({ phoneNumber, eventCode, selfie }); // Move to OTP Verification
        } catch (error) {
            console.error("Failed to send OTP:", error);
            alert("Error sending OTP. Please try again.");
        }
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
                    zIndex: "-1",
                    opacity: "0.2", // Reduce opacity for better visibility of content
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
                    marginBottom: 3, // Margin below the heading
                    fontWeight: 700, // Bold text
                    color: "#333", // Text color
                    fontFamily: "Oranienbaum, serif", // Apply Oranienbaum font
                    fontSize: "90px", // Increase text size
                    zIndex: 1, // Ensure it appears above the video
                }}
            >
                ZisionX
            </Typography>

            {/* Phone Number Input Box */}
            <TextField
                variant="outlined"
                fullWidth
                placeholder="Phone number"
                sx={{
                    marginBottom: 2, // Spacing below the input box
                    backgroundColor: "#fff", // White background
                    borderRadius: "10px", // Rounded corners
                    height: "40px", // Fixed height for input box
                    width: "75%", // Reduced width
                    "& .MuiOutlinedInput-root": {
                        border: "1px solid black", // Black stroke for the box
                        borderRadius: "10px", // Rounded corners
                        textAlign: "center", // Center-align text
                    },
                    "& .MuiOutlinedInput-input": {
                        textAlign: "center", // Center-align placeholder and input text
                    },
                    zIndex: 1, // Ensure it appears above the video
                }}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
            />

            {/* Event Code Input Box */}
            <TextField
                variant="outlined"
                fullWidth
                placeholder="Event Code"
                sx={{
                    marginBottom: 2, // Spacing below the input box
                    backgroundColor: "#fff", // White background
                    borderRadius: "10px", // Rounded corners
                    height: "40px", // Fixed height for input box
                    width: "75%", // Reduced width
                    "& .MuiOutlinedInput-root": {
                        border: "1px solid black", // Black stroke for the box
                        borderRadius: "10px", // Rounded corners
                        textAlign: "center", // Center-align text
                    },
                    "& .MuiOutlinedInput-input": {
                        textAlign: "center", // Center-align placeholder and input text
                    },
                    zIndex: 1, // Ensure it appears above the video
                }}
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value)}
            />

            {/* Upload Selfie Button */}
            <Button
                variant={selfieUploaded ? "contained" : "outlined"}
                component="label"
                fullWidth
                sx={{
                    marginBottom: 3, // Spacing below the button
                    backgroundColor: selfieUploaded ? "#fff" : "#20424D", // Initial color dark blue, white when uploaded
                    color: selfieUploaded ? "#000" : "#fff", // Text color
                    fontWeight: 600, // Bold text
                    width: "60%", // Same width as input boxes
                    height: "40px", // Fixed height
                    border: selfieUploaded ? "1px solid black" : "none", // Black stroke when uploaded
                    borderRadius: "10px", // Rounded corners
                    zIndex: 1, // Ensure it appears above the video
                }}
            >
                {selfieUploaded ? "Uploaded" : "Upload Selfie"}
                <input
                    type="file"
                    accept="image/*"
                    hidden
                    capture="user" // Opens the user's camera
                    onChange={handleSelfieChange}
                />
            </Button>

            {/* Get Started Button */}
            <Button
                variant="contained"
                color={selfieUploaded ? "primary" : "default"}
                fullWidth
                disabled={!selfieUploaded}
                sx={{
                    fontWeight: 700, // Bold text
                    backgroundColor: selfieUploaded ? "#20424D" : "#ccc", // Custom color when enabled
                    color: "#fff", // Text color
                    height: "40px", // Fixed height
                    width: "50%", // Smaller width than input boxes
                    borderRadius: "10px", // Rounded corners
                    "&:hover": {
                        backgroundColor: selfieUploaded ? "#162d33" : "#ccc", // Darker shade on hover
                    },
                    zIndex: 1, // Ensure it appears above the video
                }}
                onClick={handleSendOTP}
            >
                Get Started
            </Button>
        </Box>
    );
};

export default Login;