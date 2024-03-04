import { useEffect, useState } from "react";
import { utils } from "ethers";
import toast from "react-hot-toast";

// components
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
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
  address: "",
};

const DeployedPaymastersModal = ({
  supportedNetworks,
  setSupportedNetworks,
  open,
  handleClose,
  title,
}) => {
  const [supportedNetworkRow, setSupportedNetworkRow] = useState(
    defaultSupportedNetworksRow
  );
  const [addresses, setAddresses] = useState([]);

  const addRow = () => {
    const tempId = addresses;
    if (
      supportedNetworkRow.address === "" ||
      supportedNetworkRow.chainId === "" ||
      supportedNetworkRow.chainId === 0
    ) {
      toast.error("Please fill all textfields");
      return;
    }
    if (!utils.isAddress(supportedNetworkRow.address)) {
      toast.error("Please input a valid address");
      return;
    }
    if (
      !addresses.find(
        (network) =>
          network.chainId === supportedNetworkRow.chainId &&
          network.address === supportedNetworkRow.address
      )
    ) {
      const chain = supportedNetworkRow.chainId.toString();
      if (!supportedNetworks[chain]) {
        supportedNetworks[chain] = [];
      }
      supportedNetworks[chain].push(supportedNetworkRow.address);
      tempId.push({
        chainId: supportedNetworkRow.chainId,
        address: supportedNetworkRow.address,
      });
      setAddresses(tempId);
      setSupportedNetworks(supportedNetworks);
      setSupportedNetworkRow(defaultSupportedNetworksRow);
    } else {
      toast.error("Chain ID already present");
    }
  };

  const deleteRow = (network) => {
    const tempAddr = addresses.filter(
      (element) =>
        element.chainId.toString() !== network.chainId.toString() &&
        element.address !== network.address
    );
    setAddresses(tempAddr);
    supportedNetworks[network.chainId] = supportedNetworks[
      network.chainId
    ].filter((element) => element !== network.address.toString());
    setSupportedNetworks(supportedNetworks);
    setSupportedNetworkRow(defaultSupportedNetworksRow);
  };

  useEffect(() => {
    const addr = [];
    for (const chain in supportedNetworks) {
      for (const address of supportedNetworks[chain]) {
        addr.push({
          chainId: chain,
          address,
        });
      }
    }
    console.log(addr);
    setAddresses(addr);
    console.log(supportedNetworks);
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
            {title}
          </Typography>
          <Button onClick={handleClose}>Save</Button>
        </div>
        <TableContainer>
          <Table aria-label="supported-networks-table" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Chain ID</TableCell>
                <TableCell>Address</TableCell>
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
                    label="Chain ID"
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
                    label="Address"
                    onChange={(e) => {
                      setSupportedNetworkRow({
                        ...supportedNetworkRow,
                        address: e.target.value,
                      });
                    }}
                    value={supportedNetworkRow.address}
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
              {addresses.map((network, index) => {
                return (
                  <TableRow key={index}>
                    <TableCell>{network.chainId}</TableCell>
                    <TableCell>{network.address}</TableCell>
                    <TableCell>
                      <Button
                        startIcon={<RemoveCircleIcon />}
                        variant="contained"
                        onClick={() => deleteRow(network)}
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

export default DeployedPaymastersModal;
