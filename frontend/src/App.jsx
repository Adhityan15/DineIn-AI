import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { BranchProvider } from './contexts/BranchContext';
import { RealTimeProvider } from './contexts/RealTimeContext';
import AppRoutes from './routes';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <BranchProvider>
            <RealTimeProvider>
              <AppRoutes />
            </RealTimeProvider>
          </BranchProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
