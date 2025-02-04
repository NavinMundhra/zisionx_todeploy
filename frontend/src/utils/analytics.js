import ReactGA from "react-ga4";

export const trackButtonClick = (event) => {
  const buttonText = event.target.innerText || "Unnamed Button";

  ReactGA.event("button_click", {
    button_text: buttonText, // Custom parameter to track which button was clicked
    event_category: "Button", // Optional: Add a category for better filtering in GA4
    event_label: "Custom Button Click", // Optional: Add a label if needed
  });

  console.log("GA4 Event Sent: Button Click -", buttonText); // Debugging
};