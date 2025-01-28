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
    Checkbox,
    Dialog,
    DialogContent,
    DialogActions,
    CircularProgress,
} from "@mui/material";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axios from "axios";

const Home = ({ initialImages = [], onUpload, onReupload, onLogout, phoneNumber, eventCode }) => {
    const [images, setImages] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [currentImage, setCurrentImage] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [isReuploading, setIsReuploading] = useState(false);
    const [reuploadComplete, setReuploadComplete] = useState(false);

    // Update images when `initialImages` changes
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
            }, 2000); // Simulate upload delay
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
            }, 2000); // Simulate reupload delay
        }
    };

    const toggleDrawer = (open) => () => {
        setDrawerOpen(open);
    };

    const handleImageSelect = (image) => {
        setSelectedImages((prev) =>
            prev.includes(image)
                ? prev.filter((img) => img !== image)
                : [...prev, image]
        );
    };

    const handleDownloadSelected = () => {
        selectedImages.forEach((image) => {
            const link = document.createElement("a");
            link.href = image.presigned_url;
            link.download = image.image_name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
        setSelectedImages([]);
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

    const handlePrintImage = async () => {
        if (currentImage) {
            try {
                const response = await axios.post("http://13.201.211.85:8000/api/print-it", {
                    phone_number: phoneNumber, // Pass the user's phone number
                    event_code: eventCode, // Pass the event code
                    image_name: currentImage.image_name, // Pass the image name
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

            {/* Subtitle */}
            <Box
                sx={{
                    width: "100%",
                    textAlign: "center",
                    backgroundColor: "#F4F4F4",
                    padding: "10px 0",
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
            </Box>

            {/* User Images */}
            <Box sx={{ marginTop: "80px", overflowY: "auto", width: "100%", padding: "0 20px" }}>
                {images.length === 0 ? (
                    <Typography variant="body1" sx={{ marginBottom: 2 }}>
                        No images found.
                    </Typography>
                ) : (
                    <Grid container spacing={2} sx={{ marginBottom: 5 }}>
                        {images.map((image, index) => (
                            <Grid
                                item
                                xs={6}
                                key={index}
                                sx={{
                                    animation: "fadeIn 0.8s ease-in-out",
                                }}
                            >
                                <Box
                                    sx={{
                                        position: "relative",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        boxShadow: "0px 9px 11px rgba(0, 0, 0, 0.07)",
                                        border: "1px solid #ddd",
                                        padding: 0,
                                        margin: 0,
                                    }}
                                    onClick={() => handleImageClick(index)}
                                >
                                    <Checkbox
                                        sx={{
                                            position: "absolute",
                                            top: "1px",
                                            left: "1px",
                                            backgroundColor: "#fff",
                                            borderRadius: "50%",
                                            transform: "scale(0.5)",
                                        }}
                                        checked={selectedImages.includes(image)}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleImageSelect(image);
                                        }}
                                    />
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

            {/* Download Selected Button */}
            {selectedImages.length > 0 && (
                <Button
                    variant="contained"
                    sx={{
                        marginBottom: 3,
                        fontWeight: 600,
                        backgroundColor: "#20424D",
                        color: "#fff",
                        "&:hover": {
                            backgroundColor: "#162d33",
                        },
                    }}
                    onClick={handleDownloadSelected}
                >
                    Download Selected
                </Button>
            )}

            {/* Bottom Buttons */}
            <Box
                sx={{
                    position: "fixed",
                    bottom: "20px",
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "20px",
                }}
            >
                {/* Camera Button */}
                <Fab
                    color="primary"
                    aria-label="upload"
                    sx={{
                        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                        backgroundColor: "#20424D",
                        "&:hover": {
                            backgroundColor: "#162d33",
                        },
                    }}
                    component="label"
                >
                    {isUploading ? (
                        uploadComplete ? (
                            <CheckCircleIcon sx={{ color: "#fff", fontSize: "24px" }} />
                        ) : (
                            <CircularProgress size={24} sx={{ color: "#fff" }} />
                        )
                    ) : (
                        <AddAPhotoIcon sx={{ color: "#fff" }} />
                    )}
                    <input type="file" accept="image/*" hidden capture="user" onChange={handleUploadClick} />
                </Fab>

                {/* Reupload Selfie Button */}
<Button
    variant="contained"
    component="label"
    sx={{
        fontWeight: 700,
        backgroundColor: "#20424D",
        color: "#fff",
        borderRadius: "10px",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        "&:hover": {
            backgroundColor: "#162d33",
        },
    }}
>
    {isReuploading ? (
        reuploadComplete ? (
            <CheckCircleIcon sx={{ color: "#fff", fontSize: "24px" }} />
        ) : (
            <CircularProgress size={24} sx={{ color: "#fff" }} />
        )
    ) : (
        <>
            <CloudUploadIcon sx={{ color: "#fff", fontSize: "20px" }} />
            Re-upload Selfie
        </>
    )}
    <input type="file" accept="image/*" hidden onChange={handleReuploadClick} />
</Button>
            </Box>

            {/* Side Drawer */}
            <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
                <Box
                    sx={{
                        width: 250,
                        padding: 2,
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            fontSize: "40px",
                            fontFamily: "Oranienbaum, serif",
                            marginBottom: 2,
                            textAlign: "center",
                        }}
                    >
                        ZisionX
                    </Typography>
                    <List>
                        <ListItem>
                            <label htmlFor="reupload-selfie">
                                <ListItemText
                                    primary="Reupload Selfie"
                                    sx={{ fontWeight: "bold", cursor: "pointer" }}
                                />
                                <input
                                    id="reupload-selfie"
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handleReuploadClick}
                                />
                            </label>
                        </ListItem>
                        <hr />
                        <ListItem button onClick={onLogout}>
                            <ListItemText
                                primary="Logout"
                                sx={{ fontWeight: "bold", cursor: "pointer" }}
                            />
                        </ListItem>
                    </List>
                </Box>
            </Drawer>

            {/* Image Viewer Dialog */}
            <Dialog open={!!currentImage} onClose={handleCloseViewer} fullWidth maxWidth="md">
                <DialogActions>
                    <IconButton onClick={handleCloseViewer} sx={{ position: "absolute", top: 10, right: 10 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogActions>
                <DialogContent
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                    }}
                >
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <IconButton onClick={handlePreviousImage}>
                            <ArrowBackIosIcon />
                        </IconButton>
                        <img
                            src={currentImage?.presigned_url}
                            alt=""
                            style={{
                                maxWidth: "80%",
                                maxHeight: "80vh",
                                objectFit: "contain",
                            }}
                        />
                        <IconButton onClick={handleNextImage}>
                            <ArrowForwardIosIcon />
                        </IconButton>
                    </Box>
                    <Button
                        variant="contained"
                        sx={{
                            marginTop: 2,
                            backgroundColor: "#20424D",
                            "&:hover": {
                                backgroundColor: "#162d33",
                            },
                        }}
                        onClick={handlePrintImage}
                    >
                        Get it Printed
                    </Button>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default Home;
