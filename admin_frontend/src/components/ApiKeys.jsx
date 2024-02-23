import { useEffect, useState } from "react";
import { Buffer } from "buffer";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import toast from "react-hot-toast";
import { TextField } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import LoadingButton from "@mui/lab/LoadingButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Header from "./Header";
import AddSupportedNetworksModal from "../modals/AddSupportedNetworksModal";
import ViewSupportedNetworksModal from "../modals/ViewSupportedNetworksModal";
import defaultSupportedNetworks from "../constants/defaultNetworks";
import AddERC20PaymasterModal from "../modals/AddERC20Paymaster";
import ViewERC20PaymasterModal from "../modals/ViewERC20Paymaster";

const ApiKeysPage = () => {
	const [keys, setKeys] = useState([]);
	const [loading, setLoading] = useState(false);
	const [apiKey, setApiKey] = useState("");
	const [privateKey, setPrivateKey] = useState("");
	const [supportedNetworks, setSupportedNetworks] = useState(
		defaultSupportedNetworks
	);
	const [customErc20Paymaster, setCustomErc20Paymaster] = useState({});
	const [showPassword, setShowPassword] = useState(false);
	const [open, setOpen] = useState(false);
	const [customErc20Open, setCustomErc20Open] = useState(false);
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [viewErc20Open, setViewErc20Open] = useState(false);
	const [edit, setEdit] = useState(false);
	const [ERC20Tokens, setERC20Tokens] = useState([]);
	const handleOpen = () => {
		setSupportedNetworks(defaultSupportedNetworks);
		setOpen(true);
	};
	const handleClose = () => {
		setOpen(false);
	};

	const handleCustomErc20Open = (edit, data) => {
		setEdit(edit);
		setCustomErc20Paymaster(data);
		setCustomErc20Open(true);
	};
	const handleCustomErc20Close = () => {
		setCustomErc20Open(false);
	};
	const handleViewERC20Open = (data) => {
		setERC20Tokens(data);
		setViewErc20Open(true);
	};

	const handleViewERC20Close = () => {
		setViewErc20Open(false);
	};
	const handleViewOpen = (networks) => {
		setSupportedNetworks(networks);
		setViewModalOpen(true);
	};

	const handleViewClose = () => {
		setViewModalOpen(false);
	};

	const handleClickShowPassword = () => setShowPassword(!showPassword);

	const handleMouseDownPassword = (event) => {
		event.preventDefault();
	};

	const fetchData = async () => {
		try {
			setLoading(true);
			const data = await (
				await fetch("http://localhost:5050/getKeys", {
					method: "GET",
				})
			).json();
			console.log("data: ", data);
			data.filter((element) => {
				console.log(element.SUPPORTED_NETWORKS);
				if (element.SUPPORTED_NETWORKS) {
					const buffer = Buffer.from(element.SUPPORTED_NETWORKS, "base64");
					const SUPPORTED_NETWORKS = JSON.parse(buffer.toString());
					element.SUPPORTED_NETWORKS = SUPPORTED_NETWORKS;
				}
				if (element.ERC20_PAYMASTERS) {
					const buffer = Buffer.from(element.ERC20_PAYMASTERS, "base64");
					const ERC20_PAYMASTERS = JSON.parse(buffer.toString());
					element.ERC20_PAYMASTERS = ERC20_PAYMASTERS;
				}
			});
			setKeys(data);
			setLoading(false);
		} catch (err) {
			console.log(err);
			toast.error("Check Backend Service for more info");
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleSubmit = async () => {
		console.log(supportedNetworks);
		if (apiKey === "" || privateKey === "") {
			toast.error("Please input both API_KEY & PRIVATE_KEY field");
			return;
		}
		try {
			setLoading(true);
			console.log(customErc20Paymaster);
			let base64Erc20 = "";
			if (customErc20Paymaster != {})
				base64Erc20 = Buffer.from(
					JSON.stringify(customErc20Paymaster)
				).toString("base64");
			const requestData = {
				API_KEY: apiKey,
				PRIVATE_KEY: privateKey,
				SUPPORTED_NETWORKS:
					Buffer.from(JSON.stringify(supportedNetworks)).toString("base64") ??
					"",
				ERC20_PAYMASTERS: base64Erc20 ?? "",
			};
			console.log("requestData: ", requestData);
			const data = await (
				await fetch("http://localhost:5050/saveKey", {
					method: "POST",
					body: JSON.stringify(requestData),
				})
			).json();
			if (!data.error) {
				toast.success("Saved Successfully");
				setApiKey("");
				setPrivateKey("");
				fetchData();
			} else {
				setLoading(false);
				toast.error("Could not save");
			}
		} catch (err) {
			console.log(err);
			toast.error("Check Backend Service for more info");
			setLoading(false);
		}
	};

	const handleDelete = async (key) => {
		try {
			setLoading(true);
			const data = await (
				await fetch("http://localhost:5050/deleteKey", {
					method: "POST",
					body: JSON.stringify({ API_KEY: key }),
				})
			).json();
			if (!data.error) {
				toast.success("Deleted Successfully");
				fetchData();
			} else {
				setLoading(false);
				toast.error("Could not save");
			}
		} catch (err) {
			console.log("err: ", err);
			toast.error("Check Backend Service for more info");
			setLoading(false);
		}
	};

	return (
		<>
			<Header className="align-center" text="Arka Admin Api Keys" />
			<TableContainer>
				<Table aria-label="simple table" stickyHeader>
					<TableHead>
						<TableRow>
							<TableCell>Wallet Address</TableCell>
							<TableCell>Api Key</TableCell>
							<TableCell>Private Key</TableCell>
							<TableCell>Supported Networks</TableCell>
							<TableCell>Custom ERC20 Paymasters</TableCell>
							<TableCell>Actions Available</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						<TableRow>
							<TableCell>
								<TextField
									type="text"
									variant="outlined"
									color="secondary"
									label="WALLET_ADDRESS"
									value={"AutoFill"}
									multiline
									disabled
								/>
							</TableCell>
							<TableCell>
								<TextField
									type="text"
									variant="outlined"
									color="secondary"
									label="API_KEY"
									onChange={(e) => setApiKey(e.target.value)}
									value={apiKey}
									required
									multiline
									fullWidth
								/>
							</TableCell>
							<TableCell>
								<TextField
									id="outlined-password-input"
									label="PRIVATE_KEY"
									multiline
									value={privateKey}
									onChange={(e) => setPrivateKey(e.target.value)}
									required
									type={showPassword ? "text" : "password"}
									autoComplete="current-password"
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												<IconButton
													aria-label="toggle password visibility"
													onClick={handleClickShowPassword}
													onMouseDown={handleMouseDownPassword}
													edge="end"
												>
													{showPassword ? <VisibilityOff /> : <Visibility />}
												</IconButton>
											</InputAdornment>
										)
									}}
								/>
							</TableCell>
							<TableCell>
								<Button onClick={handleOpen}>Edit</Button>
							</TableCell>
							<TableCell>
								<Button onClick={() => handleCustomErc20Open(true, {})}>
									Edit
								</Button>
							</TableCell>
							<TableCell>
								<LoadingButton
									loading={loading}
									disabled={loading}
									loadingPosition="start"
									startIcon={<AddCircleIcon />}
									variant="contained"
									onClick={() => {
										handleSubmit();
									}}
								>
									Add Row
								</LoadingButton>
							</TableCell>
						</TableRow>
						{keys.map((row, index) => (
							<TableRow key={row.API_KEY}>
								<TableCell>{row.WALLET_ADDRESS}</TableCell>
								<TableCell>{row.API_KEY}</TableCell>
								<TableCell>
									<div className="flex flex-row">
										<div>{showPassword ? row.PRIVATE_KEY : "*****"} </div>
										<div>
											<InputAdornment position="end">
												<IconButton
													aria-label="toggle password visibility"
													onClick={handleClickShowPassword}
													onMouseDown={handleMouseDownPassword}
													edge="end"
												>
													{showPassword ? <VisibilityOff /> : <Visibility />}
												</IconButton>
											</InputAdornment>
										</div>
									</div>
								</TableCell>
								<TableCell>
									<Button
										disabled={row.SUPPORTED_NETWORKS === ""}
										onClick={() => handleViewOpen(row.SUPPORTED_NETWORKS)}
									>
										View
									</Button>
								</TableCell>
								<TableCell>
									<Button
										disabled={row.ERC20_PAYMASTERS === ""}
										onClick={() => handleViewERC20Open(row.ERC20_PAYMASTERS)}
									>
										View
									</Button>
								</TableCell>
								<TableCell>
									<LoadingButton
										loading={loading}
										disabled={loading}
										loadingPosition="start"
										startIcon={<RemoveCircleIcon />}
										variant="contained"
										onClick={() => {
											handleDelete(row.API_KEY);
										}}
									>
										Delete Row
									</LoadingButton>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
			<AddSupportedNetworksModal
				supportedNetworks={supportedNetworks}
				setSupportedNetworks={setSupportedNetworks}
				open={open}
				handleClose={handleClose}
				editMode={edit}
			/>
			<ViewERC20PaymasterModal
				supportedNetworks={ERC20Tokens}
				open={viewErc20Open}
				handleClose={handleViewERC20Close}
			/>
			<ViewSupportedNetworksModal
				supportedNetworks={supportedNetworks}
				open={viewModalOpen}
				handleClose={handleViewClose}
			/>
			<AddERC20PaymasterModal
				supportedNetworks={customErc20Paymaster}
				setSupportedNetworks={setCustomErc20Paymaster}
				open={customErc20Open}
				handleClose={handleCustomErc20Close}
			/>
		</>
	);
};

export default ApiKeysPage;
