import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Fab,
    Grid,
    Drawer,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Button,
    Dialog,
    DialogContent,
    DialogActions,
    CircularProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axios from "axios";

const Home = ({ initialImages = [], onUpload, onReupload, onLogout, phoneNumber, eventCode }) => {
    const [images, setImages] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentImage, setCurrentImage] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [isReuploading, setIsReuploading] = useState(false);
    const [reuploadComplete, setReuploadComplete] = useState(false);

    useEffect(() => {
        setImages(initialImages);
    }, [initialImages]);

    const handleUploadClick = (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsUploading(true);
            setUploadComplete(false);
            setTimeout(() => {
                onUpload(file);
                setIsUploading(false);
                setUploadComplete(true);
            }, 2000);
        }
    };

    const handleReuploadClick = (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsReuploading(true);
            setReuploadComplete(false);
            setTimeout(() => {
                onReupload(file);
                setIsReuploading(false);
                setReuploadComplete(true);
            }, 2000);
        }
    };

    const handleRefresh = () => {
        setImages(initialImages);
    };

    const toggleDrawer = (open) => () => {
        setDrawerOpen(open);
    };

    const handleImageClick = (index) => {
        setCurrentImage(images[index]);
        setCurrentIndex(index);
    };

    const handleCloseViewer = () => {
        setCurrentImage(null);
    };

    const handleNextImage = () => {
        const nextIndex = (currentIndex + 1) % images.length;
        setCurrentIndex(nextIndex);
        setCurrentImage(images[nextIndex]);
    };

    const handlePreviousImage = () => {
        const prevIndex = (currentIndex - 1 + images.length) % images.length;
        setCurrentIndex(prevIndex);
        setCurrentImage(images[prevIndex]);
    };

    const handleDownloadImage = () => {
        if (currentImage) {
            const link = document.createElement("a");
            link.href = currentImage.presigned_url;
            link.download = currentImage.image_name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handlePrintImage = async () => {
        if (currentImage) {
            try {
                await axios.post("https://api.zisionx.com/api/print-it", {
                    phone_number: phoneNumber,
                    event_code: eventCode,
                    image_name: currentImage.image_name,
                });
                alert("Print request successful!");
            } catch (error) {
                console.error("Failed to print image:", error);
                alert("Failed to send print request. Please try again.");
            }
        }
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
                padding: "20px",
                backgroundColor: "#f9f9f9",
                height: "100vh",
                position: "relative",
            }}
        >
            {/* Hamburger Menu Icon */}
            <IconButton
                sx={{
                    position: "absolute",
                    top: "20px",
                    left: "20px",
                }}
                onClick={toggleDrawer(true)}
            >
                <MenuIcon fontSize="large" />
            </IconButton>

            {/* ZisionX Logo */}
            <Typography
                variant="h1"
                component="h1"
                sx={{
                    position: "absolute",
                    top: "15px",
                    left: "70px",
                    fontWeight: 600,
                    fontFamily: "Oranienbaum, serif",
                    fontSize: "50px",
                    color: "#333",
                }}
            >
                ZisionX
            </Typography>

            {/* Images of You Section */}
            <Box
                sx={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#F4F4F4",
                    padding: "10px 20px",
                    position: "sticky",
                    top: "80px",
                    zIndex: 10,
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        fontSize: "18px",
                        color: "#333",
                    }}
                >
                    Images of you
                </Typography>

                {/* Refresh Icon */}
                <IconButton onClick={handleRefresh} sx={{ color: "#20424D" }}>
                    <RefreshIcon fontSize="large" />
                </IconButton>
            </Box>

            {/* User Images */}
            <Box sx={{ marginTop: "10px", overflowY: "auto", width: "100%", padding: "0 20px" }}>
                {images.length === 0 ? (
                    <Typography variant="body1" sx={{ marginBottom: 2 }}>
                        No images found.
                    </Typography>
                ) : (
                    <Grid container spacing={2} sx={{ marginBottom: 5 }}>
                        {images.map((image, index) => (
                            <Grid item xs={6} key={index}>
                                <Box
                                    sx={{
                                        position: "relative",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        boxShadow: "0px 9px 11px rgba(0, 0, 0, 0.07)",
                                        border: "1px solid #ddd",
                                    }}
                                    onClick={() => handleImageClick(index)}
                                >
                                    <img
                                        src={image.presigned_url}
                                        alt=""
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>

            {/* Image Viewer Dialog */}
            <Dialog open={!!currentImage} onClose={handleCloseViewer} fullWidth maxWidth="md">
                <DialogActions>
                    <IconButton onClick={handleCloseViewer} sx={{ position: "absolute", top: 10, right: 10 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogActions>
                <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <IconButton onClick={handlePreviousImage}>
                            <ArrowBackIosIcon />
                        </IconButton>
                        <img src={currentImage?.presigned_url} alt="" style={{ maxWidth: "80%", maxHeight: "80vh" }} />
                        <IconButton onClick={handleNextImage}>
                            <ArrowForwardIosIcon />
                        </IconButton>
                    </Box>

                    {/* Download Button */}
                    <Button
                        variant="contained"
                        sx={{ marginTop: 2, backgroundColor: "#20424D" }}
                        onClick={handleDownloadImage}
                    >
                        <DownloadIcon /> Download
                    </Button>

                    {/* Print Button */}
                    <Button variant="contained" sx={{ marginTop: 2, backgroundColor: "#20424D" }} onClick={handlePrintImage}>
                        Get it Printed
                    </Button>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default Home;