import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

export const getCycleFromDate = (dateStr: string): 1 | 2 | 3 => {
  const month = new Date(dateStr).getMonth() + 1;
  if (month >= 8 && month <= 11) return 1;
  if (month === 12 || (month >= 1 && month <= 3)) return 2;
  return 3;
};
