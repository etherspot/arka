import React from "react";
import { Route, Routes } from 'react-router-dom';
import NotFound from './components/NotFound';
import Dashboard from "./components/Dashboard";
import { AuthContextProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

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
      <div className='mx-auto h-max' style={{ height: '105vh', overflowY: 'auto', overflowX: 'auto' }}>
      <AuthContextProvider>
        <Routes>
          <Route path='/' element={<Dashboard />} />
          <Route path='*' element={<NotFound />} />
        </Routes>
      </AuthContextProvider>
    </div>
    </ThemeProvider>
    </>
  );

}

export default App;