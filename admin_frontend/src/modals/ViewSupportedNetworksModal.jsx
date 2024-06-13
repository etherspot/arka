// components
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

const ViewSupportedNetworksModal = ({
  supportedNetworks,
  open,
  handleClose,
}) => {
  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="view-supported-networks-modal"
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
              </TableRow>
            </TableHead>
            <TableBody>
              {supportedNetworks.map((network) => {
                return (
                  <TableRow key={network.chainId}>
                    <TableCell>{network.chainId}</TableCell>
                    <TableCell>{network.bundler}</TableCell>
                    <TableCell>
                      {network.contracts.etherspotPaymasterAddress}
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

export default ViewSupportedNetworksModal;
