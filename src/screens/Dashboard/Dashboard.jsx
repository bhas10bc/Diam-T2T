import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import "bootstrap/dist/css/bootstrap.min.css";
import settingsIcons from "../../assets/settingsIcon.svg";
import copyIcon from "../../assets/Copy.svg";
import errorIcon from "../../assets/errorIcon.svg";
import loaderBtn from "../../assets/loaderBtn.svg";
import warningIcon from "../../assets/warningIcon.svg";
import { Button, Dropdown, Modal } from "react-bootstrap";
import * as StellarSdk from "diamante-sdk-js";
import { Horizon } from "diamante-sdk-js";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import WalletIcon from "../../assets/WalletIcon.svg";
import DT2TIcon from "../../assets/D2TIcon.png";
import KeyIcon from "../../assets/KeyIcon.svg";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import {
  Keypair,
  BASE_FEE,
  TransactionBuilder,
  Operation,
  Asset,
  Networks,
} from "diamante-base";
import { Buffer } from "buffer";
window.Buffer = Buffer;

const Dashboard = () => {
  const [fromCurrency, setFromCurrency] = useState("");
  const [toCurrency, setToCurrency] = useState("DIAM");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [curPage, setCurPage] = useState("my_wallet");
  const [isValid, setIsValid] = useState(false);
  const [inputIssuerAddress, setInputIssuerAddress] = useState("");
  const [quoteAsset, setQuoteAsset] = useState("");
  const [liqudityAmt, setLiqudityAmt] = useState("");
  const [priceInBaseAsst, setPriceInBaseAsst] = useState("");
  const [inputTokenName, setInputTokenName] = useState("");
  const [totalToken, setTotalToken] = useState("");
  const [loader, setLoader] = useState(false);
  const [totalLiqudity, setTotalLiqudity] = useState("");
  const [remainLiqudiy, setRemainLiqudiy] = useState("");
  const [swapAssets, setSwapAssets] = useState([]);
  const [swapIssuer, setSwapIssuer] = useState("");
  const [swapIssuerTwo, setSwapIssuerTwo] = useState("");
  const [error, setError] = useState("");
  const [balance, setbalance] = useState("");
  const [assetData, setAssetData] = useState([]);
  const [logoutModal, setLogoutModal] = useState(false);
  const [receivedQuantity, setReceivedQuantity] = useState("");
  const [orderQuantity, setOrderQuantity] = useState("");
  const [selectedAssetprice, setSelectedAssetPrice] = useState("");

  const location = useLocation();
  const state = location.state;
  const publicK = state ? state.publicK : null;

  const navigateTo = useNavigate();

  const copyData = (value) => {
    navigator.clipboard.writeText(value).catch(() => {});
  };

  const copyMsg = () =>
    toast.success("Asset Isssuer copied", {
      toastId: "copy_address",
    });
  const copyMsgTwo = () =>
    toast.success("Public address copied", {
      toastId: "copy_address",
    });

  const checkPublicKey = (e) => {
    const value_ = e.target.value;
    setInputIssuerAddress(value_);
    fetchIssuer(value_);
  };

  const notify = (msg) =>
    toast.success(msg, {
      toastId: "upload_success",
    });

  const notifyError = (msg) => {
    toast.error(msg, {
      toastId: "error",
    });
  };

  const handleLogout = () => {
    navigateTo("/");
  };

  const fetchIssuer = async (issuer) => {
    await axios
      .get("https://diamtestnet.diamcircle.io/accounts/" + publicK)
      .then((res) => {
        console.log("Response", res.data.balances);
        setAssetData(res.data.balances);
        const data = res.data.balances;
        const isMatch = data.some((add) => add.asset_issuer === issuer);
        console.log("Validation", isMatch);
        setIsValid(isMatch);
        if (isMatch) {
          const matchBal = data.find((add) => add.asset_issuer === issuer);
          console.log("Match", matchBal);
          setQuoteAsset(matchBal.asset_code);
          setTotalLiqudity(matchBal.balance);
          const remain = matchBal.balance - matchBal.selling_liabilities;
          setRemainLiqudiy(remain);
        }
      })
      .catch(() => {
        notifyError("Something went wrong!!");
      });
  };

  const fetchAssetData = async () => {
    await axios
      .get("https://diamtestnet.diamcircle.io/accounts/" + publicK)
      .then((res) => {
        const data = res.data.balances;
        console.log("Assets data", data);
        setAssetData(data);
      })
      .catch(() => {
        notifyError("Something went wrong!!");
      });
  };

  const getBalance = async () => {
    let balance = null;
    try {
      const server = new Horizon.Server("https://diamtestnet.diamcircle.io/");
      const account = await server.accounts().accountId(publicK).call();
      if (
        account &&
        Array.isArray(account.balances) &&
        account.balances.length > 0
      ) {
        balance = parseFloat(
          account.balances[account.balances.length - 1].balance
        ).toFixed(3);
      }
      setbalance(balance);
    } catch (e) {
      balance = 0;
      setbalance(balance);
    }
  };
  const clearInput = () => {
    setInputTokenName("");
    setTotalToken("");
    setQuoteAsset("");
    setTotalLiqudity("");
    setInputIssuerAddress("");
    setLiqudityAmt("");
    setPriceInBaseAsst("");
    setFromValue("");
  };

  const sellingAsset = {
    code: quoteAsset,
    issuer: inputIssuerAddress,
  };

  console.log("From Val", fromValue);

  const setupLiquidityPools = async () => {
    setLoader(true);

    try {
      const server = new Horizon.Server("https://diamtestnet.diamcircle.io");
      const account = await server.loadAccount(publicK);
      const asset = new Asset(sellingAsset.code, sellingAsset.issuer);
      const swapAsset = new Asset(fromCurrency, swapIssuer);
      console.log(
        "selling:",
        asset,
        " buying:",
        swapAsset,
        " amount:",
        liqudityAmt,
        " price:",
        priceInBaseAsst
      );

      // const formattedVal = parseFloat(priceInBaseAsst);
      // const newToVal = Math.floor(formattedVal);
      // console.log("Val", newToVal, typeof newToVal);

      // console.log(
      //   "Selling:",
      //   asset,
      //   "buying:",
      //   Asset.native(),
      //   "amount:",
      //   liqudityAmt,
      //   "price:",
      //   newToVal
      // );

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: "Diamante Testnet",
      })
        .addOperation(
          Operation.manageSellOffer({
            selling: asset,
            buying: swapAsset,
            amount: liqudityAmt,
            price: priceInBaseAsst,
          })
        )
        .setTimeout(0)
        .build();
      const xdr = transaction.toXDR("base64");
      const resp = await window.diam.sign(xdr, true, "Diamante Testnet");

      console.log("Resp>>>>><<<<<<", resp);

      if (resp.response.status === 200) {
        console.log("Success");
        notify("Liqudity set successfully");
      } else {
        console.log("Error show", resp.response);
        notifyError("Something went wrong");
      }
      setLoader(false);
      setInputIssuerAddress("");
      setQuoteAsset("");
      setLiqudityAmt("");
      setPriceInBaseAsst("");
    } catch (error) {
      console.log("Error Name:", error);
      notifyError("Something went wrong");
    }
  };

  const createTrustlinesLiqudity = async (assetIssuer) => {
    setLoader(true);
    try {
      const asset = new Asset(fromCurrency, assetIssuer);
      const server = new Horizon.Server("https://diamtestnet.diamcircle.io");
      const account = await server.loadAccount(publicK);
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: "Diamante Testnet",
      });
      transaction.addOperation(Operation.changeTrust({ asset }));
      const tx = transaction.setTimeout(100).build();
      const xdr = tx.toXDR("base64");
      await window.diam.sign(xdr, true, "Diamante Testnet");
      setupLiquidityPools(asset);
      console.log("Trustlines created");
    } catch (error) {
      setError("Something went wrong");
      setLoader(false);
    }
  };

  const generateToken = async () => {
    setLoader(true);
    try {
      if (!inputTokenName || !totalToken) {
        throw new Error("inputTokenName or totalToken is not defined");
      }
      const issuerKeypair = Keypair.random();
      const response = await fetch(
        `https://friendbot.diamcircle.io/?addr=${issuerKeypair.publicKey()}`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to activate account ${issuerKeypair.publicKey()}: ${
            response.status
          }`
        );
      }
      const assets = [];
      assets.push(
        new Asset(inputTokenName.toUpperCase(), issuerKeypair.publicKey())
      );
      const server = new Horizon.Server("https://diamtestnet.diamcircle.io");
      const account = await server.loadAccount(publicK);
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: "Diamante Testnet",
      });
      for (let asset of assets) {
        transaction.addOperation(Operation.changeTrust({ asset }));
      }
      const tx = transaction.setTimeout(100).build();

      const xdr = tx.toXDR("base64");

      await window.diam.sign(xdr, true, "Diamante Testnet");

      const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
      const transaction2 = new TransactionBuilder(issuerAccount, {
        fee: BASE_FEE,
        networkPassphrase: "Diamante Testnet",
      })
        .addOperation(
          Operation.payment({
            destination: publicK,
            asset: assets[0],
            amount: totalToken,
          })
        )
        .setTimeout(100)
        .build();
      transaction2.sign(issuerKeypair);
      const res = await server.submitTransaction(transaction2);

      if (res.successful) {
        console.log("Success");
        const msg = "Token created successfully";
        notify(msg);
      } else {
        notify("Something went wrong");
      }
      setInputTokenName("");
      setTotalToken("");
      setLoader(false);
    } catch (error) {
      console.log("Error Name", error);
      notify("Something went wrong");
    }
  };

  const createTrustlines = async (assetCode, assetIssuer) => {
    setLoader(true);
    try {
      const asset = new Asset(assetCode, assetIssuer);
      const server = new Horizon.Server("https://diamtestnet.diamcircle.io");
      const account = await server.loadAccount(publicK);
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: "Diamante Testnet",
      });
      transaction.addOperation(Operation.changeTrust({ asset }));
      const tx = transaction.setTimeout(100).build();
      const xdr = tx.toXDR("base64");
      await window.diam.sign(xdr, true, "Diamante Testnet");
      executeTrade(asset);
      console.log("Trustlines created");
    } catch (error) {
      setError("Something went wrong");
      setLoader(false);
    }
  };
  console.log("To val", toValue);

  const executeTrade = async (asset) => {
    // try {
    //   const server = new Horizon.Server("https://diamtestnet.diamcircle.io");
    //   const account = await server.loadAccount(publicK);

    //   const formattedVal = parseFloat(receivedQuantity);
    //   const newToVal = formattedVal.toFixed(2);
    //   console.log("Val New", newToVal, typeof newToVal);

    //   // console.log(
    //   //   "selling:",
    //   //   Asset.native(),
    //   //   "buying:",
    //   //   asset,
    //   //   "buyamount:",
    //   //   receivedQuantity,
    //   //   "price:",
    //   //   toValue
    //   // );

    //   const transaction = new TransactionBuilder(account, {
    //     fee: BASE_FEE,
    //     networkPassphrase: "Diamante Testnet",
    //   })
    //     .addOperation(
    //       Operation.manageBuyOffer({
    //         selling: Asset.native(),
    //         buying: asset,
    //         buyAmount: newToVal,
    //         price: toValue,
    //       })
    //     )
    //     .setTimeout(100)
    //     .build();

    //   const xdr = transaction.toXDR("base64");

    //   const resp = await window.diam.sign(xdr, true, "Diamante Testnet");
    //   console.log("Done>>>", resp);
    //   if (resp.response.status === 200) {
    //     setToValue("");
    //     notify("Successfully Swap");
    //     setFromValue("");
    //     setSelectedAssetPrice("");
    //     setReceivedQuantity("");
    //     setLiqudityAmt("");
    //   } else {
    //     notifyError("Something went wrong");
    //     setTimeout(() => {
    //       setError("");
    //     }, 3000);
    //   }
    //   setLoader(false);
    // } catch (error) {
    //   console.error(
    //     "Error during trade execution:",
    //     error.response ? error.response.data : error.message
    //   );
    //   setLoader(false);
    // }

    // try {
    //   const server = new Horizon.Server("https://diamtestnet.diamcircle.io");
    //   const asset1 = new Asset(fromCurrency, swapIssuer);
    //   const asset2 = new Asset(toCurrency, swapIssuerTwo);
    //   // const asset3 = new Asset("BOOMC", issuerKeypair.publicKey());

    //   // Check order book for BOOMA/BOOMB
    //   const orderbook1 = await server.orderbook(asset1, asset2).call();
    //   console.log(orderbook1, "Order Book BOOMA -> BOOMB");

    //   // Check order book for BOOMB/BOOMC
    //   // const orderbook2 = await server.orderbook(asset2, asset3).call();
    //   // console.log(orderbook2, "Order Book BOOMB -> BOOMC");

    //   // Find the path from BOOMA to BOOMC via BOOMB
    //   const pathCallBuilder = server.strictSendPaths(asset2, "1", [asset1]);

    //   const paths = await pathCallBuilder.call();
    //   console.log(paths.records, "Found Paths");

    //   // Debugging paths if no paths found
    //   if (paths.records.length === 0) {
    //     console.log("No paths found. Trying smaller amount.");
    //     const pathCallBuilderSmallAmount = server.strictSendPaths(
    //       asset1,
    //       "0.1",
    //       [asset2]
    //     );
    //     const pathsSmallAmount = await pathCallBuilderSmallAmount.call();
    //     console.log(
    //       pathsSmallAmount.records,
    //       "Found Paths with smaller amount"
    //     );
    //   }
    // } catch (error) {
    //   console.error("Error finding paths:", error);
    // }
    const server = new Horizon.Server("https://diamtestnet.diamcircle.io");
    try {
      const asset1 = new Asset(fromCurrency, swapIssuer);
      const asset2 = new Asset(toCurrency, swapIssuerTwo);

      // Check order book for asset1/asset2
      const orderbook1 = await server.orderbook(asset1, asset2).call();
      console.log(orderbook1, "Order Book Asset1 -> Asset2");

      // Find the path from asset1 to asset2
      const pathCallBuilder = server.strictSendPaths(asset2, "1", [asset1]);
      const paths = await pathCallBuilder.call();
      console.log(paths.records, "Found Paths");

      // Debugging paths if no paths found
      if (paths.records.length === 0) {
        console.log("No paths found. Trying smaller amount.");
        const pathCallBuilderSmallAmount = server.strictSendPaths(
          asset1,
          "0.1",
          [asset2]
        );
        const pathsSmallAmount = await pathCallBuilderSmallAmount.call();
        console.log(
          pathsSmallAmount.records,
          "Found Paths with smaller amount"
        );
      } else {
        // Execute trade if path is found
        const account = await server.loadAccount(publicK);
        const buyAm = parseFloat(fromValue).toFixed(2);
        const formattedVal = parseFloat(receivedQuantity).toFixed(2);

        const transaction = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: "Diamante Testnet",
        })
          .addOperation(
            Operation.manageBuyOffer({
              selling: asset1,
              buying: asset2,
              buyAmount: buyAm,
              price: formattedVal,
            })
          )
          .setTimeout(100)
          .build();

        const xdr = transaction.toXDR("base64");
        const resp = await window.diam.sign(xdr, true, "Diamante Testnet");

        if (resp.response.status === 200) {
          setToValue("");
          notify("Successfully Swap");
          setFromValue("");
          setSelectedAssetPrice("");
          setReceivedQuantity("");
          setLiqudityAmt("");
        } else {
          notifyError("Something went wrong");
          setTimeout(() => {
            setError("");
          }, 3000);
        }
        setLoader(false);
      }
    } catch (error) {
      console.error(
        "Error finding paths or during trade execution:",
        error.response ? error.response.data : error.message
      );
      setLoader(false);
    }
  };

  const fetchSwapAssets = async () => {
    const url =
      "https://diamtestnet.diamcircle.io/assets?limit=200&order=desc&filter=asset:alphanum4";

    try {
      const response = await axios.get(url);
      const data = response.data;

      const assetsWithSellingLiabilities = data._embedded.records.filter(
        (asset) =>
          asset.asset_type === "credit_alphanum4" &&
          parseFloat(asset.balances.authorized) > 0
      );

      return assetsWithSellingLiabilities;
    } catch (error) {
      console.error("Error fetching assets:", error);
      return [];
    }
  };

  // const fetchOffer = async () => {
  //   await axios
  //     .get("https://diamtestnet.diamcircle.io/offers?order=desc")
  //     .then((res) => {
  //       const records = res.data._embedded.records;
  //       const assetRecord = records.find((record) =>
  //         console.log(record.selling.asset_code, fromCurrency)
  //       );

  //       // console.log(records, "asdasdasdasd", fromCurrency);

  //       if (assetRecord) {
  //         setReceivedQuantity(fromValue / assetRecord.price);
  //         console.log("Value", fromValue / assetRecord.price);
  //         setOrderQuantity(assetData.amount);
  //       } else {
  //         setError("Asset not found");
  //       }
  //     })
  //     .catch((e) => {
  //       console.log("Error", e);
  //     });
  // };

  const fetchOffer = async (fromCurrency, fromValue) => {
    try {
      const res = await axios.get(
        "https://diamtestnet.diamcircle.io/offers?order=desc"
      );
      console.log("Response:", res);
      console.log("FromCur", fromCurrency, "FromVal", fromValue);

      const records = res.data._embedded.records;
      const assetRecord = records.find(
        (record) => record.selling.asset_code === fromCurrency
      );

      console.log("Found Asset Record:", assetRecord);
      // setSelectedAssetPrice(assetRecord.price);
      if (assetRecord) {
        // setToValue(assetRecord.price);

        setReceivedQuantity(fromValue / assetRecord.price);
        console.log("Calculated Value:", fromValue / assetRecord.price);
        setOrderQuantity(assetRecord.amount);
      } else {
        setError("Asset not found");
      }
    } catch (e) {
      console.error("Error fetching data:", e);
      setError("Error fetching data");
    }
  };

  useEffect(() => {
    fetchSwapAssets().then((assets) => {
      console.log("Swap", assets);
      setSwapAssets(assets.reverse());
      // setFromCurrency(fromCurrency === "" && assets[0].asset_code);
      // setSwapIssuer(swapIssuer === "" && assets[0].asset_issuer);
    });
    getBalance();
  }, []);

  useEffect(() => {
    if (fromCurrency && fromValue) {
      fetchOffer(fromCurrency, fromValue);
    }
  }, [fromCurrency, fromValue]);

  const myWallet = () => {
    return (
      <div className="dashboard_main_cont">
        <div className="mb-3 d-flex flex-row align-items-center">
          <img
            src={KeyIcon}
            alt=""
            height="17px"
            width="auto"
            className="me-1"
          />
          <span className="subtText">Public Address:&nbsp;</span>
          {publicK && publicK.slice(0, 10) + "..." + publicK.slice(-10)}
          <abbr
            title="Copy"
            onClick={() => {
              copyData(publicK);
              copyMsgTwo();
            }}
            style={{ cursor: "pointer" }}
          >
            <img
              src={copyIcon}
              style={{ marginLeft: "6px" }}
              alt="Copy icon"
              height="18"
              width="auto"
            />
          </abbr>
        </div>
        <div className="d-flex flex-row align-items-center justify-content-start">
          <img
            src={WalletIcon}
            alt=""
            height="17px"
            width="auto"
            className="me-1"
          />{" "}
          <span className="subtText">Balance:&nbsp;</span>
          {balance}
        </div>
      </div>
    );
  };

  const addLiqudity = () => {
    return (
      <div className="dashboard_main_cont">
        <h4>Add Liqudity</h4>
        <div className="d-flex flex-column gap-1 my-2">
          <label className="input_liqudity_text">Issuer Address</label>
          <input
            type="text"
            value={inputIssuerAddress.replace(/[^a-zA-Z0-9]/g, "")}
            style={{
              border: "1px solid",
              borderColor:
                inputIssuerAddress.trim() === ""
                  ? "#2f2f3d"
                  : inputIssuerAddress.trim().length >= 3 && !isValid
                  ? "red"
                  : isValid
                  ? "#036f09"
                  : "#2f2f3d",
            }}
            onChange={(e) => checkPublicKey(e)}
            maxLength={56}
            className="input_add_liqudity"
          />
        </div>
        <div className="d-flex flex-column gap-1 my-2">
          <label className="input_liqudity_text">Quote Asset</label>
          <input
            type="text"
            value={quoteAsset}
            placeholder="e.g. FLSJ"
            className="input_add_liqudity"
            maxLength={6}
            readOnly
          />
        </div>
        <div className="d-flex flex-column gap-1 my-2">
          <label className="input_liqudity_text">
            Liqudity Amount{" "}
            <span className="sub_line">{` ${
              totalLiqudity && `(Total: ${Number(totalLiqudity).toFixed(2)}`
            } ${
              totalLiqudity && `Remain: ${Number(remainLiqudiy).toFixed(2)})`
            }`}</span>
          </label>
          <input
            type="number"
            placeholder="e.g. 100.00"
            value={`${
              liqudityAmt <= remainLiqudiy ? liqudityAmt : `-${liqudityAmt}`
            }`}
            onChange={(e) => {
              if (e.target.value.length <= 7) {
                setLiqudityAmt(e.target.value);
              }
            }}
            onKeyDown={(e) => {
              if (
                e.keyCode === 189 ||
                e.keyCode === 109 ||
                e.keyCode === 173 ||
                e.keyCode == 69
              ) {
                e.preventDefault();
              } else if (e.keyCode === 187 || e.keyCode === 107) {
                e.preventDefault();
              }
            }}
            className={`input_add_liqudity ${
              parseFloat(liqudityAmt) > parseFloat(remainLiqudiy) && "red_class"
            }`}
            disabled={!quoteAsset}
          />
        </div>
        <div>
          <Dropdown>
            <Dropdown.Toggle id="drop_down">
              <div className="d-flex flex-column align-items-start">
                {fromCurrency ? fromCurrency : "Select Asset"}
                <span className="sub_text">{`${
                  swapIssuer && swapIssuer.slice(0, 10)
                } ${swapIssuer && "........"} ${
                  swapIssuer && swapIssuer.slice(-10)
                }`}</span>
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu id="drop_menu">
              {swapAssets.map((asset, index) => (
                <Dropdown.Item
                  key={index}
                  id="drop_item"
                  onClick={() => {
                    setFromCurrency(asset.asset_code);
                    setSwapIssuer(asset.asset_issuer);
                    fetchOffer(asset.asset_code, fromValue);
                  }}
                >
                  <div className="d-flex flex-column">
                    {asset.asset_code}
                    <span className="sub_text">
                      {`${asset.asset_issuer.slice(
                        0,
                        15
                      )}...${asset.asset_issuer.slice(-15)}`}
                    </span>
                  </div>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
        <div className="d-flex flex-column gap-1 my-2">
          <label className="input_liqudity_text">Price in Base Asset</label>
          <input
            type="number"
            placeholder="e.g. 100.00"
            value={priceInBaseAsst}
            onChange={(e) => {
              if (e.target.value.length <= 7) {
                setPriceInBaseAsst(e.target.value);
              }
            }}
            onKeyDown={(e) => {
              if (
                e.keyCode === 189 ||
                e.keyCode === 109 ||
                e.keyCode === 173 ||
                e.keyCode == 69
              ) {
                e.preventDefault();
              } else if (e.keyCode === 187 || e.keyCode === 107) {
                e.preventDefault();
              }
            }}
            className="input_add_liqudity"
            disabled={!liqudityAmt}
          />
        </div>
        <button
          className="add_liqudity_btn"
          onClick={() => createTrustlinesLiqudity(swapIssuer)}
          disabled={(!liqudityAmt && !priceInBaseAsst) || loader}
        >
          {loader ? (
            <img src={loaderBtn} alt="" height="20" width="auto" />
          ) : (
            <>Add</>
          )}
        </button>
      </div>
    );
  };

  const swapAsset = () => {
    return (
      <div className="dashboard_main_cont">
        <div className="head_cont">
          <span className="head_text">Swap assets</span>
        </div>
        <div className="head_cont head_cont_two align-items-center ">
          <span>Current balance : {balance} DIAM</span>
        </div>
        <div className="d-flex flex-row my-3">
          <div type="text" className="from_value ">
            <span className="sub_text">From</span>
            <input
              placeholder="0.00"
              className="from_input"
              type="number"
              value={fromValue}
              onChange={(e) => {
                if (e.target.value.length <= 12) {
                  setFromValue(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (
                  e.keyCode === 189 ||
                  e.keyCode === 109 ||
                  e.keyCode === 173 ||
                  e.keyCode == 69
                ) {
                  e.preventDefault();
                } else if (e.keyCode === 187 || e.keyCode === 107) {
                  e.preventDefault();
                }
              }}
            />
          </div>
          <Dropdown>
            <Dropdown.Toggle id="drop_down">
              <div className="d-flex flex-column align-items-start">
                {fromCurrency ? fromCurrency : "Select Asset"}
                <span className="sub_text">{`${
                  swapIssuer && swapIssuer.slice(0, 10)
                } ${swapIssuer && "........"} ${
                  swapIssuer && swapIssuer.slice(-10)
                }`}</span>
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu id="drop_menu">
              {swapAssets.map((asset, index) => (
                <Dropdown.Item
                  key={index}
                  id="drop_item"
                  onClick={() => {
                    setFromCurrency(asset.asset_code);
                    setSwapIssuer(asset.asset_issuer);
                    fetchOffer(asset.asset_code, fromValue);
                  }}
                >
                  <div className="d-flex flex-column">
                    {asset.asset_code}
                    <span className="sub_text">
                      {`${asset.asset_issuer.slice(
                        0,
                        15
                      )}...${asset.asset_issuer.slice(-15)}`}
                    </span>
                  </div>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
        <div className="d-flex flex-row my-3 ">
          {/* <div type="text" className="from_value">
            <span className="sub_text">From </span>
            <input
              placeholder="0.00"
              className={`from_input ${
                Number(toValue) > balance ? "text-danger" : "text-black"
              }`}
              type="number"
              value={toValue}
              // value={
              //   Number(fromValue) > balance
              //     ? `${fromValue} Insufficient Balance`
              //     : fromValue
              // }
              onChange={(e) => {
                if (e.target.value.length <= 12) {
                  setToValue(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (
                  e.keyCode === 189 ||
                  e.keyCode === 109 ||
                  e.keyCode === 173 ||
                  e.keyCode == 69
                ) {
                  e.preventDefault();
                } else if (e.keyCode === 187 || e.keyCode === 107) {
                  e.preventDefault();
                }
              }}
            />
          </div> */}
          <Dropdown>
            <Dropdown.Toggle id="drop_down">
              <div className="d-flex flex-column align-items-start">
                {toCurrency ? toCurrency : "Select Asset"}
                <span className="sub_text">{`${
                  swapIssuerTwo && swapIssuerTwo.slice(0, 10)
                } ${swapIssuerTwo && "........"} ${
                  swapIssuerTwo && swapIssuerTwo.slice(-10)
                }`}</span>
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu id="drop_menu">
              {swapAssets.map((asset, index) => (
                <Dropdown.Item
                  key={index}
                  id="drop_item"
                  onClick={() => {
                    setToCurrency(asset.asset_code);
                    setSwapIssuerTwo(asset.asset_issuer);
                    fetchOffer(asset.asset_code, fromValue);
                  }}
                >
                  <div className="d-flex flex-column">
                    {asset.asset_code}
                    <span className="sub_text">
                      {`${asset.asset_issuer.slice(
                        0,
                        15
                      )}...${asset.asset_issuer.slice(-15)}`}
                    </span>
                  </div>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          {/* <div
            className="d-flex flex-column align-items-start px-3 justify-content-center "
            style={{
              width: "20vw",
              border: "1px solid #2f2f3d",
              backgroundColor: "#fff",
            }}
          >
            {toCurrency}
            <span className="sub_text">Native</span>
          </div> */}
        </div>
        <div className="d-flex flex-row my-3">
          <div type="text" className="from_value  balance_input">
            <span className="sub_text">You will receive</span>
            <input
              placeholder="0.00"
              className="from_input"
              type="number"
              value={receivedQuantity}
              // onChange={(e) => {
              //   if (e.target.value.length <= 12) {
              //     setFromValue(e.target.value);
              //   }
              // }}
              // onKeyDown={(e) => {
              //   if (
              //     e.keyCode === 189 ||
              //     e.keyCode === 109 ||
              //     e.keyCode === 173 ||
              //     e.keyCode == 69
              //   ) {
              //     e.preventDefault();
              //   } else if (e.keyCode === 187 || e.keyCode === 107) {
              //     e.preventDefault();
              //   }
              // }}
              readOnly
            />
          </div>
          <div type="text" className="from_value ">
            <span className="sub_text">Available Liquidity</span>
            <input
              placeholder="0.00"
              className="from_input"
              type="number"
              value={orderQuantity}
              // onChange={(e) => {
              //   if (e.target.value.length <= 12) {
              //     setFromValue(e.target.value);
              //   }
              // }}
              // onKeyDown={(e) => {
              //   if (
              //     e.keyCode === 189 ||
              //     e.keyCode === 109 ||
              //     e.keyCode === 173 ||
              //     e.keyCode == 69
              //   ) {
              //     e.preventDefault();
              //   } else if (e.keyCode === 187 || e.keyCode === 107) {
              //     e.preventDefault();
              //   }
              // }}
              readOnly
            />
          </div>
        </div>
        {/* <div style={{ height: "30px" }}>
          {error && (
            <div className="error_cont">
              <img src={errorIcon} alt="" height="20" width="auto" />
              {error}
            </div>
          )}
        </div> */}

        <button
          className="swipe_btn"
          onClick={() => createTrustlines(toCurrency, swapIssuerTwo)}
          disabled={!fromValue || loader || Number(fromValue) > balance}
        >
          {loader ? (
            <img src={loaderBtn} alt="" height="20" width="auto" />
          ) : (
            <>Swap Asset</>
          )}
        </button>
      </div>
    );
  };

  const createToken = () => {
    return (
      <div className="dashboard_main_cont">
        <h4>Create Token</h4>

        <div className="d-flex flex-column gap-1 my-2">
          <label className="input_liqudity_text">Token Name</label>
          <input
            type="text"
            value={inputTokenName.toUpperCase().replace(/[^A-Z]/g, "")}
            placeholder="e.g. FLSJ"
            className="input_add_liqudity"
            maxLength={4}
            onChange={(e) => setInputTokenName(e.target.value)}
            readOnly={loader}
          />
        </div>
        <div className="d-flex flex-column gap-1 my-2">
          <label className="input_liqudity_text">Total quanity</label>
          <input
            type="number"
            placeholder="e.g. 100.00"
            value={totalToken}
            onChange={(e) => {
              if (e.target.value.length <= 7) {
                setTotalToken(e.target.value);
              }
            }}
            onKeyDown={(e) => {
              if (
                e.keyCode === 189 ||
                e.keyCode === 109 ||
                e.keyCode === 173 ||
                e.keyCode == 69
              ) {
                e.preventDefault();
              } else if (e.keyCode === 187 || e.keyCode === 107) {
                e.preventDefault();
              }
            }}
            className="input_add_liqudity"
            readOnly={loader}
          />
        </div>

        <button
          className="add_liqudity_btn"
          onClick={generateToken}
          disabled={!inputTokenName || !totalToken || loader}
        >
          {loader ? (
            <img src={loaderBtn} alt="" height="20" width="auto" />
          ) : (
            <>Create</>
          )}
        </button>
      </div>
    );
  };

  const myAssets = () => {
    return (
      <div className="w-100 h-100 px-5 py-2 overflow-y-auto scroll_cls">
        <h4>My Assets</h4>
        <div className="w-100 d-flex flex-row flex-wrap justify-content-between ">
          {assetData.length !== 1 ? (
            assetData.slice(0, assetData.length - 1).map((asset) => {
              return (
                <div className="my_asset_info">
                  <p className="d-flex flex-row">
                    <span>Asset Name: &nbsp;</span>
                    {` ${asset.asset_code}`}
                  </p>
                  <p className="d-flex flex-row align-items-center">
                    <span>Asset Issuer:&nbsp;</span>{" "}
                    {` ${asset.asset_issuer.slice(
                      0,
                      10
                    )}....${asset.asset_issuer.slice(-10)}`}
                    <abbr
                      title="Copy"
                      onClick={() => {
                        copyData(asset.asset_issuer);
                        copyMsg();
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <img
                        src={copyIcon}
                        style={{ marginLeft: "3px" }}
                        alt="Copy icon"
                        height="13"
                        width="auto"
                      />
                    </abbr>
                  </p>
                  <p>
                    <span>Balance:&nbsp;</span>{" "}
                    {` ${Number(asset.balance).toFixed(4)}`}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="no_data">No Assets</div>
          )}
        </div>
      </div>
    );
  };

  const currentSec = () => {
    if (curPage === "my_wallet") return myWallet();
    else if (curPage === "add_liquidity") return addLiqudity();
    else if (curPage === "swap_asset") return swapAsset();
    else if (curPage === "create_token") return createToken();
    else if (curPage === "my_assets") return myAssets();
  };

  return (
    <div className="dashboard_cont">
      <div className="topbar">
        <div className="w-25">
          <div className="logo_style fs-2">DIAM-T2T</div>
        </div>
        <div className="w-75 d-flex flex-row gap-4 justify-content-end align-items-center">
          <div
            className={`topbar_menu ${
              curPage === "my_wallet" && "selected_sec"
            }`}
            onClick={() => {
              clearInput();
              setCurPage("my_wallet");
            }}
          >
            Wallet
          </div>
          <div
            className={`topbar_menu ${
              curPage === "create_token" && "selected_sec"
            }`}
            onClick={() => {
              clearInput();
              setCurPage("create_token");
            }}
          >
            Create Token
          </div>
          <div
            className={`topbar_menu ${
              curPage === "add_liquidity" && "selected_sec"
            }`}
            onClick={() => {
              clearInput();
              setCurPage("add_liquidity");
            }}
          >
            Create Token Pair
          </div>
          <div
            className={`topbar_menu ${
              curPage === "swap_asset" && "selected_sec"
            }`}
            onClick={() => {
              clearInput();
              setCurPage("swap_asset");
            }}
          >
            T2T Swap
          </div>
          <div
            className={`topbar_menu ${
              curPage === "my_assets" && "selected_sec"
            }`}
            onClick={() => {
              clearInput();
              fetchAssetData();
              setCurPage("my_assets");
            }}
          >
            My Tokens
          </div>
        </div>
      </div>
      <div className="main_bar">
        {/* <div className="main_left">
          <div
            className={`sidebar_style ${
              curPage === "my_wallet" && "selected_sec"
            }`}
            onClick={() => {
              clearInput();
              setCurPage("my_wallet");
            }}
          >
            My Wallet
          </div>
          <div
            className={`sidebar_style ${
              curPage === "create_token" && "selected_sec"
            }`}
            onClick={() => {
              clearInput();
              setCurPage("create_token");
            }}
          >
            Create Token
          </div>
          <div
            className={`sidebar_style ${
              curPage === "add_liquidity" && "selected_sec"
            }`}
            onClick={() => {
              clearInput();
              setCurPage("add_liquidity");
            }}
          >
            Add Liquidity
          </div>
          <div
            className={`sidebar_style ${
              curPage === "swap_asset" && "selected_sec"
            }`}
            onClick={() => {
              clearInput();
              setCurPage("swap_asset");
            }}
          >
            Swap Assets
          </div>
          <div
            className={`sidebar_style ${
              curPage === "my_assets" && "selected_sec"
            }`}
            onClick={() => {
              clearInput();
              fetchAssetData();
              setCurPage("my_assets");
            }}
          >
            My Assets
          </div>
          <div className="sidebar_style" onClick={() => setLogoutModal(true)}>
            Logout
          </div>
        </div> */}
        <div
          className="main_right"
          // style={{
          //   backgroundImage: `url(${bgImage})`,
          //   backgroundPosition: "center",
          //   backgroundSize: "cover",
          //   backgroundRepeat: "no-repeat",
          // }}
        >
          {currentSec()}
        </div>
      </div>
      <Modal
        show={logoutModal}
        size="md"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Body className={` modal_style `}>
          <p>Are you sure, you want to Logout?</p>
          <div className="d-flex flex-row gap-3 justify-content-center w-100">
            <button
              className="cancel_btn"
              onClick={() => setLogoutModal(false)}
            >
              Close
            </button>
            <button className="logout_btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </Modal.Body>
      </Modal>
      <ToastContainer
        position="top-right"
        autoClose={1000}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        fontSize={10}
      />
    </div>
  );
};

export default Dashboard;
