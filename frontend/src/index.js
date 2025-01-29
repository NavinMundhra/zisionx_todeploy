import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Function to handle PWA install prompt
const handlePWAInstall = () => {
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // Prevent automatic prompt
    deferredPrompt = event;

    // Show a floating "Install App" button
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
        console.log('ServiceWorker registered:', registration);
      })
      .catch((error) => {
        console.log('ServiceWorker registration failed:', error);
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
