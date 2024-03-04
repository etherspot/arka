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

const defaultERC20Row = {
  chainId: 0,
  token: "",
  erc20PaymasterAddress: "",
};

const AddERC20PaymasterModal = ({
  supportedNetworks,
  setSupportedNetworks,
  open,
  handleClose,
  Edit,
}) => {
  const [ERC20Row, setERC20Row] = useState(defaultERC20Row);
  const [tokens, setTokens] = useState([]);

  const addRow = () => {
    if (
      ERC20Row.erc20PaymasterAddress === "" ||
      ERC20Row.token === "" ||
      ERC20Row.chainId === 0
    ) {
      toast.error("Please fill all textfields");
      return;
    }
    if (!utils.isAddress(ERC20Row.erc20PaymasterAddress)) {
      toast.error("Please input a valid address");
      return;
    }
    if (
      supportedNetworks == {} ||
      !supportedNetworks[ERC20Row.chainId] ||
      !supportedNetworks[ERC20Row.chainId][ERC20Row.token]
    ) {
      supportedNetworks[ERC20Row.chainId] = {
        ...supportedNetworks[ERC20Row.chainId],
        [ERC20Row.token]: ERC20Row.erc20PaymasterAddress,
      };
      setSupportedNetworks(supportedNetworks);
      setERC20Row(defaultERC20Row);
      Object.keys(supportedNetworks).map((key) => {
        Object.keys(supportedNetworks[key]).map((sym) => {
          console.log(
            tokens.find(
              (element) => element.chainId == key && element.token == sym
            )
          );
          if (
            !tokens.find(
              (element) => element.chainId == key && element.token == sym
            )
          ) {
            tokens.push({
              chainId: key,
              token: sym,
              address: supportedNetworks[key][sym],
            });
            setTokens(tokens);
          }
          return;
        });
        return;
      });
    } else {
      toast.error("Chain ID and Token already present");
    }
  };

  const deleteRow = (element) => {
    delete supportedNetworks[element.chainId][element.token];
    if (Object.keys(supportedNetworks[element.chainId]).length === 0)
      delete supportedNetworks[element.chainId];
    setSupportedNetworks(supportedNetworks);
    setTokens(
      tokens.filter(
        (token) =>
          element.chainId !== token.chainId && element.token !== token.token
      )
    );
    setERC20Row(defaultERC20Row);
  };

  useEffect(() => {
    Object.keys(supportedNetworks).map((key) => {
      Object.keys(supportedNetworks[key]).map((sym) => {
        console.log(
          tokens.find(
            (element) => element.chainId == key && element.token == sym
          )
        );
        if (
          !tokens.find(
            (element) => element.chainId == key && element.token == sym
          )
        ) {
          tokens.push({
            chainId: key,
            token: sym,
            address: supportedNetworks[key][sym],
          });
          setTokens(tokens);
        }
      });
    });
  });

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
            ERC20 Paymasters
          </Typography>
          <Button onClick={handleClose}>Save</Button>
        </div>
        <TableContainer>
          <Table aria-label="supported-networks-table" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Chain ID</TableCell>
                <TableCell>Token</TableCell>
                <TableCell>ERC20 Paymaster Address</TableCell>
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
                        setERC20Row({
                          ...ERC20Row,
                          chainId: Number(e.target.value),
                        });
                    }}
                    value={ERC20Row.chainId}
                    required
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="text"
                    variant="outlined"
                    color="secondary"
                    label="Token Symbol"
                    onChange={(e) =>
                      setERC20Row({
                        ...ERC20Row,
                        token: e.target.value,
                      })
                    }
                    value={ERC20Row.token}
                    required
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="text"
                    variant="outlined"
                    color="secondary"
                    label="ERC20 Paymaster Address"
                    onChange={(e) =>
                      setERC20Row({
                        ...ERC20Row,
                        erc20PaymasterAddress: e.target.value,
                      })
                    }
                    value={ERC20Row.erc20PaymasterAddress}
                    required
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

              {tokens.map((element, index) => {
                return (
                  <TableRow key={index}>
                    <TableCell>{element.chainId}</TableCell>
                    <TableCell>{element.token}</TableCell>
                    <TableCell>{element.address}</TableCell>
                    <TableCell>
                      <Button
                        startIcon={<RemoveCircleIcon />}
                        variant="contained"
                        onClick={() => deleteRow(element)}
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

export default AddERC20PaymasterModal;
