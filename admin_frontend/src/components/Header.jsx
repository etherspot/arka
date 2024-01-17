import React from "react";
import { styled } from "styled-components";

// assets
import EtherspotLogo from '../assets/internal-48-etherspot@2x.png';

const LogoText = styled.span`
    margin: '3px 0 4px 8px', 
    font-size: '24px', 
    text-align: 'center', 
    color: '#cfcfcf'
  `

const Header = () => {
  return (
    <div className="flex justify-center w-full items-center mx-auto p-4">
      <div className="flex items-center text-cyan-400">
        <img src={EtherspotLogo} width={36} height={36} alt={'EtherspotLogo'} />
        <LogoText>Arka Admin Config Settings</LogoText>
      </div>
    </div>
  );
};

export default Header;
