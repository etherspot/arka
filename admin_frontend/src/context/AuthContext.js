import { createContext, useContext, useState } from 'react';
import toast from "react-hot-toast";
import { ENDPOINTS } from '../constants/constants';

const UserContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const initializeProvider = async () => {
    const res = await window.ethereum
      .request({ method: "eth_requestAccounts" });
    return res[0];
  }

  const accountChangeHandler = async (accounts) => {
    try {
      const data = await fetch(`${process.env.REACT_APP_SERVER_URL}${ENDPOINTS['adminLogin']}`, {
        method: "POST",
        body: JSON.stringify({ WALLET_ADDRESS: accounts[0] }),
      });
      const dataJson = await data.json();
      if (!dataJson.error) {
        toast.success("Logged In Successfully");
        setUser({ address: accounts[0] });
      } else {
        toast.error("Failed to authenticate with this wallet. Please make sure the address is associated with admin address given and try again");
      }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        toast.error('Failed to access the server url');
      } else {
        toast.error(error?.message);
      }
      setUser(null);
    }
  };

  const signIn = async () => {
    try {
      if (!window.ethereum) {
        toast.error('Cannot determine any injected wallet')
        return null;
      }
      setIsSigningIn(true);
      const address = await initializeProvider();
      const data = await fetch(`${process.env.REACT_APP_SERVER_URL}${ENDPOINTS['adminLogin']}`, {
        method: "POST",
        body: JSON.stringify({ WALLET_ADDRESS: address }),
      });
      const dataJson = await data.json();
      if (!dataJson.error) {
        toast.success("Logged In Successfully");
        setUser({ address });
        setIsSigningIn(false);
        return { address };
      } else {
        toast.error("Failed to authenticate with this wallet. Please make sure the address is associated with admin address given and try again");
        setIsSigningIn(false);
        return null;
      }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        toast.error('Failed to access the server url')
      } else {
        toast.error(error?.message);
      }
      setIsSigningIn(false);
      setUser(null);
      return null;
    }
  };

  window.ethereum.on('accountsChanged', accountChangeHandler)

  const logout = async () => {
    setUser(null)
  };

  return <UserContext.Provider value={{ user, isSigningIn, logout, signIn }}>{children}</UserContext.Provider>;
};

export const UserAuth = () => {
  return useContext(UserContext);
};
