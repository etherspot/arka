import { useEffect, useState } from "react";
import { styled } from "styled-components";
import Link from "@mui/material/Link";
import { useNavigate } from 'react-router-dom';
// context
import { UserAuth } from "../context/AuthContext";

// assets
import EtherspotLogo from "../assets/internal-48-etherspot@2x.png";

const LogoText = styled.span`
    margin: '3px 0 4px 8px', 
    font-size: '24px', 
    text-align: 'center', 
    color: '#cfcfcf'
  `;

const Header = ({ text }) => {
	const { user, signIn } = UserAuth();
  const navigate = useNavigate() 
	const [signedIn, setSignedIn] = useState(false);

	useEffect(() => {
		if (user?.address) setSignedIn(true);
	}, [user]);

	return (
		<div className="flex justify-between w-full items-center mx-auto p-4">
			<div className="flex items-center text-cyan-400">
				<img src={EtherspotLogo} width={36} height={36} alt={"EtherspotLogo"} />
				<LogoText>{text}</LogoText>
			</div>
			<div>
				{signedIn ? (
					<>
						<Link
							component="button"
							variant="body2"
							onClick={() => {
								navigate('/')
							}}
						>
							Home
						</Link>
						<Link
							component="button"
							variant="body2"
              sx={{padding: '2rem'}}
							onClick={() => {
								navigate('/apiKey')
							}}
						>
							Api Keys
						</Link>
					</>
				) : (
					<></>
				)}
				{signedIn ? (
					<span className="text-white text-sm">{user?.address}</span>
				) : (
					<button
						onClick={signIn}
						className="w-40 h-10 font-medium text-sm rounded-full"
						style={{ backgroundColor: "#2f2f2f", color: "#fff" }}
					>
						Connect Wallet
					</button>
				)}
			</div>
		</div>
	);
};

export default Header;
