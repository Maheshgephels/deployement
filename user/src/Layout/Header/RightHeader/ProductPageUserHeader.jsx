import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Repeat, LogIn, Mail, User } from "react-feather";
import man from "../../../assets/images/dashboard/profile.jpg";

import { LI, UL, Image, P } from "../../../AbstractElements";
import CustomizerContext from "../../../_helper/Customizer";
import { Account, Admin, Inbox, LogOut, Taskboard } from "../../../Constant";

const ProductPageUserHeader = () => {
  const history = useNavigate();
  const [profile, setProfile] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("Consoft");
  const { layoutURL } = useContext(CustomizerContext);
  const authenticated = JSON.parse(localStorage.getItem("Userauthenticated"));
  const auth0_profile = JSON.parse(localStorage.getItem("Userauth0_profile"));

  useEffect(() => {
    setProfile(localStorage.getItem("UserprofileURL") || man);
    setUsername(localStorage.getItem("Userusername") || username);
    setName(localStorage.getItem("UserName") ? localStorage.getItem("UserName") : name);
  }, []);

  const Logout = () => {
    localStorage.removeItem("UserprofileURL");
    localStorage.removeItem("Usertoken");
    localStorage.removeItem("Userauth0_profile");
    localStorage.removeItem("UserName");
    localStorage.removeItem("Userpermissions");
    localStorage.setItem("Userauthenticated", false);
    localStorage.setItem("Userlogin", false);
    history(`${process.env.PUBLIC_URL}/userlogin`);

    const storedPermissions = localStorage.getItem('Userpermissions');
    console.log("storedPermissions", storedPermissions);
  };
  console.log("username:", username);

  const UserMenuRedirect = (redirect) => {
    history(redirect);
  };

  return (
    <li className="profile-nav onhover-dropdown pe-0 py-0">
      <div className="media profile-media">
        <Image
          attrImage={{
            className: "b-r-10 m-0",
            src: authenticated && auth0_profile ? auth0_profile.picture : profile,
            // src: `${authenticated ? auth0_profile.picture : profile}`,
            alt: "",
          }}
        />
        <div className="media-body">
          {/* <span>{authenticated ? auth0_profile.name : name}</span> */}
          <span>{authenticated && auth0_profile ? auth0_profile.name : name}</span>
          <P attrPara={{ className: "mb-0 font-roboto" }}>
            {username} <i className="middle fa fa-angle-down"></i>
          </P>
        </div>
      </div>
      <UL attrUL={{ className: "simple-list profile-dropdown onhover-show-div" }}>
        {/* <LI
          attrLI={{
            onClick: () => UserMenuRedirect(`${process.env.PUBLIC_URL}/user-dashboard/${layoutURL}`),
          }}>
          <Repeat />
          <span>Switch</span>
        </LI> */}
        <LI attrLI={{ onClick: Logout }}>
          <LogIn />
          <span>{LogOut}</span>
        </LI>
      </UL>
    </li>
  );
};

export default ProductPageUserHeader;
