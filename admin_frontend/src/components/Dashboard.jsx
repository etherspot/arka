import { useEffect, useState } from "react";
import { Buffer } from "buffer";

// components
import { TextField } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import { styled } from "styled-components";
import SaveIcon from "@mui/icons-material/Save";
import toast from "react-hot-toast";
import Header from "./Header";
import Button from "@mui/material/Button";

// context
import { UserAuth } from "../context/AuthContext";

// Modals
import CoingeckoIdModal from "../modals/CoingeckoId";
import DeployedPaymastersModal from "../modals/DeployedPaymasters";

// contants
import { ENDPOINTS } from "../constants/constants";

const SettingsText = styled.span`
    margin: '3px 0 4px 8px',
    font-size: '24px',
		padding-right: 5rem,
    text-align: 'center',
    color: '#cfcfcf'
  `;

const InfoTextStyle = {
  fontSize: "small",
  color: "grey",
};

const Dashboard = () => {
  const defaultConfig = {
    COINGECKO_API_URL: "",
    COINGECKO_IDS: "",
    CRON_TIME: "",
    CUSTOM_CHAINLINK_DEPLOYED: "",
    DEPLOYED_ERC20_PAYMASTERS: "",
    PYTH_MAINNET_CHAIN_IDS: "",
    PYTH_MAINNET_URL: "",
    PYTH_TESTNET_CHAIN_IDS: "",
    PYTH_TESTNET_URL: "",
    id: 1,
  };
  const [config, setConfig] = useState(defaultConfig);
  const [edittedConfig, setEdittedConfig] = useState(defaultConfig);
  const [disableSave, setDisableSave] = useState(true);
  const [loading, setLoading] = useState(false);
  const { user } = UserAuth();
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [coingeckoIds, setCoingeckoIds] = useState({});
  const [dpOpen, setDpOpen] = useState(false);
  const [deployedPaymasters, setDeployedPaymasters] = useState({});
  const [customChainlink, setCustomChainlink] = useState({});
  const [customChainlinkOpen, setCustomChainlinkOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setDpOpen(false);
    setCustomChainlinkOpen(false);
    setDisableSave(false);
  };

  const handleDpOpen = () => {
    setDpOpen(true);
  };

  const fetchData = async () => {
    if (signedIn) {
      try {
        setLoading(true);
        const data = await fetch(
          `${process.env.REACT_APP_SERVER_URL}${ENDPOINTS["getConfig"]}`,
          {
            method: "GET",
          }
        );
        const dataJson = await data.json();
        setConfig(dataJson);
        setEdittedConfig(dataJson);
        let buffer;
        if (data.COINGECKO_IDS && data.COINGECKO_IDS !== "") {
          buffer = Buffer.from(data.COINGECKO_IDS, "base64");
          const coingeckoIds = JSON.parse(buffer.toString());
          setCoingeckoIds(coingeckoIds);
        }
        if (
          data.DEPLOYED_ERC20_PAYMASTERS &&
          data.DEPLOYED_ERC20_PAYMASTERS !== ""
        ) {
          buffer = Buffer.from(data.DEPLOYED_ERC20_PAYMASTERS, "base64");
          setDeployedPaymasters(JSON.parse(buffer.toString()));
        }
        if (
          data.CUSTOM_CHAINLINK_DEPLOYED &&
          data.CUSTOM_CHAINLINK_DEPLOYED !== ""
        ) {
          buffer = Buffer.from(data.CUSTOM_CHAINLINK_DEPLOYED, "base64");
          setCustomChainlink(JSON.parse(buffer.toString()));
        }
        setDisableSave(true);
        setLoading(false);
      } catch (err) {
        if (err?.message?.includes("Failed to fetch")) {
          toast.error("Failed to access the server url");
        } else toast.error(err?.message);
      }
    }
  };

  useEffect(() => {
    setLoading(false);
    if (user?.address) {
      setSignedIn(true);
      fetchData();
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  const handleSubmit = async (edittedConfig) => {
    if (signedIn) {
      try {
        setLoading(true);
        edittedConfig.COINGECKO_IDS = Buffer.from(
          JSON.stringify(coingeckoIds)
        ).toString("base64");
        edittedConfig.DEPLOYED_ERC20_PAYMASTERS = Buffer.from(
          JSON.stringify(deployedPaymasters)
        ).toString("base64");
        edittedConfig.CUSTOM_CHAINLINK_DEPLOYED = Buffer.from(
          JSON.stringify(customChainlink)
        ).toString("base64");
        const data = await fetch(
          `${process.env.REACT_APP_SERVER_URL}${ENDPOINTS["saveConfig"]}`,
          {
            method: "POST",
            body: JSON.stringify(edittedConfig),
          }
        );
        const dataJson = data.json();
        if (!dataJson.error) {
          toast.success("Saved Successfully");
          fetchData();
        } else {
          toast.error(`${dataJson.message} Please try again or contant Arka support team`);
        }
        setLoading(false);
      } catch (err) {
        if (err?.message?.includes("Failed to fetch")) {
          toast.error("Failed to access the server url");
        } else toast.error(err?.message);
      }
    } else {
      toast.error("Please login to edit and save changes");
    }
  };

  return (
    <>
      <Header
        className="align-center"
        text="Arka Admin Global Config Settings"
      />
      <div className="mb-1">
        <SettingsText>COINGECKO_IDS</SettingsText>
        <Button
          sx={{ marginLeft: "3rem" }}
          disabled={loading || !signedIn}
          onClick={handleOpen}
        >
          Edit
        </Button>
      </div>
      <div className="mb-8">
        <span style={InfoTextStyle}>
          COINGECKO_IDS are for Deployed paymasters with custom chainlink
          oracles. Can be left blank if you dont use custom erc20 paymasters
          deployed
        </span>
      </div>
      <div className="mb-1">
        <TextField
          type="text"
          variant="outlined"
          color="secondary"
          disabled={!signedIn}
          label="COINGECKO_API_URL"
          onChange={(e) => {
            setEdittedConfig({
              ...edittedConfig,
              COINGECKO_API_URL: e.target.value,
            });
            if (disableSave) setDisableSave(false);
            else if (
              !disableSave &&
              e.target.value === config.COINGECKO_API_URL
            )
              setDisableSave(true);
          }}
          value={edittedConfig.COINGECKO_API_URL}
          required
          fullWidth
          multiline
        />
      </div>
      <div className="mb-8">
        <span style={InfoTextStyle}>
          COINGECKO_API_URL is the url for requesting price feeds for CRON-JOB
        </span>
      </div>
      <div className="mb-1">
        <TextField
          type="text"
          variant="outlined"
          color="secondary"
          disabled={!signedIn}
          label="CRON_TIME"
          onChange={(e) => {
            setEdittedConfig({
              ...edittedConfig,
              CRON_TIME: e.target.value,
            });
            if (disableSave) setDisableSave(false);
            else if (!disableSave && e.target.value === config.CRON_TIME)
              setDisableSave(true);
          }}
          value={edittedConfig.CRON_TIME}
          required
          fullWidth
        />
      </div>
      <div className="mb-8">
        <span style={InfoTextStyle}>
          CRON TIME requires exact cron time format as a string
        </span>
      </div>
      <div className="mb-1">
        <SettingsText>Custom Chainlink for CRONJOB</SettingsText>
        <Button
          sx={{ marginLeft: "3rem" }}
          disabled={loading || !signedIn}
          onClick={() => setCustomChainlinkOpen(true)}
        >
          Edit
        </Button>
      </div>
      <div className="mb-8">
        <span style={InfoTextStyle}>
          Custom deployments of erc20 paymaster supported by chainlink oracles
          tokens to update the oracle price manually in the above specified cron
          time
        </span>
      </div>
      <div className="mb-1">
        <SettingsText>Deployed Paymasters for CRONJOB</SettingsText>
        <Button
          sx={{ marginLeft: "3rem" }}
          disabled={loading || !signedIn}
          onClick={handleDpOpen}
        >
          Edit
        </Button>
      </div>
      <div className="mb-8">
        <span style={InfoTextStyle}>
          Custom deployed erc20 paymasters to update the price feed on the
          paymaster
        </span>
      </div>
      <div className="mb-1">
        <TextField
          type="text"
          disabled={!signedIn}
          variant="outlined"
          color="secondary"
          label="PYTH_MAINNET_CHAIN_IDS"
          onChange={(e) => {
            setEdittedConfig({
              ...edittedConfig,
              PYTH_MAINNET_CHAIN_IDS: e.target.value,
            });
            if (disableSave) setDisableSave(false);
            else if (
              !disableSave &&
              e.target.value === config.PYTH_MAINNET_CHAIN_IDS
            )
              setDisableSave(true);
          }}
          value={edittedConfig.PYTH_MAINNET_CHAIN_IDS}
          required
          fullWidth
          multiline
        />
      </div>
      <div className="mb-8">
        <span style={InfoTextStyle}>
          PYTH mainnet chainIds. Can be left blank if you do not tend to use
          PYTH oracle
        </span>
      </div>
      <div className="mb-1">
        <TextField
          type="text"
          variant="outlined"
          disabled={!signedIn}
          color="secondary"
          label="PYTH_MAINNET_URL"
          onChange={(e) => {
            setEdittedConfig({
              ...edittedConfig,
              PYTH_MAINNET_URL: e.target.value,
            });
            if (disableSave) setDisableSave(false);
            else if (!disableSave && e.target.value === config.PYTH_MAINNET_URL)
              setDisableSave(true);
          }}
          value={edittedConfig.PYTH_MAINNET_URL}
          required
          fullWidth
          multiline
        />
      </div>
      <div className="mb-8">
        <span style={InfoTextStyle}>
          PYTH mainnet price feed URL. Can be left blank if you do not tend to
          use PYTH oracle
        </span>
      </div>
      <div className="mb-1">
        <TextField
          type="text"
          variant="outlined"
          color="secondary"
          disabled={!signedIn}
          label="PYTH_TESTNET_CHAIN_IDS"
          onChange={(e) => {
            setEdittedConfig({
              ...edittedConfig,
              PYTH_TESTNET_CHAIN_IDS: e.target.value,
            });
            if (disableSave) setDisableSave(false);
            else if (
              !disableSave &&
              e.target.value === config.PYTH_TESTNET_CHAIN_IDS
            )
              setDisableSave(true);
          }}
          value={edittedConfig.PYTH_TESTNET_CHAIN_IDS}
          required
          fullWidth
          multiline
        />
      </div>
      <div className="mb-8">
        <span style={InfoTextStyle}>
          PYTH testnet chainIds. Can be left blank if you do not tend to use
          PYTH oracle
        </span>
      </div>
      <div className="mb-1">
        <TextField
          type="text"
          variant="outlined"
          color="secondary"
          disabled={!signedIn}
          label="PYTH_TESTNET_URL"
          onChange={(e) => {
            setEdittedConfig({
              ...edittedConfig,
              PYTH_TESTNET_URL: e.target.value,
            });
            if (disableSave) setDisableSave(false);
            else if (!disableSave && e.target.value === config.PYTH_TESTNET_URL)
              setDisableSave(true);
          }}
          value={edittedConfig.PYTH_TESTNET_URL}
          required
          fullWidth
          multiline
        />
      </div>
      <div className="mb-8">
        <span style={InfoTextStyle}>
          PYTH testnet price feed URL. Can be left blank if you do not tend to
          use PYTH oracle
        </span>
      </div>
      <LoadingButton
        loading={loading}
        disabled={disableSave || !signedIn}
        loadingPosition="start"
        startIcon={<SaveIcon />}
        variant="contained"
        onClick={() => {
          handleSubmit(edittedConfig);
        }}
        fullWidth
      >
        Save
      </LoadingButton>
      <CoingeckoIdModal
        supportedNetworks={coingeckoIds}
        setSupportedNetworks={setCoingeckoIds}
        open={open}
        handleClose={handleClose}
      />
      <DeployedPaymastersModal
        supportedNetworks={deployedPaymasters}
        setSupportedNetworks={setDeployedPaymasters}
        open={dpOpen}
        handleClose={handleClose}
        title={"CoinGecko IDs"}
      />
      <DeployedPaymastersModal
        supportedNetworks={customChainlink}
        setSupportedNetworks={setCustomChainlink}
        open={customChainlinkOpen}
        handleClose={handleClose}
        title={"Custom Chainlink Paymaster Deployments"}
      />
    </>
  );
};

export default Dashboard;
