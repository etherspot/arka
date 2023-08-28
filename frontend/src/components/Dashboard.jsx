import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { UserAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import Header from "./Header";
import { networks } from "../utils/constant";
import { ethers } from "ethers";
import EtherspotLogo from "../assets/internal-36-etherspot@2x.png";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
// import PlusIcon from "../assets/image-icon-16-dots-n-lines-plus@2x.png";
import InputAdornment from "@mui/material/InputAdornment";
import { Switch } from "@mui/material";

const ITEM_HEIGHT = 48;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5,
      width: 250,
      backgroundColor: "#1c1c1c",
      color: "white",
      border: "none",
    },
  },
};

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      className=" flex justify-center"
    >
      {value === index && (
        <Box>
          <Typography component={'span'}>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    key: `tab-${index}`,
    "aria-controls": `tabpanel-${index}`,
  };
}

const Dashboard = ({ logInType }) => {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const { user, signIn } = UserAuth();
  const [value, setValue] = React.useState(0);
  const [chainId, setChainId] = useState("5");
  const [signedIn, setSignedIn] = useState(false);
  const [networksSupported] = useState(Object.keys(networks));
  const [isLoading, setIsLoading] = useState(false);
  const [paymasterBalance, setPaymasterBalance] = useState("0");
  // eslint-disable-next-line no-unused-vars
  const [useCustomPaymaster, setUseCustomPaymaster] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [customPaymasterAddress, setCustomPaymasterAddress] = useState();
  const [selectedOption, setSelectedOption] = useState(0);
  const [amount, setAmount] = useState(0);
  const [checked, setChecked] = useState(false);
  const [ButtonText, setButtonText] = useState("Deposit");
  const [whiteListAddress, setWhitelistAddress] = useState("");

  const getPaymasterContract = (abi, chainId) => {
    const provider = new ethers.providers.JsonRpcProvider(networks[chainId].rpcUrl, {
      name: 'Connected Bundler',
      chainId: Number(chainId),
    });
    if (useCustomPaymaster) {
      return new ethers.Contract(customPaymasterAddress, abi, provider);
    } else {
      return new ethers.Contract(
        networks[chainId].paymasterAddress,
        abi,
        provider
      );
    }
  };

  const getPaymasterBalance = async (chainId) => {
    try {
      const abi = [
        "function check(address,address) public view returns (bool)",
        "function getSponsorBalance(address) public view returns (uint256)",
      ];
      const PaymasterContract = getPaymasterContract(abi, chainId);
      const balance = await PaymasterContract.getSponsorBalance(user?.address);
      setPaymasterBalance(ethers.utils.formatEther(balance));
    } catch (err) {
      console.log(err);
      setPaymasterBalance("0");
    }
  };

  useEffect(() => {
    setIsLoading(false);
    if (user?.address) {
      setSignedIn(true);
      getPaymasterBalance(chainId);
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleAmountChange = (e) => {
    const fixed = parseFloat(e.target.value).toFixed(18).toString();
    if (fixed.length < parseFloat(e.target.value).toString().length)
      e.target.value = fixed;
    setAmount(e.target.value);
  };

  const handleDepositChange = (e) => {
    setChecked(e.target.checked);
    if (e.target.checked) setButtonText("Withdraw");
    else setButtonText("Deposit");
  };

  const handleWhitelistAddressChange = (e) => {
    setWhitelistAddress(e.target.value);
  };

  const handleChangeChainId = async (event, newValue) => {
    setIsLoading(true);
    setPaymasterBalance("0");
    setChainId(newValue);
    await getPaymasterBalance(newValue);
    setIsLoading(false);
  };

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      if (!user?.address) {
        const retUser = await signIn(logInType);
        console.log("returned Value: ", retUser);
        if (!retUser) {
          toast.error("Please make sure that metamask is installed");
        } else toast.success("Logged in Successfully");
        return;
      }
      if (amount === 0) {
        toast.error("Please enter an amount to be Deposited/Withdrawn");
      }
      const abi = [
        { "inputs": [], "name": "depositFunds", "outputs": [], "stateMutability": "payable", "type": "function" },
        { "inputs": [{ "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "withdrawFunds", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
      ];
      const PaymasterContract = getPaymasterContract(abi, chainId);
      if (checked) {
        const encodedData = PaymasterContract.interface.encodeFunctionData(
          "withdrawFunds",
          [ethers.utils.parseEther(amount.toString())]
        );
        const txHash = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: user.address, // The user's active address.
              to: PaymasterContract.address, // Required except during contract publications.
              data: encodedData,
            },
          ],
        });
        toast.success('transaction successfully submitted');
        console.log("txHash: ", txHash);
      } else {
        const encodedData = PaymasterContract.interface.encodeFunctionData(
          "depositFunds",
          []
        );
        const txHash = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: user.address, // The user's active address.
              to: PaymasterContract.address, // Required except during contract publications.
              data: encodedData,
              value: ethers.utils.parseEther(amount.toString()).toHexString(),
            },
          ],
        });
        toast.success('transaction successfully submitted');
        console.log("txHash: ", txHash);
      }
      setIsLoading(false);
    } catch (e) {
      console.log(e.message);
      setIsLoading(false);
    }
  };

  const handleWhitelistSubmit = async () => {
    try {
      setIsLoading(true);
      if (!ethers.utils.isAddress(whiteListAddress)) {
        toast.error('invalid Address provided');
      } else {
        const abi = [
          "function check(address,address) public view returns (bool)",
          "function addToWhitelist(address)",
        ];
        const PaymasterContract = getPaymasterContract(abi, chainId);
        const checkIfAdded = await PaymasterContract.check(user.address, whiteListAddress);
        if (checkIfAdded) {
          toast.error('The Address has been already added to the whitelist');
        } else {
          const encodedData = PaymasterContract.interface.encodeFunctionData(
            "addToWhitelist",
            [whiteListAddress]
          );
          const txHash = await window.ethereum.request({
            method: "eth_sendTransaction",
            params: [
              {
                from: user.address, // The user's active address.
                to: PaymasterContract.address, // Required except during contract publications.
                data: encodedData,
              },
            ],
          });
          toast.success('transaction successfully submitted');
          console.log("txHash: ", txHash);
        }
      }
      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className={"flex flex-col"}
        style={{
          background: "#131313",
          height: "100%",
        }}
      >
        <Header />
        <div className="flex flex-col">
          <Box sx={{ width: "100%" }}>
            <Box
              sx={{ borderBottom: 1, borderColor: "divider", color: "white", opacity: !signedIn ? '0.5' : '1' }}
            >
              <Tabs
                value={value}
                onChange={handleChange}
                aria-label="Switcher"
                indicatorColor="primary"
                centered={true}
                textColor="primary"
              >
                <Tab
                  centerRipple
                  disabled={!signedIn}
                  label="Sponsored Transactions"
                  {...a11yProps(0)}
                />
              </Tabs>
            </Box>
            {networksSupported?.length ? (
              <div className="justify-center flex mt-8">
                <Tabs
                  value={chainId}
                  onChange={handleChangeChainId}
                  variant="scrollable"
                  scrollButtons
                  allowScrollButtonsMobile
                  indicatorColor="none"
                  textColor="primary"
                  aria-label="scrollable force tabs example"
                  sx={[
                    {
                      ".Mui-selected": {
                        backgroundColor: "#1c1c1c",
                        borderRadius: "2rem",
                        color: "red",
                      },
                      ".MuiTab-root": {
                        borderRadius: "2rem",
                        color: "white !important",
                        marginRight: "2rem",
                      },
                      ".MuiTabs-scrollButtons": {
                        color: "white !important",
                        borderRadius: "5rem",
                      },
                      ".button.MuiTab-root": {
                        minHeight: "50px !important",
                      },
                    },
                    { opacity: !signedIn ? '0.5' : '1' }
                  ]}
                >
                  {networksSupported.map((network, index) => {
                    return (
                      <Tab
                        icon={<img src={networks[network].networkImg} alt="" />}
                        iconPosition="start"
                        label={networks[network].label}
                        value={network}
                        disabled={!signedIn}
                        {...a11yProps(networks[network]?.label)}
                        tabIndex={index}
                      />
                    );
                  })}
                </Tabs>
              </div>
            ) : (
              <></>
            )}
            {paymasterBalance !== "0" ? (
              <div className="h-4 justify-center flex text-white mt-8 font-medium text-lg">
                Balance: {Number(paymasterBalance).toFixed(5)}{" "}
              </div>
            ) : (
              <></>
            )}
            <CustomTabPanel value={value} index={0}>
              <div className="mt-8">
                <div className="flex flex-col justify-around items-center">
                  <div className={`${!signedIn ? 'opacity-75' : ''}`}>
                  <div className="flex flex-col">
                    <span className="text-md mb-2 ml-2" style={{ color: "#5c5c5c" }}>
                      Select Paymaster
                    </span>
                    <Select
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      value={selectedOption}
                      label="Select Paymaster"
                      defaultValue={0}
                      disabled={!signedIn}
                      onChange={handleOptionChange}
                      sx={[
                        {
                          ".MuiInputBase-input": {
                            width: "20rem",
                            padding: "1rem",
                            color: "white !important",
                            backgroundColor: "#1c1c1c",
                          },
                        },
                      ]}
                      MenuProps={MenuProps}
                    >
                      <MenuItem value={0}>
                        <div
                          className="flex flex-row"
                          style={{ padding: "1rem" }}
                        >
                          <img
                            src={EtherspotLogo}
                            alt=""
                            width={24}
                            height={24}
                          />
                          <span className="ml-4" style={{color:'white !important'}}>Etherspot</span>
                        </div>
                      </MenuItem>
                      {/* Need to do custom Paymaster contract address */}
                      {/* <MenuItem value={1}>
                        <div
                          className="flex flex-row"
                          style={{ padding: "1rem" }}
                        >
                          <img src={PlusIcon} alt="" width={24} height={24} />
                          <span className="ml-4">Other</span>
                        </div>
                      </MenuItem> */}
                    </Select>
                  </div>
                  <div className="w-full mt-4 p-2">
                    <span className="text-md mb-2" style={{ color: "#5c5c5c" }}>
                      Enter Amount
                    </span>
                    <TextField
                      fullWidth
                      style={{ marginTop: "1rem", color: "white !important" }}
                      id="filled-amount-field"
                      hiddenLabel
                      type={"number"}
                      value={amount}
                      disabled={!signedIn}
                      onChange={handleAmountChange}
                      variant="filled"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment
                            position="start"
                            className="ml-2 justify-center items-center align-middle"
                          >
                            <img
                              src={networks[chainId].networkImg}
                              width={24}
                              height={24}
                              alt=""
                            />
                          </InputAdornment>
                        ),
                      }}
                      sx={[
                        {
                          ".MuiInputBase-input": {
                            color: "white",
                          },
                          ".MuiFormLabel-root": {
                            color: "#5c5c5c",
                            fontSize: "1.3rem",
                          },
                        },
                      ]}
                    />
                  </div>
                  <div className="justify-between flex w-full mt-8 p-2 items-center">
                    <div>
                      <span
                        className="text-md mb-2"
                        style={{ color: "#5c5c5c" }}
                      >
                        Deposit/Withdraw
                      </span>
                    </div>
                    <div>
                      <Switch
                        disabled={!signedIn}
                        checked={checked}
                        onChange={handleDepositChange}
                        inputProps={{ "aria-label": "controlled" }}
                      />
                    </div>
                  </div>
                  <div className="invisible"></div>
                  </div>
                  <button
                    type="button"
                    className={`${
                      (isLoading) && "cursor-not-allowed"
                    } w-96 font-medium text-sm rounded-full mt-4 px-6 py-4`}
                    style={{ backgroundColor: "#2f2f2f", color: "#fff" }}
                    onClick={handleSubmit}
                    disabled={(isLoading)}
                  >
                    {signedIn ? ButtonText : "Connect Wallet"}
                  </button>
                </div>
              </div>
            </CustomTabPanel>
          </Box>
          {Number(paymasterBalance) > 0 ? (
            <Box
              sx={{
                width: "100%",
                justifyContent: "space-around",
                display: "flex",
                marginTop: "1rem",
              }}
            >
              <div className="flex flex-col mt-16 p-2">
                <span className="text-md ml-2" style={{ color: "#5c5c5c" }}>
                  Whitelist Address
                </span>
                <TextField
                  fullWidth
                  hiddenLabel={whiteListAddress !== ""}
                  style={{ marginTop: "1rem", color: "white !important" }}
                  id="filled-basic"
                  label={whiteListAddress === "" ? "Enter Address here " : ""}
                  value={whiteListAddress}
                  size="medium"
                  onChange={handleWhitelistAddressChange}
                  variant="filled"
                  sx={[
                    {
                      ".MuiInputBase-input": {
                        color: "white",
                        fontSize: "1rem"
                      },
                      ".MuiFormLabel-root": {
                        color: "#5c5c5c",
                        fontSize: "1rem",
                      },
                    },
                  ]}
                />
                {/* <div className="invisible"></div> */}
                <button
                  type="button"
                  className={`${
                    isLoading && "cursor-not-allowed"
                  } w-96 font-medium text-sm rounded-full mt-4 mb-8 px-6 py-4`}
                  style={{ backgroundColor: "#2f2f2f", color: "#fff" }}
                  onClick={handleWhitelistSubmit}
                  disabled={isLoading}
                >
                  Add to Whitelist
                </button>
              </div>
            </Box>
          ) : (
            <></>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
