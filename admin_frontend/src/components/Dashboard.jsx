import { useEffect, useState } from "react";
import { TextField } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import SaveIcon from "@mui/icons-material/Save";
import toast from "react-hot-toast";
import Header from "./Header";

const Dashboard = () => {
	const defaultConfig = {
		COINGECKO_API_URL:
			"",
		COINGECKO_IDS: "",
		CRON_TIME: "",
		CUSTOM_CHAINLINK_DEPLOYED:
			"",
		DEPLOYED_ERC20_PAYMASTERS:
			"",
		PYTH_MAINNET_CHAIN_IDS: "",
		PYTH_MAINNET_URL: "",
		PYTH_TESTNET_CHAIN_IDS: "",
		PYTH_TESTNET_URL:
			"",
		id: 1,
	};
	const [config, setConfig] = useState(defaultConfig);
	const [edittedConfig, setEdittedConfig] = useState(defaultConfig);
	const [disableSave, setDisableSave] = useState(true);
	const [loading, setLoading] = useState(false);

	const fetchData = async () => {
		try {
			setLoading(true);
			const data = await (
				await fetch("http://localhost:5050/getConfig", {
					method: "GET",
				})
			).json();
			console.log("data: ", data);
			setConfig(data);
			setEdittedConfig(data);
			setDisableSave(true);
			setLoading(false);
		} catch (err) {
			toast.error(
				"Make sure that backend server is running since its unreachable"
			);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleSubmit = async (edittedConfig) => {
		try {
			setLoading(true);
			console.log("edittedConfig: ", edittedConfig);
			const data = await (
				await fetch("http://localhost:5050/saveConfig", {
					method: "POST",
					body: JSON.stringify(edittedConfig),
				})
			).json();
			if (!data.error) {
				toast.success("Saved Successfully");
				fetchData();
			} else {
				toast.error("Could not save");
			}
			setLoading(false);
		} catch (err) {
			toast.error(
				"Make sure that backend server is running since its unreachable"
			);
		}
	};

	return (
		<>
    	<Header className="align-center" text="Arka Admin Config Settings"/>
			<div className="mb-8">
				<TextField
					type="text"
					variant="outlined"
					color="secondary"
					label="COINGECKO_IDS"
					onChange={(e) => {
						setEdittedConfig({
							...edittedConfig,
							COINGECKO_IDS: e.target.value,
						});
						if (disableSave && e.target.value !== config.COINGECKO_IDS)
							setDisableSave(false);
						else if (!disableSave && e.target.value === config.COINGECKO_IDS)
							setDisableSave(true);
					}}
					value={edittedConfig.COINGECKO_IDS}
					required
					fullWidth
					multiline
				/>
			</div>
			<div className="mb-8">
				<TextField
					type="text"
					variant="outlined"
					color="secondary"
					label="COINGECKO_API_URL"
					onChange={(e) => {
						setEdittedConfig({
							...edittedConfig,
							COINGECKO_API_URL: e.target.value,
						});
						if (disableSave) setDisableSave(false);
						else if (
							!disableSave &&
							e.target.value === config.COINGECKO_API_URL
						)
							setDisableSave(true);
					}}
					value={edittedConfig.COINGECKO_API_URL}
					required
					fullWidth
					multiline
				/>
			</div>
			<div className="mb-8">
				<TextField
					type="text"
					variant="outlined"
					color="secondary"
					label="CRON_TIME"
					onChange={(e) => {
						setEdittedConfig({
							...edittedConfig,
							CRON_TIME: e.target.value,
						});
						if (disableSave) setDisableSave(false);
						else if (!disableSave && e.target.value === config.CRON_TIME)
							setDisableSave(true);
					}}
					value={edittedConfig.CRON_TIME}
					required
					fullWidth
					multiline
				/>
			</div>
			<div className="mb-8">
				<TextField
					type="text"
					variant="outlined"
					color="secondary"
					label="CUSTOM_CHAINLINK_DEPLOYED"
					onChange={(e) => {
						setEdittedConfig({
							...edittedConfig,
							CUSTOM_CHAINLINK_DEPLOYED: e.target.value,
						});
						if (disableSave) setDisableSave(false);
						else if (
							!disableSave &&
							e.target.value === config.CUSTOM_CHAINLINK_DEPLOYED
						)
							setDisableSave(true);
					}}
					value={edittedConfig.CUSTOM_CHAINLINK_DEPLOYED}
					required
					fullWidth
					multiline
				/>
			</div>
			<div className="mb-8">
				<TextField
					type="text"
					variant="outlined"
					color="secondary"
					label="DEPLOYED_ERC20_PAYMASTERS"
					onChange={(e) => {
						setEdittedConfig({
							...edittedConfig,
							DEPLOYED_ERC20_PAYMASTERS: e.target.value,
						});
						if (disableSave) setDisableSave(false);
						else if (
							!disableSave &&
							e.target.value === config.DEPLOYED_ERC20_PAYMASTERS
						)
							setDisableSave(true);
					}}
					value={edittedConfig.DEPLOYED_ERC20_PAYMASTERS}
					required
					fullWidth
					multiline
				/>
			</div>
			<div className="mb-8">
				<TextField
					type="text"
					variant="outlined"
					color="secondary"
					label="PYTH_MAINNET_CHAIN_IDS"
					onChange={(e) => {
						setEdittedConfig({
							...edittedConfig,
							PYTH_MAINNET_CHAIN_IDS: e.target.value,
						});
						if (disableSave) setDisableSave(false);
						else if (
							!disableSave &&
							e.target.value === config.PYTH_MAINNET_CHAIN_IDS
						)
							setDisableSave(true);
					}}
					value={edittedConfig.PYTH_MAINNET_CHAIN_IDS}
					required
					fullWidth
					multiline
				/>
			</div>
			<div className="mb-8">
				<TextField
					type="text"
					variant="outlined"
					color="secondary"
					label="PYTH_MAINNET_URL"
					onChange={(e) => {
						setEdittedConfig({
							...edittedConfig,
							PYTH_MAINNET_URL: e.target.value,
						});
						if (disableSave) setDisableSave(false);
						else if (!disableSave && e.target.value === config.PYTH_MAINNET_URL)
							setDisableSave(true);
					}}
					value={edittedConfig.PYTH_MAINNET_URL}
					required
					fullWidth
					multiline
				/>
			</div>
			<div className="mb-8">
				<TextField
					type="text"
					variant="outlined"
					color="secondary"
					label="PYTH_TESTNET_CHAIN_IDS"
					onChange={(e) => {
						setEdittedConfig({
							...edittedConfig,
							PYTH_TESTNET_CHAIN_IDS: e.target.value,
						});
						if (disableSave) setDisableSave(false);
						else if (
							!disableSave &&
							e.target.value === config.PYTH_TESTNET_CHAIN_IDS
						)
							setDisableSave(true);
					}}
					value={edittedConfig.PYTH_TESTNET_CHAIN_IDS}
					required
					fullWidth
					multiline
				/>
			</div>
			<div className="mb-8">
				<TextField
					type="text"
					variant="outlined"
					color="secondary"
					label="PYTH_TESTNET_URL"
					onChange={(e) => {
						setEdittedConfig({
							...edittedConfig,
							PYTH_TESTNET_URL: e.target.value,
						});
						if (disableSave) setDisableSave(false);
						else if (!disableSave && e.target.value === config.PYTH_TESTNET_URL)
							setDisableSave(true);
					}}
					value={edittedConfig.PYTH_TESTNET_URL}
					required
					fullWidth
					multiline
				/>
			</div>
			<LoadingButton
				loading={loading}
				disabled={disableSave}
				loadingPosition="start"
				startIcon={<SaveIcon />}
				variant="contained"
				onClick={() => {
					handleSubmit(edittedConfig);
				}}
				fullWidth
			>
				Save
			</LoadingButton>
		</>
	);
};

export default Dashboard;
