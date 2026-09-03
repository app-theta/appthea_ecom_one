import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import './styles/bootstrap-custom.scss';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/app.css';

import { applyTheme } from './theme/applyTheme';
import { defaultTheme } from './theme/defaultTheme';

/* Apply before first paint so no component ever renders un-themed. */
applyTheme(defaultTheme);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
