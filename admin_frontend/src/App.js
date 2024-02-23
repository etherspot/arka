import React from "react";
import { Route, Routes } from 'react-router-dom';

// components
import { Toaster } from "react-hot-toast";
import NotFound from './components/NotFound';
import Dashboard from "./components/Dashboard";
import ApiKeysPage from "./components/ApiKeys";

// Css
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthContextProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {

  return (
    <>
      <Toaster />
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <div className='mx-auto h-max' style={{ overflowY: 'auto', overflowX: 'auto' }}>
          <AuthContextProvider>
            <Routes>
              <Route path='/' element={<Dashboard />} />
              <Route path='/apiKey' element={
                <ProtectedRoute>
                  <ApiKeysPage />
                </ProtectedRoute>} />
              <Route path='*' element={<NotFound />} />
            </Routes>
          </AuthContextProvider>
        </div>
      </ThemeProvider>
    </>
  );

}

export default App;