import React, { useEffect, useState } from "react";
import "./Topbar.css";
import { useNavigate } from "react-router-dom";

const Topbar = () => {
  const [hasShadow, setHasShadow] = useState(false);

  const handleScroll = () => {
    if (window.scrollY > 0) {
      setHasShadow(true);
    } else {
      setHasShadow(false);
    }
  };

  const navigate = useNavigate();

  const handleConnect = () => {
    if (window.diam) {
      if (window.diam && window.diam.sign) {
        window.diam.connect().then((res) => {
          console.log("Resp", res);
          if (res) {
            navigate("/dashboard", {
              state: {
                publicK: res.message[0],
              },
            });
          }
        });
      }
    } else alert("Please install DIAM wallet extension");
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className={`topbar_cont ${hasShadow ? "box-shadow" : ""}`}>
      <div className="logo_style fs-2">DIAM-T2T</div>

      <button
        className={`connect_wallet_btn ${
          hasShadow ? "connect_wallet_btn_dark" : ""
        }`}
        onClick={handleConnect}
      >
        Connect Wallet
      </button>
    </div>
  );
};

export default Topbar;
