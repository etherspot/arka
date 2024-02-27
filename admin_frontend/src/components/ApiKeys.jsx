import { useEffect, useState } from "react";
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
import OutlinedInput from "@mui/material/OutlinedInput";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Checkbox from "@mui/material/Checkbox";
import Header from "./Header";

const ApiKeysPage = () => {
	const [keys, setKeys] = useState([]);
	const [loading, setLoading] = useState(false);
	const [apiKey, setApiKey] = useState("");
	const [privateKey, setPrivateKey] = useState("");
	const [supportedNetworks, setSupportedNetworks] = useState("");
	const [customErc20Paymaster, setCustomErc20Paymaster] = useState("");
	const [txnMode, setTxnMode] = useState(0);
	const [noOfTxn, setNoOfTxn] = useState(10);
	const [showPassword, setShowPassword] = useState(false);

	const handleClickShowPassword = () => setShowPassword(!showPassword);

	const handleMouseDownPassword = (event) => {
		event.preventDefault();
	};

	const handleChange = (event) => {
		setTxnMode(event.target.checked ? 1 : 0);
	};

	const fetchData = async () => {
		try {
			setLoading(true);
			const data = await (
				await fetch("http://localhost:5050/getKeys", {
					method: "GET",
				})
			).json();
			setKeys(data);
			setLoading(false);
		} catch (err) {
			toast.error("Check Backend Service for more info");
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleSubmit = async () => {
		if (apiKey === "" || privateKey === "") {
			toast.error("Please input both API_KEY & PRIVATE_KEY field");
			return;
		}
		if (
			!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*-_&])[A-Za-z\d@$!%*-_&]{8,}$/.test(
				apiKey
			)
		) {
			toast.error(
				"Invalid Validation: API_KEY format. Please see the docs for more info"
			);
			return;
		}
		try {
			setLoading(true);
			const requestData = {
				API_KEY: apiKey,
				PRIVATE_KEY: privateKey,
				SUPPORTED_NETWORKS: supportedNetworks ?? "",
				ERC20_PAYMASTERS: customErc20Paymaster ?? "",
				TRANSACTION_LIMIT: txnMode,
				NO_OF_TRANSACTIONS_IN_A_MONTH: noOfTxn,
				INDEXER_ENDPOINT:
					process.env.REACT_APP_INDEXER_ENDPOINT ?? "http://localhost:3003",
			};
			const data = await fetch("http://localhost:5050/saveKey", {
				method: "POST",
				body: JSON.stringify(requestData),
			});
			const dataJson = await data.json();
			if (!dataJson.error) {
				toast.success("Saved Successfully");
				setApiKey("");
				setPrivateKey("");
				fetchData();
			} else {
				setLoading(false);
				toast.error("Could not save");
			}
		} catch (err) {
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
							<TableCell>Transaction Limit Mode</TableCell>
							<TableCell>No of Transactions Allowed</TableCell>
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
								<FormControl variant="outlined" required fullWidth>
									<InputLabel htmlFor="outlined-adornment-password">
										PRIVATE_KEY
									</InputLabel>
									<OutlinedInput
										id="outlined-adornment-password"
										type={showPassword ? "text" : "password"}
										endAdornment={
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
										}
										label="PRIVATE_KEY"
										multiline
										value={privateKey}
										onChange={(e) => setPrivateKey(e.target.value)}
									/>
								</FormControl>
							</TableCell>
							<TableCell>
								<TextField
									type="text"
									variant="outlined"
									color="secondary"
									label="SUPPORTED_NETWORKS"
									onChange={(e) => setSupportedNetworks(e.target.value)}
									value={supportedNetworks}
									required
									multiline
									fullWidth
								/>
							</TableCell>
							<TableCell>
								<TextField
									type="text"
									variant="outlined"
									color="secondary"
									label="ERC20_PAYMASTERS"
									onChange={(e) => setCustomErc20Paymaster(e.target.value)}
									value={customErc20Paymaster}
									required
									multiline
									fullWidth
								/>
							</TableCell>
							<TableCell>
								<Checkbox
									checked={txnMode === 0 ? false : true}
									onChange={handleChange}
									inputProps={{ "aria-label": "controlled" }}
								/>
							</TableCell>
							<TableCell>
								<TextField
									type="number"
									variant="outlined"
									color="secondary"
									label="NO_OF_TRANSACTIONS_IN_A_MONTH"
									onChange={(e) => setNoOfTxn(e.target.value)}
									value={noOfTxn}
									required
									fullWidth
								/>
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
						{keys.map((row) => (
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
								<TableCell>{row.SUPPORTED_NETWORKS}</TableCell>
								<TableCell>{row.ERC20_PAYMASTERS}</TableCell>
								<TableCell>
									{row.TRANSACTION_LIMIT === 0 ? "OFF" : "ON"}
								</TableCell>
								<TableCell>{row.NO_OF_TRANSACTIONS_IN_A_MONTH}</TableCell>
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
		</>
	);
};

export default ApiKeysPage;
