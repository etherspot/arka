import { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState();
  const [isSigningIn, setIsSigningIn] = useState(false);


  const getBalance = async (address) => {
    try {
      // Requesting balance method
      const balance = await window.ethereum
        .request({
          method: "eth_getBalance",
          params: [address, "latest"]
        })
      return balance;
    } catch (err) {
      console.error('Error on retrieving balance', err);
      return 0;
    }
  };

  const initializeProvider = async () => {
    const res = await window.ethereum
      .request({ method: "eth_requestAccounts" });
    return res[0];
  }

  const accountChangeHandler = async (accounts) => {
    setUser(null);
  };

  const signIn = async () => {
    try {
      if (!window.ethereum) return null;
      setIsSigningIn(true);
      const address = await initializeProvider();
      const balance = await getBalance(address);
      setUser({ address, balance });
      setIsSigningIn(false);
      return { address, balance };
    } catch (error) {
      console.error('error', error);
      setIsSigningIn(false);
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
