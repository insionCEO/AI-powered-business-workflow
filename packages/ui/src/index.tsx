import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './components/providers/ThemeProvider';
import { GlobalStyle } from './components/shared/Node.styles';
import { SocketProvider } from './components/providers/SocketProvider';
import { Fallback } from './components/tools/Fallback';
import './i18n';
import { ToastContainer } from 'react-toastify';
import App from './components/App';
import { Amplify } from "aws-amplify";
import { UserProvider } from './components/providers/UserProvider';

import('./aws-exports')
  .then((module) => {
    const awsExports = module.default;
    Amplify.configure(awsExports);
  })
  .catch((error) => {
    console.error("aws-exports module not found");
  });


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <GlobalStyle />
    <UserProvider>
      <SocketProvider>
        <ThemeProvider>
          <Suspense fallback={<Fallback />}>
            <ToastContainer />
            <App />
          </Suspense>
        </ThemeProvider>
      </SocketProvider>
    </UserProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
