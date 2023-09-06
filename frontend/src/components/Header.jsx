import React, { useState } from "react";
import { useEffect } from "react";
import { styled } from "styled-components";

// context
import { UserAuth } from "../context/AuthContext";

// assets
import EtherspotLogo from '../assets/internal-48-etherspot@2x.png';

const LogoText = styled.span`
    margin: '3px 0 4px 8px', 
    font-size: '24px', 
    text-align: 'center', 
    color: '#cfcfcf'
  `

const Header = () => {
  const { user, signIn } = UserAuth();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (user?.address) setSignedIn(true);
  }, [user])

  return (
    <div className="flex justify-between w-full items-center mx-auto p-4">
      <div className="flex items-center text-cyan-400">
        <img src={EtherspotLogo} width={36} height={36} alt={'EtherspotLogo'} />
        <LogoText>Etherspot Arka</LogoText>
      </div>
      { signedIn ? <span className="text-white text-sm">{user?.address}</span> :
      <button onClick={signIn} className="w-40 h-10 font-medium text-sm rounded-full" style={{ backgroundColor: "#2f2f2f", color: "#fff" }}>
        Connect Wallet
      </button>}
    </div>
  );
};

export default Header;
