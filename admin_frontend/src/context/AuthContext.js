import { createContext, useContext, useState } from 'react';
import toast from "react-hot-toast";

const UserContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const initializeProvider = async () => {
    const res = await window.ethereum
      .request({ method: "eth_requestAccounts" });
    console.log(res[0]);
    return res[0];
  }

  const accountChangeHandler = async (accounts) => {
    const data = await (
      await fetch("http://localhost:5050/adminLogin", {
        method: "POST",
        body: JSON.stringify({WALLET_ADDRESS: accounts[0]}),
      })
    ).json();
    if (!data.error) {
      toast.success("Logged In Successfully");
      setUser({address: accounts[0]});
    } else {
      toast.error("Login Failed");
    }
  };

  const signIn = async () => {
    try {
      if (!window.ethereum) return null;
      setIsSigningIn(true);
      const address = await initializeProvider();
      // const balance = await getBalance(address);
      const data = await (
				await fetch("http://localhost:5050/adminLogin", {
					method: "POST",
					body: JSON.stringify({WALLET_ADDRESS: address}),
				})
			).json();
			if (!data.error) {
				toast.success("Logged In Successfully");
        setUser({address});
        return { address };
			} else {
				toast.error("Login Failed");
			}
      setIsSigningIn(false);
      return null;
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
