import { useEffect, useState } from "react";
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

const ViewERC20PaymasterModal = ({ supportedNetworks, open, handleClose }) => {
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    const tempTokens = [];
    for (const key in supportedNetworks) {
      for (const sym in supportedNetworks[key]) {
        tempTokens.push({
          chainId: key,
          token: sym,
          address: supportedNetworks[key][sym],
        });
      }
    }
    setTokens(tempTokens);
  }, [supportedNetworks]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="erc20-paymasters-modal"
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
            ERC20 Paymaster Address
          </Typography>
          <Button onClick={handleClose}>Close</Button>
        </div>
        <TableContainer>
          <Table aria-label="supported-networks-table" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Chain ID</TableCell>
                <TableCell>Token</TableCell>
                <TableCell>ERC20 Paymaster Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tokens.map((element) => {
                return (
                  <TableRow
                    key={`${element.address}-${element.token}-${element.chainId}`}
                  >
                    <TableCell>{element.chainId}</TableCell>
                    <TableCell>{element.token}</TableCell>
                    <TableCell>{element.address}</TableCell>
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

export default ViewERC20PaymasterModal;
