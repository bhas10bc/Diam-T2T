import React, { useRef, useState } from "react";
import { create } from "ipfs-http-client";
import "./Auction.css";
import * as StellarSdk from "@stellar/stellar-sdk";
import axios from "axios";
import {
  Horizon,
  Keypair,
  BASE_FEE,
  TransactionBuilder,
  Operation,
  Asset,
} from "@stellar/stellar-sdk";

const OptionChain = () => {
  const [curPage, setCurPage] = useState("my_wallet");
  const [selectedFile, setSelectedFile] = useState(null);
  const [assetCode, setAssetCode] = useState("");
  const [assetDesc, setAssetDesc] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const client = create(new URL("https://uploadipfs.diamcircle.io"));

  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    const maxSizeInBytes = 2 * 1024 * 1024;
    if (
      file &&
      (file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/gif") &&
      file.size <= maxSizeInBytes
    ) {
      setSelectedFile(event.target.files[0]);
      setPreviewImage(URL.createObjectURL(event.target.files[0]));
    } else if (file && file.size > maxSizeInBytes) {
      // imageUploadSize();
      console.log("Upload Size greater");
    } else {
      // imageUploadWarning();
      console.log("Something went wrong");
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    const maxSizeInBytes = 2 * 1024 * 1024;
    if (
      file &&
      (file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/gif") &&
      file.size <= maxSizeInBytes
    ) {
      setSelectedFile(event.dataTransfer.files[0]);
    } else if (file && file.size > maxSizeInBytes) {
      imageUploadSize();
    } else {
      imageUploadWarning();
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current.value = null;
    fileInputRef.current.click();
  };

  const createNftFun = async () => {
    try {
      const kp = StellarSdk.Keypair.fromSecret(privateKey);
      const publicKey = kp.publicKey();
      const img = await client.add(file);
      const url = `https://browseipfs.diamcircle.io/ipfs/${img.path}`;
      var data = {};
      data.assetcode = name;
      data.desc = description;
      data.image = url;
      const md = await client.add(JSON.stringify(data));
      let headersList = {
        Accept: "*/*",
        "Content-Type": "application/json",
      };
      let bodyContent = JSON.stringify({
        publicKey: publicKey,
        privateKey: privateKey,
        imageCID: md.path,
        assetCode: name,
      });
      let reqOptions = {
        url: BASE_URL + "/create-nft",
        method: "POST",
        headers: headersList,
        data: bodyContent,
      };
      let response = await axios.request(reqOptions);
      await axios.post("");
      if (response.status === 200) {
        setCreateNftModal(true);
        setNftModalResponseData(response.data);
        setTokenLink(
          `https://testnetexplorer.diamcircle.io/about-account/${response.data.issuanceAddress}`
        );
        setLoader(false);
        setPreviewImage(null);
        setSelectedFile(null);
      } else {
        errorToast();
        setLoader(false);
        setPreviewImage(null);
      }
    } catch (error) {
      errorToast();
      setErrorMsg(error.message);
      setLoader(false);
      setPreviewImage(null);
    }
  };

  const createNft = () => {
    return (
      <div className="create_nft">
        <h3>Create NFT</h3>

        <div
          className="file-input-container "
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleFileInputClick}
        >
          <input
            type="file"
            onChange={handleFileInputChange}
            onClick={handleFileInputClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{ display: "none" }}
            ref={fileInputRef}
            // disabled={aiImage}
          />
          {/* <img src={fileUpload} alt="" height="30" width="auto" /> */}
          {selectedFile ? (
            <div className="fs-7 d-flex flex-row justify-content-center">
              {" "}
              <span className="uploadText">{selectedFile?.name}</span>
            </div>
          ) : (
            <div className="uploadText">Click to upload</div>
          )}
          <div className="uploadSubText">jpeg / png / gif (max 2MB)</div>

          {/* <button onClick={() => setSelectedFile(null)}>Remove</button> */}
        </div>
        <div className="d-flex flex-column gap-1 my-2">
          <label className="input_liqudity_text">Asset Code</label>
          <input type="text" className="input_add_liqudity" />
        </div>
        <div className="d-flex flex-column gap-1 my-2">
          <label className="input_liqudity_text">Asset Description</label>
          <input type="text" className="input_add_liqudity" />
        </div>
        <button onClick={createNftFun} className="add_liqudity_btn">
          Create
        </button>
      </div>
    );
  };

  const currentSec = () => {
    if (curPage === "create_nft") return createNft();
  };

  return (
    <div className="dashboard_cont">
      <div className="topbar">D-EX</div>
      <div className="main_bar">
        <div className="main_left">
          <div
            className={`sidebar_style ${
              curPage === "my_wallet" && "selected_sec"
            }`}
            onClick={() => setCurPage("my_wallet")}
          >
            My Wallet
          </div>
          <div
            className={`sidebar_style ${
              curPage === "create_nft" && "selected_sec"
            }`}
            onClick={() => setCurPage("create_nft")}
          >
            Create NFT
          </div>
          <div
            className={`sidebar_style ${
              curPage === "add_liquidity" && "selected_sec"
            }`}
            onClick={() => setCurPage("add_liquidity")}
          >
            Add Auction
          </div>

          <div className="sidebar_style">Logout</div>
        </div>
        <div className="main_right">{currentSec()}</div>
      </div>
    </div>
  );
};

export default OptionChain;
