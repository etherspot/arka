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
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";

const style = {
	width: "100%",
	bgcolor: "background.paper",
	border: "2px solid #000",
	boxShadow: 24,
	p: 2,
	flexDirection: "column",
	overflowX: "scroll",
};

const defaultSupportedNetworksRow = {
	chainId: "",
	coingeckoId: "",
};

const CoingeckoIdModal = ({
	supportedNetworks,
	setSupportedNetworks,
	open,
	handleClose,
}) => {
	const [supportedNetworkRow, setSupportedNetworkRow] = useState(
		defaultSupportedNetworksRow
	);
	const [ids, setIds] = useState([]);

	const addRow = () => {
		const tempId = ids;
		if (
			supportedNetworkRow.coingeckoId === "" ||
			supportedNetworkRow.chainId === "" ||
			supportedNetworkRow.chainId === 0
		) {
			toast.error("Please fill all textfields");
			return;
		}
		if (
			!ids.find(
				(network) =>
					network.chainId === supportedNetworkRow.chainId &&
					network.coingeckoId === supportedNetworkRow.coingeckoId
			)
		) {
			if (!supportedNetworks[supportedNetworkRow.chainId.toString()])
				supportedNetworks[supportedNetworkRow.chainId.toString()] = [
					supportedNetworkRow.coingeckoId,
				];
			else {
				supportedNetworks[supportedNetworkRow.chainId.toString()].push(
					supportedNetworkRow.coingeckoId
				);
			}
			tempId.push({
				chainId: supportedNetworkRow.chainId,
				coingeckoId: supportedNetworkRow.coingeckoId,
			});
			setIds(tempId);
			setSupportedNetworks(supportedNetworks);
			setSupportedNetworkRow(defaultSupportedNetworksRow);
			console.log("ids: ", ids, supportedNetworks);
		} else {
			toast.error("ChainId Already present");
		}
	};

	const deleteRow = (network) => {
		setIds(
			ids.filter(
				(element) =>
					element.chainId !== network.chainId &&
					element.coingeckoId !== network.coingeckoId
			)
		);
		setSupportedNetworks(
			supportedNetworks[network.chainId.toString()].filter(
				(element) => element !== network.coingeckoId
			)
		);
		setSupportedNetworkRow(defaultSupportedNetworksRow);
	};

	useEffect(() => {
		const coingeckoIds = [];
		for (const chain in supportedNetworks) {
			for (const id of supportedNetworks[chain]) {
				coingeckoIds.push({
					chainId: chain,
					coingeckoId: id,
				});
			}
		}
		setIds(coingeckoIds);
		console.log(coingeckoIds);
	}, [supportedNetworks]);

	return (
		<Modal
			open={open}
			onClose={handleClose}
			aria-labelledby="supported-networks-modal"
			sx={{ overflowX: "scroll" }}
		>
			<Box sx={style}>
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						justifyContent: "space-between",
					}}
				>
					<Typography id="modal-modal-title" variant="h6" component="h2">
						CoinGecko IDs
					</Typography>
					<Button onClick={handleClose}>Save</Button>
				</div>
				<TableContainer>
					<Table aria-label="supported-networks-table" stickyHeader>
						<TableHead>
							<TableRow>
								<TableCell>ChainId</TableCell>
								<TableCell>Ids</TableCell>
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
										label="ChainId"
										onChange={(e) => {
											if (!isNaN(e.target.value))
												setSupportedNetworkRow({
													...supportedNetworkRow,
													chainId: Number(e.target.value),
												});
										}}
										value={supportedNetworkRow.chainId}
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
										label="Coingecko ID"
										onChange={(e) => {
											setSupportedNetworkRow({
												...supportedNetworkRow,
												coingeckoId: e.target.value,
											});
										}}
										value={supportedNetworkRow.coingeckoId}
										required
										multiline
										fullWidth
									/>
								</TableCell>
								<TableCell>
									<Button
										startIcon={<AddCircleIcon />}
										variant="contained"
										onClick={addRow}
									>
										Add Row
									</Button>
								</TableCell>
							</TableRow>
							{ids.map((network, index) => {
								return (
									<TableRow key={index}>
										<TableCell>{network.chainId}</TableCell>
										<TableCell>{network.coingeckoId}</TableCell>
										<TableCell>
											<Button
												startIcon={<RemoveCircleIcon />}
												variant="contained"
												onClick={() => {deleteRow(network)}}
											>
												Delete Row
											</Button>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
			</Box>
		</Modal>
	);
};

export default CoingeckoIdModal;
