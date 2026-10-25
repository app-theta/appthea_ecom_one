import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import './styles/bootstrap-custom.scss';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/app.css';

import { applyTheme } from './theme/applyTheme';
import { defaultTheme } from './theme/defaultTheme';
import { restoreWebsiteTheme } from './theme/websiteTheme';

/* Apply before first paint so no component ever renders un-themed - with the
   business's colours from the last visit, until business/info brings today's. */
applyTheme(defaultTheme);
restoreWebsiteTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
