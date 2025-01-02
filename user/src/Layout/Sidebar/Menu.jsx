import { CiSettings } from "react-icons/ci";

export const MENUITEMS = [
  {
    menutitle: "User Panel",
    menucontent: "Registration Admin",
    Items: [
      {
        title: "Dashboard",
        icon: "home",
        type: "link",
        active: true,
        path: `${process.env.PUBLIC_URL}/user-dashboard`,
        permission: "Dashboard",
      },
      // {
      //   title: "Edit Basic Detail",
      //   icon: "home",
      //   type: "link",
      //   active: false,
      //   path: `${process.env.PUBLIC_URL}/user-dashboard`,
      //   permission: "Dashboard",
      // },
      {
        title: "Register For Conference",
        icon: "home",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/conference-register`,
        permission: "AddRegUser",
      },
      {
        title: "Payment Recipet",
        icon: "home",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/payment-receipt`,
        permission: "Payment Recipet",
      },
      {
        title: "Change Package",
        icon: "home",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/user-dashboard`,
        permission: "Change Package",
      },
      {
        title: "Certificate",
        icon: "home",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/download-certificate`,
        permission: "Certificate",
      },
      {
        title: "Feedback",
        icon: "home",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/submit-feedback`,
        permission: "Feedback",
      },
      
    ],
  },
];
