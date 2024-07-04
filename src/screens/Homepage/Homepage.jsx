import React from "react";
import "./Homepage.css";
import Topbar from "../Topbar/Topbar";
import tokenImage from "../../assets/tokenBgImage.svg";

const Homepage = () => {
  return (
    <div>
      {/* <img src={patternOne} alt="" className="pattern_one" /> */}
      <Topbar />
      <div className="home_mainbar">
        <div className="common_style_section">
          <div className="left_sec">
            <h1 className="headline">
              A better way <br /> to swap
            </h1>
            <p className="details">
              The Swap Application enables users to exchange one type of
              cryptocurrency asset for another. This decentralized exchange
              (DEX) platform leverages Diamante's blockchain to facilitate
              secure and quick transactions.
            </p>
            {/* <button className="explore_btn">Explore more</button> */}
          </div>

          <img src={tokenImage} alt="" className="pattern_one" />
        </div>
      </div>
    </div>
  );
};

export default Homepage;
