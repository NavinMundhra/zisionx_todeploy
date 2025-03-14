import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { injectContentsquareScript } from '@contentsquare/tag-sdk';
import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = "G-QSGSDM0N8M";

// Initialize Google Analytics 4
ReactGA.initialize(GA_MEASUREMENT_ID);
ReactGA.send("pageview"); // Send initial pageview

// // ✅ Inject Google Analytics manually as a fallback
// const injectGoogleAnalytics = () => {
//   const script = document.createElement("script");
//   script.async = true;
//   script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
//   document.head.appendChild(script);

//   window.dataLayer = window.dataLayer || [];
//   function gtag(...args) {
//     window.dataLayer.push(args);
//   }
//   gtag("js", new Date());
//   gtag("config", GA_MEASUREMENT_ID);
// };

// injectGoogleAnalytics();

injectContentsquareScript({
  siteId: "5291436",
  async: true, // Optional: Set to false to wait for script execution until after document parsing.
  defer: false // Optional: Set to true to defer script execution after document parsing.
});



// Handle PWA Install Prompt
const handlePWAInstall = () => {
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // Prevent automatic prompt
    deferredPrompt = event;

    // Show the "Install" button
    const installButton = document.createElement("button");
    installButton.innerText = "Install ZisionX App";
    installButton.style.position = "fixed";
    installButton.style.bottom = "20px";
    installButton.style.right = "20px";
    installButton.style.padding = "12px 18px";
    installButton.style.background = "#20424D";
    installButton.style.color = "#fff";
    installButton.style.fontSize = "16px";
    installButton.style.border = "none";
    installButton.style.borderRadius = "5px";
    installButton.style.cursor = "pointer";
    installButton.style.zIndex = "1000";

    installButton.addEventListener("click", () => {
      deferredPrompt.prompt(); // Show install popup
      deferredPrompt.userChoice.then((choice) => {
        if (choice.outcome === "accepted") {
          console.log("User installed PWA");
        } else {
          console.log("User dismissed install prompt");
        }
        installButton.remove();
      });
    });

    document.body.appendChild(installButton);
  });
};

// Call function to check PWA install prompt
handlePWAInstall();

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
