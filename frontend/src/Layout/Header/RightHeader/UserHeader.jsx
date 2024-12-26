import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Repeat, LogIn, Mail, User } from "react-feather";
import man from "../../../assets/images/dashboard/profile.jpg";

import { LI, UL, Image, P } from "../../../AbstractElements";
import CustomizerContext from "../../../_helper/Customizer";
import { Account, Admin, Inbox, LogOut, Taskboard } from "../../../Constant";

const UserHeader = () => {
  const history = useNavigate();
  const [profile, setProfile] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("Consoft");
  const { layoutURL } = useContext(CustomizerContext);
  const authenticated = JSON.parse(localStorage.getItem("authenticated"));
  const auth0_profile = JSON.parse(localStorage.getItem("auth0_profile"));

  useEffect(() => {
    setProfile(localStorage.getItem("profileURL") || man);
    setUsername(localStorage.getItem("username") || username);
    setName(localStorage.getItem("Name") ? localStorage.getItem("Name") : name);
  }, []);

  const Logout = () => {
    localStorage.removeItem("profileURL");
    localStorage.removeItem("token");
    localStorage.removeItem("auth0_profile");
    localStorage.removeItem("Name");
    localStorage.removeItem("permissions");
    localStorage.setItem("authenticated", false);
    localStorage.setItem("login", false);
    history(`${process.env.PUBLIC_URL}/login`);

    const storedPermissions = localStorage.getItem('permissions');
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
        <LI
          attrLI={{
            onClick: () => UserMenuRedirect(`${process.env.PUBLIC_URL}/products/${layoutURL}`),
          }}>
          <Repeat />
          <span>Switch Module</span>
        </LI>
        <LI attrLI={{ onClick: Logout }}>
          <LogIn />
          <span>{LogOut}</span>
        </LI>
      </UL>
    </li>
  );
};

export default UserHeader;
