import ReactGA from "react-ga4";

export const trackButtonClick = (event) => {
  const buttonText = event.target.innerText || "Unnamed Button";
  ReactGA.event({
    category: "User Interaction",
    action: `Clicked ${buttonText}`,
    label: "Button Click",
  });
};