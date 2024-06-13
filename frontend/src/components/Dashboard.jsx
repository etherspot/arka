import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { styled } from "styled-components";

// components
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import toast from "react-hot-toast";
import Header from "./Header";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import { Switch } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import RefreshIcon from "@mui/icons-material/Refresh";
import TransactionSentToast from "./TransactionSentToast";

// types
import PropTypes from "prop-types";

// context
import { UserAuth } from "../context/AuthContext";

// assets
import EtherspotLogo from "../assets/internal-36-etherspot@2x.png";

// constants
import { networks, ENDPOINTS } from "../utils/constant";
import EtherspotPaymasterAbi from "../abi/EtherspotPaymasterAbi.json";

const ITEM_HEIGHT = 48;
const MenuProps = {
	PaperProps: {
		style: {
			maxHeight: ITEM_HEIGHT * 4.5,
			width: 250,
			backgroundColor: "#1c1c1c",
			color: "white",
			border: "none",
		},
	},
};

function CustomTabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`tabpanel-${index}`}
			aria-labelledby={`tab-${index}`}
			{...other}
			className=" flex justify-center"
		>
			{value === index && (
				<Box>
					<Typography component={"span"}>{children}</Typography>
				</Box>
			)}
		</div>
	);
}

CustomTabPanel.propTypes = {
	children: PropTypes.node,
	index: PropTypes.number.isRequired,
	value: PropTypes.number.isRequired,
};

function a11yProps(index) {
	return {
		key: `tab-${index}`,
		"aria-controls": `tabpanel-${index}`,
	};
}

const DashBoardPage = styled.div`
    background: "#131313",
    height: "100%",
    display: "flex",
    flex-direction: "column"
  `;

const Dashboard = ({ logInType }) => {
	// Definitions
	const { user, signIn } = UserAuth();
	const [value, setValue] = React.useState(0);
	const [chainId, setChainId] = useState(80001);
	const [signedIn, setSignedIn] = useState(false);
	const [networksSupported, setNetworksSupported] = useState(
		Object.keys(networks)
	);
	const [supportedNetworks, setSupportedNetworks] = useState();
	const [isLoading, setIsLoading] = useState(false);
	const [paymasterBalance, setPaymasterBalance] = useState("0");
	const [useCustomPaymaster] = useState(false);
	const [customPaymasterAddress] = useState();
	const [selectedOption, setSelectedOption] = useState(0);
	const [amount, setAmount] = useState(0);
	const [checked, setChecked] = useState(false);
	const [buttonText, setButtonText] = useState("Deposit");
	const [whiteListAddress, setWhitelistAddress] = useState("");
	const [removeWhitelist, setRemoveWhitelist] = useState(false);
	const [whitelistButtonText, setWhitelistButtonText] =
		useState("Add to Whitelist");

	// Functions
	const getPaymasterContract = (chainId) => {
		if (!supportedNetworks) return null;
		const provider = new ethers.providers.JsonRpcProvider(
			supportedNetworks[chainId].rpcUrl,
			{
				name: "Connected Bundler",
				chainId: Number(chainId),
			}
		);
		if (useCustomPaymaster) {
			return new ethers.Contract(
				customPaymasterAddress,
				EtherspotPaymasterAbi,
				provider
			);
		} else {
			return new ethers.Contract(
				supportedNetworks[chainId].paymasterAddress,
				EtherspotPaymasterAbi,
				provider
			);
		}
	};

	const fetchData = async (address) => {
		try {
			setIsLoading(true);
			const data = await (
				await fetch(`${process.env.REACT_APP_SERVER_URL}${ENDPOINTS['getSupportedNetworks']}`, {
					method: "POST",
					body: JSON.stringify({ walletAddress: address }),
				})
			).json();
			const supportedNetworksChainIds = [];
			let supportedNetworks = {};

			data?.map((value) => {
				supportedNetworks[value.chainId] = {
					...networks[value.chainId],
					chainId: value.chainId,
					rpcUrl: value.bundler,
					paymasterAddress: value.contracts.etherspotPaymasterAddress,
				};
				supportedNetworksChainIds.push(value.chainId);
				return value;
			});
			setSupportedNetworks(supportedNetworks);
			setNetworksSupported(supportedNetworksChainIds);
			setIsLoading(false);
		} catch (err) {
			toast.error("Check Backend Service for more info");
		}
	};

	const getPaymasterBalance = async (chainId) => {
		try {
			if (!isLoading) {
				setIsLoading(true);
				const PaymasterContract = getPaymasterContract(chainId);
				if (PaymasterContract) {
					const balance = await PaymasterContract.getSponsorBalance(
						user?.address
					);
					setPaymasterBalance(ethers.utils.formatEther(balance));
				}
				setIsLoading(false);
			}
		} catch (err) {
			console.error(err);
			setPaymasterBalance("0");
		}
	};

	useEffect(() => {
		setIsLoading(false);
		if (user?.address) {
			setSignedIn(true);
			fetchData(user.address);
		}
		setIsLoading(false);
	}, [user]);

	useEffect(() => {
		getPaymasterBalance(chainId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [supportedNetworks]);

	const handleChange = (event, newValue) => {
		setValue(newValue);
	};

	const handleAmountChange = (e) => {
		const fixed = parseFloat(e.target.value).toFixed(18).toString();
		if (fixed.length < parseFloat(e.target.value).toString().length)
			e.target.value = fixed;
		setAmount(e.target.value);
	};

	const handleDepositChange = (e) => {
		setChecked(e.target.checked);
		if (e.target.checked) setButtonText("Withdraw");
		else setButtonText("Deposit");
	};

	const handleWhitelistSwitch = (e) => {
		setRemoveWhitelist(e.target.checked);
		if (e.target.checked) setWhitelistButtonText("Remove from Whitelist");
		else setWhitelistButtonText("Add to Whitelist");
	};

	const handleWhitelistAddressChange = (e) => {
		setWhitelistAddress(e.target.value);
	};

	const handleChangeChainId = async (event, newValue) => {
		setIsLoading(true);
		setPaymasterBalance("0");
		setChainId(newValue);
		await getPaymasterBalance(newValue);
		setIsLoading(false);
	};

	const handleOptionChange = (e) => {
		setSelectedOption(e.target.value);
	};

	const handleSubmit = async () => {
		try {
			setIsLoading(true);
			if (!user?.address) {
				const retUser = await signIn(logInType);
				if (!retUser) {
					toast.error("Please make sure that metamask is installed");
				} else toast.success("Logged in Successfully");
				return;
			}
			if (amount === 0) {
				toast.error("Please enter an amount to be Deposited/Withdrawn");
			}
			const PaymasterContract = getPaymasterContract(chainId);
			if (checked) {
				const encodedData = PaymasterContract.interface.encodeFunctionData(
					"withdrawFunds",
					[ethers.utils.parseEther(amount.toString())]
				);
				const txHash = await window.ethereum.request({
					method: "eth_sendTransaction",
					params: [
						{
							from: user.address, // The user's active address.
							to: PaymasterContract.address, // Required except during contract publications.
							data: encodedData,
						},
					],
				});
				toast.loading(
					(t) => (
						<TransactionSentToast
							txHash={txHash}
							t={t}
							blockExplorerLink={networks[chainId].blockExplorerLink}
						/>
					),
					{
						icon: "👏",
					}
				);
			} else {
				const encodedData = PaymasterContract.interface.encodeFunctionData(
					"depositFunds",
					[]
				);
				const txHash = await window.ethereum.request({
					method: "eth_sendTransaction",
					params: [
						{
							from: user.address, // The user's active address.
							to: PaymasterContract.address, // Required except during contract publications.
							data: encodedData,
							value: ethers.utils.parseEther(amount.toString()).toHexString(),
						},
					],
				});
				toast.loading(
					(t) => (
						<TransactionSentToast
							txHash={txHash}
							t={t}
							blockExplorerLink={networks[chainId].blockExplorerLink}
						/>
					),
					{
						icon: "👏",
					}
				);
			}
			setIsLoading(false);
		} catch (e) {
			console.error(e.message);
			toast.error("Something went wrong while submitting. Please check your injected wallet");
			setIsLoading(false);
		}
	};

	const handleWhitelistSubmit = async () => {
		try {
			setIsLoading(true);
			if (!ethers.utils.isAddress(whiteListAddress)) {
				toast.error("Invalid Address provided");
			} else {
				const PaymasterContract = getPaymasterContract(chainId);
				const checkIfAdded = await PaymasterContract.check(
					user.address,
					whiteListAddress
				);
				if (checkIfAdded && !removeWhitelist) {
					toast.error("The Address has been already added to the whitelist");
					setIsLoading(false);
					return;
				}
				if (!checkIfAdded && removeWhitelist) {
					toast.error("The Address has not been added to the whitelist");
					setIsLoading(false);
					return;
				}
				const encodedData = PaymasterContract.interface.encodeFunctionData(
					removeWhitelist ? "removeFromWhitelist" : "addToWhitelist",
					[whiteListAddress]
				);
				const txHash = await window.ethereum.request({
					method: "eth_sendTransaction",
					params: [
						{
							from: user.address, // The user's active address.
							to: PaymasterContract.address, // Required except during contract publications.
							data: encodedData,
						},
					],
				});
				toast.loading(
					(t) => (
						<TransactionSentToast
							txHash={txHash}
							t={t}
							blockExplorerLink={networks[chainId].blockExplorerLink}
						/>
					),
					{
						icon: "👏",
					}
				);
			}
			setIsLoading(false);
		} catch (err) {
			console.error(err);
			toast.error("Something went wrong while submitting. Please check your injected wallet");
			setIsLoading(false);
		}
	};

	return (
		<>
			<DashBoardPage>
				<Header />
				<div className="flex flex-col">
					<Box sx={{ width: "100%" }}>
						<Box
							sx={{
								borderBottom: 1,
								borderColor: "divider",
								color: "white",
								opacity: !signedIn ? "0.5" : "1",
							}}
						>
							<Tabs
								value={value}
								onChange={handleChange}
								aria-label="Switcher"
								indicatorColor="primary"
								centered={true}
								textColor="primary"
							>
								<Tab
									centerRipple
									disabled={!signedIn}
									label="Sponsored Transactions"
									{...a11yProps(0)}
								/>
							</Tabs>
						</Box>
						{networksSupported?.length && supportedNetworks ? (
							<div className="justify-center flex mt-8">
								<Tabs
									value={chainId}
									onChange={handleChangeChainId}
									variant="scrollable"
									scrollButtons
									allowScrollButtonsMobile
									indicatorColor="none"
									textColor="primary"
									aria-label="scrollable force tabs"
									sx={[
										{
											".Mui-selected": {
												backgroundColor: "#1c1c1c",
												borderRadius: "2rem",
												color: "red",
											},
											".MuiTab-root": {
												borderRadius: "2rem",
												color: "white !important",
												marginRight: "2rem",
											},
											".MuiTabs-scrollButtons": {
												color: "white !important",
												borderRadius: "5rem",
											},
											".button.MuiTab-root": {
												minHeight: "50px !important",
											},
										},
										{ opacity: !signedIn ? "0.5" : "1" },
									]}
								>
									{networksSupported.map((network, index) => {
										return (
											<Tab
												icon={
													<img
														src={networks[network].networkImg}
														width={48}
														height={48}
														alt=""
													/>
												}
												iconPosition="start"
												label={networks[network].label}
												value={network}
												disabled={!signedIn}
												{...a11yProps(networks[network]?.label)}
												tabIndex={index}
											/>
										);
									})}
								</Tabs>
							</div>
						) : (
							<></>
						)}
						{paymasterBalance !== "0" ? (
							<div className="justify-center flex text-white mt-8 font-medium text-lg align-middle">
								Balance: {Number(paymasterBalance).toFixed(5)}{" "}
								<IconButton
									disabled={isLoading}
									aria-label="refresh"
									color="secondary"
									onClick={() => getPaymasterBalance(chainId)}
								>
									<RefreshIcon />
								</IconButton>
							</div>
						) : (
							<></>
						)}
						<CustomTabPanel value={value} index={0}>
							<div className="mt-8">
								<div className="flex flex-col justify-around items-center">
									<div className={`${!signedIn ? "opacity-75" : ""}`}>
										<div className="flex flex-col">
											<Typography color={"#5c5c5c"} className="text-md mb-2">
												Select Paymaster
											</Typography>
											<Select
												className="mt-4"
												labelId="demo-simple-select-label"
												id="demo-simple-select"
												value={selectedOption}
												label="Select Paymaster"
												defaultValue={0}
												disabled={!signedIn}
												onChange={handleOptionChange}
												sx={[
													{
														".MuiInputBase-input": {
															width: "20rem",
															padding: "1rem",
															color: "white !important",
															backgroundColor: "#1c1c1c",
														},
													},
												]}
												MenuProps={MenuProps}
											>
												<MenuItem value={0}>
													<div
														className="flex flex-row"
														style={{ padding: "1rem" }}
													>
														<img
															src={EtherspotLogo}
															alt=""
															width={24}
															height={24}
														/>
														<span className="ml-4">Etherspot</span>
													</div>
												</MenuItem>
											</Select>
										</div>
										<div className="w-full mt-4 p-2">
											<Typography color={"#5c5c5c"} className="text-md mb-2">
												Enter Amount
											</Typography>
											<TextField
												fullWidth
												style={{ marginTop: "1rem", color: "white !important" }}
												id="filled-amount-field"
												hiddenLabel
												type={"number"}
												value={amount}
												disabled={!signedIn}
												onChange={handleAmountChange}
												variant="filled"
												InputProps={{
													startAdornment: (
														<InputAdornment
															position="start"
															className="ml-2 justify-center items-center align-middle"
														>
															<img
																src={networks[chainId].networkImg}
																width={24}
																height={24}
																alt=""
															/>
														</InputAdornment>
													),
												}}
												sx={[
													{
														".MuiInputBase-input": {
															color: "white",
														},
														".MuiFormLabel-root": {
															color: "#5c5c5c",
															fontSize: "1.3rem",
														},
													},
												]}
											/>
										</div>
										<div className="justify-between flex w-full mt-8 p-2 items-center">
											<div className="text-md mb-2 contents">
												<Typography color={"#5c5c5c"}>
													Deposit/Withdraw
												</Typography>
											</div>
											<div>
												<Switch
													disabled={!signedIn}
													checked={checked}
													onChange={handleDepositChange}
													inputProps={{ "aria-label": "controlled" }}
												/>
											</div>
										</div>
										<div className="invisible"></div>
									</div>
									<button
										type="button"
										className={`${
											isLoading && "cursor-not-allowed"
										} w-96 font-medium text-sm rounded-full mt-4 px-6 py-4`}
										style={{ backgroundColor: "#2f2f2f", color: "#fff" }}
										onClick={handleSubmit}
										disabled={isLoading}
									>
										{signedIn ? buttonText : "Connect Wallet"}
									</button>
								</div>
							</div>
						</CustomTabPanel>
					</Box>
					{Number(paymasterBalance) > 0 ? (
						<Box
							sx={{
								width: "100%",
								justifyContent: "space-around",
								display: "flex",
								marginTop: "1rem",
							}}
						>
							<div className="flex flex-col mt-16 p-2">
								<div className="justify-between flex w-full mt-8 p-2 items-center">
									<div className="text-md mb-2 contents">
										<Typography color={"#5c5c5c"}>Whitelist Address</Typography>
									</div>
									<div className="flex flex-row items-center">
										<Typography color={"#5c5c5c"}>Add</Typography>
										<Switch
											disabled={!signedIn}
											checked={removeWhitelist}
											onChange={handleWhitelistSwitch}
											color="default"
											inputProps={{ "aria-label": "controlled" }}
										/>
										<Typography color={"#5c5c5c"}>Remove</Typography>
									</div>
								</div>
								<TextField
									fullWidth
									hiddenLabel={whiteListAddress !== ""}
									id="filled-basic"
									label={whiteListAddress === "" ? "Enter Address here " : ""}
									value={whiteListAddress}
									size="medium"
									onChange={handleWhitelistAddressChange}
									variant="filled"
									sx={[
										{
											".MuiInputBase-input": {
												color: "white",
												fontSize: "1rem",
											},
											".MuiFormLabel-root": {
												color: "#5c5c5c",
												fontSize: "1rem",
											},
										},
									]}
								/>
								<button
									type="button"
									className={`${
										isLoading && "cursor-not-allowed"
									} w-96 font-medium text-sm rounded-full mt-4 mb-8 px-6 py-4`}
									style={{ backgroundColor: "#2f2f2f", color: "#fff" }}
									onClick={handleWhitelistSubmit}
									disabled={isLoading}
								>
									{whitelistButtonText}
								</button>
							</div>
						</Box>
					) : (
						<></>
					)}
				</div>
			</DashBoardPage>
		</>
	);
};

export default Dashboard;
