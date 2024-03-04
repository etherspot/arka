import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from "react-hot-toast";
import { UserAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = UserAuth();
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      toast.error('Please connect to wallet to verify')
      navigate('/')
    }
  }, [user, navigate])

  return (
    <>
      {children}
    </>
  )
};

export default ProtectedRoute;
