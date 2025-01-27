import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: "10px", // Set global corner radius
          height: "40px", // Set global height for input boxes
          "& .MuiInputBase-input": {
            padding: "10px 14px", // Adjust padding for input text
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "10px", // Set global corner radius for buttons
          height: "40px", // Set global height for buttons
        },
      },
    },
  },
});

export default theme;