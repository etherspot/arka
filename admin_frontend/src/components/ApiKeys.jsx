import { useEffect, useState } from "react";
import { Buffer } from "buffer";
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
import LoadingButton from "@mui/lab/LoadingButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";

import Header from "./Header";

//Modals
import AddSupportedNetworksModal from "../modals/AddSupportedNetworksModal";
import ViewSupportedNetworksModal from "../modals/ViewSupportedNetworksModal";
import AddERC20PaymasterModal from "../modals/AddERC20Paymaster";
import ViewERC20PaymasterModal from "../modals/ViewERC20Paymaster";

//constants
import defaultSupportedNetworks from "../constants/defaultNetworks";
import { ENDPOINTS } from "../constants/constants";

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
      const data = await fetch(
        `${process.env.REACT_APP_SERVER_URL}${ENDPOINTS["getKeys"]}`,
        {
          method: "GET",
        }
      );
      const dataJson = await data.json();
      dataJson.filter((element) => {
        if (element.supportedNetworks) {
          const buffer = Buffer.from(element.supportedNetworks, "base64");
          const parsedSupportedNetowrks = JSON.parse(buffer.toString());
          element.supportedNetworks = parsedSupportedNetowrks;
        }
        if (element.erc20Paymasters) {
          const buffer = Buffer.from(element.erc20Paymasters, "base64");
          const parsedErc20Paymasters = JSON.parse(buffer.toString());
          element.erc20Paymasters = parsedErc20Paymasters;
        }
        return element;
      });
      setKeys(dataJson);
      setLoading(false);
    } catch (err) {
      if (err?.message?.includes("Failed to fetch")) {
        toast.error("There was a problem communicating with the server. Please try again, or contact Arka support team.");
      } else toast.error(err?.message);
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
    try {
      setLoading(true);
      let base64Erc20 = "";
      if (customErc20Paymaster != {})
        base64Erc20 = Buffer.from(
          JSON.stringify(customErc20Paymaster)
        ).toString("base64");
      const requestData = {
        apiKey: apiKey,
        privateKey: privateKey,
        supportedNetworks:
          Buffer.from(JSON.stringify(supportedNetworks)).toString("base64") ??
          "",
          erc20Paymasters: base64Erc20 ?? "",
      };
      const data = await fetch(
        `${process.env.REACT_APP_SERVER_URL}${ENDPOINTS["saveKey"]}`,
        {
          method: "POST",
          body: JSON.stringify(requestData),
        }
      );
      const dataJson = await data.json();
      if (!dataJson.error) {
        toast.success("Saved Successfully");
        setApiKey("");
        setPrivateKey("");
        fetchData();
      } else {
        setLoading(false);
        toast.error(`${dataJson.error} Please try again or contant Arka support team`);
      }
    } catch (err) {
      if (err?.message?.includes("Failed to fetch")) {
        toast.error("There was a problem communicating with the server. Please try again, or contact Arka support team.");
      } else toast.error(err?.message);
      setLoading(false);
    }
  };

  const handleDelete = async (key) => {
    try {
      setLoading(true);
      const data = await fetch(
        `${process.env.REACT_APP_SERVER_URL}${ENDPOINTS["deleteKey"]}`,
        {
          method: "POST",
          body: JSON.stringify({ apiKey: key }),
        }
      );
      const dataJson = data.json();
      if (!dataJson.error) {
        toast.success("Deleted Successfully");
        fetchData();
      } else {
        setLoading(false);
        toast.error(`${dataJson.message} Please try again or contant Arka support team`);
      }
    } catch (err) {
      if (err?.message?.includes("Failed to fetch")) {
        toast.error("There was a problem communicating with the server. Please try again, or contact Arka support team.");
      } else toast.error(err?.message);
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
                  label="WALLET ADDRESS"
                  value={"AutoFill"}
                  disabled
                />
              </TableCell>
              <TableCell>
                <TextField
                  type="text"
                  variant="outlined"
                  color="secondary"
                  label="API KEY"
                  onChange={(e) => setApiKey(e.target.value)}
                  value={apiKey}
                  required
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  id="outlined-password-input"
                  label="PRIVATE KEY"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  required
                  type={showPassword ? "text" : "password"}
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
                    ),
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
              <TableRow key={row.apiKey}>
                <TableCell>{row.walletAddress}</TableCell>
                <TableCell>{row.apiKey}</TableCell>
                <TableCell>
                  <div className="flex flex-row">
                    <div>{showPassword ? row.privateKey : "*****"} </div>
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
                    disabled={row.supportedNetworks === ""}
                    onClick={() => handleViewOpen(row.supportedNetworks)}
                  >
                    View
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    disabled={row.erc20Paymasters === ""}
                    onClick={() => handleViewERC20Open(row.erc20Paymasters)}
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
                      handleDelete(row.apiKey);
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
