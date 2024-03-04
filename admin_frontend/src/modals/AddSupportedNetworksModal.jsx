import { useState } from "react";
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
  chainId: 0,
  bundler: "",
  contracts: {
    etherspotPaymasterAddress: "",
  },
};

const AddSupportedNetworksModal = ({
  supportedNetworks,
  setSupportedNetworks,
  open,
  handleClose,
}) => {
  const [supportedNetworkRow, setSupportedNetworkRow] = useState(
    defaultSupportedNetworksRow
  );

  const addRow = () => {
    if (
      supportedNetworkRow.bundler === "" ||
      supportedNetworkRow.contracts.etherspotPaymasterAddress === "" ||
      supportedNetworkRow.chainId === 0
    ) {
      toast.error("Please fill all textfields");
      return;
    }
    if (
      !utils.isAddress(supportedNetworkRow.contracts.etherspotPaymasterAddress)
    ) {
      toast.error("Please input a valid address");
      return;
    }
    if (
      !supportedNetworks.find(
        (network) => network.chainId === supportedNetworkRow.chainId
      )
    ) {
      supportedNetworks.push(supportedNetworkRow);
      setSupportedNetworks(
        supportedNetworks.sort((a, b) => a.chainId - b.chainId)
      );
      setSupportedNetworkRow(defaultSupportedNetworksRow);
    } else {
      toast.error("Chain ID already present");
    }
  };

  const deleteRow = (chainId) => {
    setSupportedNetworks(
      supportedNetworks.filter((element) => element.chainId != chainId)
    );
    setSupportedNetworkRow(defaultSupportedNetworksRow);
  };

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
            Supported Networks
          </Typography>
          <Button onClick={handleClose}>Close</Button>
        </div>
        <TableContainer>
          <Table aria-label="supported-networks-table" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Chain ID</TableCell>
                <TableCell>Bundler URL</TableCell>
                <TableCell>Paymaster Address</TableCell>
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
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="text"
                    variant="outlined"
                    color="secondary"
                    label="Bundler Url"
                    onChange={(e) =>
                      setSupportedNetworkRow({
                        ...supportedNetworkRow,
                        bundler: e.target.value,
                      })
                    }
                    value={supportedNetworkRow.bundler}
                    required
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="text"
                    variant="outlined"
                    color="secondary"
                    label="Paymaster Address"
                    onChange={(e) =>
                      setSupportedNetworkRow({
                        ...supportedNetworkRow,
                        contracts: {
                          etherspotPaymasterAddress: e.target.value,
                        },
                      })
                    }
                    value={
                      supportedNetworkRow.contracts.etherspotPaymasterAddress
                    }
                    required
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <Button
                    startIcon={<AddCircleIcon />}
                    variant="contained"
                    onClick={() => addRow()}
                  >
                    Add Row
                  </Button>
                </TableCell>
              </TableRow>
              {supportedNetworks.map((network, index) => {
                return (
                  <TableRow key={network.chainId}>
                    <TableCell>{network.chainId}</TableCell>
                    <TableCell>{network.bundler}</TableCell>
                    <TableCell>
                      {network.contracts.etherspotPaymasterAddress}
                    </TableCell>
                    <TableCell>
                      <Button
                        startIcon={<RemoveCircleIcon />}
                        variant="contained"
                        onClick={() => deleteRow(network.chainId)}
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

export default AddSupportedNetworksModal;
