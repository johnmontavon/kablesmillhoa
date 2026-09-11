import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';


// Optional GA4: set REACT_APP_GA_MEASUREMENT_ID to enable; unset = no-op
const gaId = process.env.REACT_APP_GA_MEASUREMENT_ID;
if (gaId) {
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  const gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", gaId);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
