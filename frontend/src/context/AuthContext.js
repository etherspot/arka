import { createContext, useContext, useState } from 'react';
import { ethers } from 'ethers';

const UserContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [data, setData] = useState({
    address: "",
    Balance: null,
  });


  const getBalance = async (address) => {

    // Requesting balance method
    const balance = await window.ethereum
      .request({
        method: "eth_getBalance",
        params: [address, "latest"]
      })
    setData({ address, Balance: ethers.utils.formatEther(balance) })
    return balance;
  };

  const initializeProvider = async () => {
    const res = await window.ethereum
      .request({ method: "eth_requestAccounts" });
    return res[0];
  }

  const accountChangeHandler = async (accounts) => {
    console.log('in here', accounts)
    const account = accounts[0];
    // Setting an address data
    setData({
      address: account,
    });
    setUser(null);
  };

  const signIn = async () => {
    try {
      if (!window.ethereum) return null;
      setIsSigningIn(true);
      const address = await initializeProvider();
      console.log('data: ', data, address);
      const balance = await getBalance(address);
      setUser({ address, balance });
      setIsSigningIn(false);
      return { address, balance };
    } catch (error) {
      console.log('error', error);
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
