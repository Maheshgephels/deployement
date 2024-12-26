import { CiSettings } from "react-icons/ci";

export const MENUITEMS = [
  // {
  //   menucontent: "Dashboards,Widgets",
  //   Items: [
  //     {
  //       title: "Dashboard",
  //       icon: "home",
  //       type: "link",
  //       active: false,
  //       path: `${process.env.PUBLIC_URL}/dashboard/default`,
  //       permission: "Dashboard",
  //     },
  //   ],
  // }, 
  {
    menutitle: "Registration Admin",
    menucontent: "Registration Admin",
    Items: [
      {
        title: "Dashboard",
        icon: "home",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/registration/dashboard`,
        permission: "Dashboard",
      },
      {
        title: "Manage Reg Form",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/registration/manage-fields`,
        permission: "RegFields"
      },
      {
        title: "Manage Basic User",
        icon: "user",
        type: "sub",
        children: [
          {
            title: "Create Basic User",
            path: `${process.env.PUBLIC_URL}/registration/basic-user`,
            type: "link",
            permission: "AddBasicUser"
          },
          {
            title: "Basic User Listing",
            path: `${process.env.PUBLIC_URL}/registration/basic-user-listing`,
            type: "link",
            permission: "BasicUserListing"
          },
        ],
      },
      {
        title: "Manage User",
        icon: "user",
        type: "sub",
        children: [
          {
            title: "Create User",
            path: `${process.env.PUBLIC_URL}/registration/confirm-user`,
            type: "link",
            permission: "AddRegUser"
          },
          {
            title: "Confirm User Listing",
            path: `${process.env.PUBLIC_URL}/registration/confirm-user-listing`,
            type: "link",
            permission: "ConfirmUserListing"
          },
          {
            title: "Temp User Listing",
            path: `${process.env.PUBLIC_URL}/registration/temp-user-listing`,
            type: "link",
            permission: "TempUserListing"
          },
          {
            title: "Non Confirm User Listing",
            path: `${process.env.PUBLIC_URL}/registration/non-confirm-user-listing`,
            type: "link",
            permission: "NonConfirmUserListing"
          },
          {
            title: "Discarded Temp User Listing",
            path: `${process.env.PUBLIC_URL}/registration/discarded-temp-user-listing`,
            type: "link",
            permission: "DiscardedUser"
          }
        ],
      },
      {
        title: "Import",
        icon: "user",
        type: "sub",
        children: [
          {
            title: "Basic User",
            path: `${process.env.PUBLIC_URL}/registration/import-basic-user`,
            type: "link",
            permission: "ImportBasicRegUser"
          },
          {
            title: "With Reg No",
            path: `${process.env.PUBLIC_URL}/registration/import-confirm-withreg-user`,
            type: "link",
            permission: "ImportConfirmRegUser"
          },
          {
            title: "Without Reg No",
            path: `${process.env.PUBLIC_URL}/registration/import-confirm-withoutreg-user`,
            type: "link",
            permission: "ImportConfirmRegUserwithoutregno"
          },
          {
            title: "Faculty",
            path: `${process.env.PUBLIC_URL}/registration/import-faculty-user`,
            type: "link",
            permission: "ImportRegFaculty"
          },
        ],
      },
      {
        title: "Payment Setup",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/registration/payment-setup`,
        permission: "PaymentSetup"
      },
      {
        title: "Manage tickets",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/registration/manage-tickets`,
        permission: "Managetickets"
      },
      {
        title: "Manage addons",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/registration/manage-addon`,
        permission: "Manageaddon"
      },
      {
        title: "Manage discounts",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/registration/manage-discount`,
        permission: "Managediscount"
      },
      {
        title: "Manage Faculty",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/registration/manage-faculty`,
        permission: "ManageRegFaculty"
      },
      {
        title: "Manage Exhibitor",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/registration/manage-exhibitor`,
        permission: "ManageRegExhibitor"
      },
      {
        title: "Manage Category",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/registration/manage-reg-category`,
        permission: "RegCategory"
      },
      {
        title: "Manage Workshop Type",
        path: `${process.env.PUBLIC_URL}/registration/manage-reg-workshoptype`,
        icon: "user",
        type: "link",
        active: false,
        permission: "RegWorkshoptype"
      },
    
      {
        title: "Manage Workshop",
        path: `${process.env.PUBLIC_URL}/registration/manage-reg-workshop`,
        icon: "user",
        type: "link",
        active: false,
        permission: "RegWorkshop"
      },
      {
        title: "Manage Payment",
        path: `${process.env.PUBLIC_URL}/registration/manage-payment`,
        icon: "user",
        type: "link",
        active: false,
        permission: "ManagePayment"
      },
      {
        title: "Report",
        icon: "user",
        type: "sub",
        children: [
          {
            title: "User Report",
            path: `${process.env.PUBLIC_URL}/registration/all-user-report`,
            type: "link",
            permission: "AllUserReport"
          },
          {
            title: "Payment Report",
            path: `${process.env.PUBLIC_URL}/registration/payment-report`,
            type: "link",
            permission: "PaymentReport"
          },
        ],
      },
      {
        title: "Email",
        icon: "email",
        type: "sub",
        children: [
          {
            title: "Promotional Email",
            type: "link",
            path: `${process.env.PUBLIC_URL}/registration/reg-bulk-email`,
            permission: "RegBulkEmail"
          },
          // {
          //   title: "Badge Email",
          //   type: "link",
          //   path: `${process.env.PUBLIC_URL}/onsite/bulk-badge-email`,
          //   permission: "Badge Email"
          // },

        ],
      },
      {
        title: "Registration Setting",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/registration/reg-setting`,
        permission: "RegAdminSetting"
      },
    ],
  },
  {
    menutitle: "Event App Admin",
    menucontent: "Event App Admin",
    Items: [

      {
        title: "Dashboard",
        icon: "home",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/event/dashboard`,
        permission: "EventDashboard",
      },
      {
        title: "Manage User",
        icon: "user",
        type: "sub",
        children: [
          {
            title: "Create User",
            path: `${process.env.PUBLIC_URL}/event/add-event-user`,
            type: "link",
            permission: "AddEventUser"
          },
          {
            title: "User Listing",
            path: `${process.env.PUBLIC_URL}/event/manage-user`,
            type: "link",
            permission: "ManageUser"
          },
        ],
      },
      {
        title: "Manage Faculty",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/event/manage-faculty`,
        permission: "ManageFaculty"
      },
      {
        title: "Import",
        icon: "user",
        type: "sub",
        children: [
          {
            title: "Basic User",
            path: `${process.env.PUBLIC_URL}/event/import-event-user`,
            type: "link",
            permission: "ImportEventUser"
          },
          {
            title: "With Reg No",
            path: `${process.env.PUBLIC_URL}/event/import-confirm-user`,
            type: "link",
            permission: "ImportConfirmUserwithregno"
          },
          {
            title: "Without Reg No",
            path: `${process.env.PUBLIC_URL}/event/import-confirm-user-without`,
            type: "link",
            permission: "ImportConfirmUserwithoutregno"
          },
          {
            title: "Faculty",
            path: `${process.env.PUBLIC_URL}/event/import-faculty`,
            type: "link",
            permission: "Importfaculty"
          },
        ],
      },
      {
        title: "Manage Category",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/event/manage-event-category`,
        permission: "Eventcategories"
      },
      {
        title: "App Layout",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/event/app-layout`,
        permission: "AppLayout"
      },
      {
        path: `${process.env.PUBLIC_URL}/event/manage-page`,
        icon: "user",
        type: "link",
        active: false,
        title: "Manage Pages",
        permission: "Pages"
      },
      {
        title: "Manage Exhibitor",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/event/manage-exhibitor`,
        permission: "Exhibitors"
      },

      {
        title: "Manage Hall",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/event/manage-hall`,
        permission: "ManageHall"
      },
      {
        title: "Manage location",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/event/manage-Location`,
        permission: "ManageLocation"
      },
      {
        title: "Manage Role",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/event/manage-role`,
        permission: "Eventroles"
      },
      {
        title: "Manage Program",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/event/manage-program`,
        permission: "Manageprogramday"
      },
      {
        title: "Event session",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/event/manage-session`,
        permission: "ManageSession"
      },
      // {
      //   title: "Manage Exhibitor",
      //   icon: "user",
      //   type: "link",
      //   active: false,
      //   path: `${process.env.PUBLIC_URL}/event/manage-exhibitor`,
      //   permission: "Event Manage Exibitor"
      // },

      // {
      //   title: "Manage Map",
      //   icon: "user",
      //   type: "link",
      //   active: false,
      //   path: `${process.env.PUBLIC_URL}/event/fLoor-map`,
      //   permission: "Fields"
      // },
      {
        title: "Manage notification",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/event/manage-notification`,
        permission: "Notification"
      },
      {
        title: "Realtime notification",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/event/realtime-notification`,
        permission: "Event Realtime Notification"
      },
      {
        title: "Report",
        icon: "user",
        type: "sub",
        children: [
          {
            title: "User Report",
            path: `${process.env.PUBLIC_URL}/event/confirm-user-report`,
            type: "link",
            permission: "EventUserReport"
          },
          {
            title: "Exhibitor Report",
            path: `${process.env.PUBLIC_URL}/event/exhibitor-report`,
            type: "link",
            permission: "ExhibitorReport"
          },

        ],
      },
      {
        title: "Email",
        icon: "email",
        type: "sub",
        children: [
          {
            title: "Promotional Email",
            type: "link",
            path: `${process.env.PUBLIC_URL}/event/event-bulk-email`,
            permission: "EventBulkEmail"
          },
          // {
          //   title: "Badge Email",
          //   type: "link",
          //   path: `${process.env.PUBLIC_URL}/onsite/bulk-badge-email`,
          //   permission: "Badge Email"
          // },

        ],
      },
      {
        title: "Event Setting",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/event/event-setting`,
        permission: "EventAdminSetting"
      },
      {
        title: "Manage template",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/event/manage-template`,
        permission: "Templates" // Mahes will update this
      },

    ],
  },


  // onsite Sidebar Menu
  {
    menutitle: "Onsite App Admin",
    menucontent: "Onsite App Admin",
    Items: [
      {
        title: "Dashboard",
        icon: "home",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/onsite/dashboard`,
        permission: "Dashboard",
      },
      {
        title: "Manage Reg Form",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/onsite/manage-form`,
        permission: "Fields"
      },
      {
        title: "Manage Feedback Form",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/onsite/manage-feedback-form`,
        permission: "FeedbackFields"
      },
      {
        title: "Manage Feedback Data",
        icon: "user",
        type: "link",
        active: false,
        path: `${process.env.PUBLIC_URL}/onsite/feedback-listing`,
        permission: "FeedbackFields"
      },
      {
        title: "Manage User",
        icon: "user",
        type: "sub",
        children: [
          {
            title: "Create User",
            path: `${process.env.PUBLIC_URL}/onsite/add-user`,
            type: "link",
            permission: "AddUser"
          },
          {
            title: "User Listing",
            path: `${process.env.PUBLIC_URL}/onsite/manage-user`,
            type: "link",
            permission: "UserListing"
          },
        ],
      },
      {
        title: "Import User",
        icon: "user",
        type: "sub",
        children: [
          {
            title: "With Reg No",
            type: "link",
            path: `${process.env.PUBLIC_URL}/onsite/import-user-with-reg`,
            permission: "ImportUserWithRegNo"
          },
          {
            title: "Without Reg No",
            path: `${process.env.PUBLIC_URL}/onsite/import-user-without-reg`,
            type: "link",
            permission: "ImportUserWithoutReg"
          },
          {
            title: "Blank Badge Data",
            path: `${process.env.PUBLIC_URL}/onsite/import-blankuser`,
            type: "link",
            permission: "ImportBlankUser"
          }
        ],
      },
      {
        path: `${process.env.PUBLIC_URL}/onsite/manage-category`,
        icon: "user",
        type: "link",
        active: false,
        title: "Manage Category",
        permission: "Categories"
      }, {
        title: "Manage Workshop type",
        path: `${process.env.PUBLIC_URL}/onsite/manage-workshoptype`,
        icon: "user",
        type: "link",
        active: false,
        permission: "Workshoptype"
      },
      {
        path: `${process.env.PUBLIC_URL}/onsite/manage-workshop`,
        icon: "user",
        type: "link",
        active: false,
        title: "Manage Workshop",
        permission: "Workshop"
      },
      {
        path: `${process.env.PUBLIC_URL}/onsite/manage-facility`,
        icon: "user",
        type: "link",
        active: false,
        title: "Manage Facility",
        permission: "Facility" // Component Name 
      },
      {
        path: `${process.env.PUBLIC_URL}/onsite/manage-category-permission`,
        icon: "user",
        type: "link",
        active: false,
        title: "Manage Categories Permission",
        permission: "CategoryPermissions"
      },
      {
        path: `${process.env.PUBLIC_URL}/onsite/roles-permission`,
        icon: "user",
        type: "link",
        active: false,
        title: "Roles & Permission",
        permission: "Roles & Permission"
      },
      {
        path: `${process.env.PUBLIC_URL}/onsite/manage-app-user`,
        icon: "user",
        type: "link",
        active: false,
        title: "App User Login",
        permission: "AppUser"
      },
      {
        title: "Manage Badge",
        icon: "user",
        type: "sub",
        children: [
          {
            title: "Create & View Badges",
            type: "link",
            path: `${process.env.PUBLIC_URL}/onsite/create-badges`,
            permission: "Createbadge"
          },
          {
            title: "Single Export",
            type: "link",
            path: `${process.env.PUBLIC_URL}/onsite/search-export`,
            permission: "SingleExport"
          },
          {
            title: "Bulk Export",
            type: "link",
            path: `${process.env.PUBLIC_URL}/onsite/badge-export`,
            permission: "BulkExport"
          },
        ],
      },
      {
        title: "Manage Certificate",
        icon: "user",
        type: "sub",
        children: [
          {
            title: "Create & View Certificate",
            type: "link",
            path: `${process.env.PUBLIC_URL}/onsite/manage-certificate`,
            permission: "Createbadge"
          },
          {
            title: "Single Export",
            type: "link",
            path: `${process.env.PUBLIC_URL}/onsite/exports-certificate`,
            permission: "SingleExport"
          },
          {
            title: "Bulk Export",
            type: "link",
            path: `${process.env.PUBLIC_URL}/onsite/exportb-certificate`,
            permission: "BulkExport"
          },
        ],
      },


      // { path: `${process.env.PUBLIC_URL}/onsite/Bulk-mail`, icon: "email", type: "link", active: false, title: "Email",  permission: "Admin Setting" },

      {
        title: "Email",
        icon: "email",
        type: "sub",
        children: [
          {
            title: "Promotional Email",
            type: "link",
            path: `${process.env.PUBLIC_URL}/onsite/promotional-email`,
            permission: "PromotionalEmail"
          },
          // {
          //   title: "Badge Email",
          //   type: "link",
          //   path: `${process.env.PUBLIC_URL}/onsite/bulk-badge-email`,
          //   permission: "Badge Email"
          // },

        ],
      },

      {
        title: "Report",
        icon: "user",
        type: "sub",
        children: [
          {
            title: "User Report",
            type: "link",
            path: `${process.env.PUBLIC_URL}/onsite/user-report`,
            permission: "UserReport"
          },
          {
            title: "Scan Report",
            type: "link",
            path: `${process.env.PUBLIC_URL}/onsite/scan-report`,
            permission: "ScanReport"
          },

        ],
      },

      { path: `${process.env.PUBLIC_URL}/onsite/admin-setting`, icon: "user", type: "link", active: false, title: "Settings", permission: "AdminSetting" },

      {
        path: `${process.env.PUBLIC_URL}/onsite/admin-role-permission`,
        icon: "user",
        type: "link",
        active: false,
        title: "PERMISSION",
        permission: "AdminRolesPermission"
      },


      // {
      //   title: "Setting",
      //   icon: "user",
      //   type: "sub",
      //   children: [
      //     {
      //       title: "Admin Setting",
      //       type: "link",
      //       path: `${process.env.PUBLIC_URL}/onsite/Admin-setting`,
      //     },
      //     {
      //       title: "App device setting",
      //       path: `${process.env.PUBLIC_URL}/onsite/App-setting`,
      //       type: "link",
      //     },
      //   ],
      // },



    ],
  },
  //



  // {
  //   menutitle: "Applications",
  //   menucontent: "Ready to use Apps",
  //   Items: [
  //     {
  //       title: "Project",
  //       icon: "project",
  //       type: "sub",
  //       badge: "badge badge-light-secondary",
  //       badgetxt: "New",
  //       active: false,
  //       children: [
  //         { path: `${process.env.PUBLIC_URL}/app/project/project-list`, type: "link", title: "Project-List" },
  //         { path: `${process.env.PUBLIC_URL}/app/project/new-project`, type: "link", title: "Create New" },
  //       ],
  //     },
  //     { path: `${process.env.PUBLIC_URL}/app/file-manager`, icon: "file", title: "File-Manager", type: "link" },
  //     {
  //       title: "Ecommerce",
  //       icon: "ecommerce",
  //       type: "sub",
  //       active: false,
  //       children: [
  //         { path: `${process.env.PUBLIC_URL}/app/ecommerce/product`, title: "Products", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/app/ecommerce/product-page/1`, title: "Product-Page", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/app/ecommerce/product-list`, title: "Product-List", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/app/ecommerce/payment-details`, title: "Payment-Detail", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/app/ecommerce/orderhistory`, title: "OrderHistory", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/app/ecommerce/invoice`, title: "Invoice", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/app/ecommerce/cart`, title: "Cart", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/app/ecommerce/wishlist`, title: "Wishlist", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/app/ecommerce/checkout`, title: "checkout", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/app/ecommerce/pricing`, title: "Pricing", type: "link" },
  //       ],
  //     },
  //     { path: `${process.env.PUBLIC_URL}/app/email-app`, icon: "email", title: "Email", type: "link" },
  //     {
  //       title: "Chat",
  //       icon: "chat",
  //       type: "sub",
  //       active: false,
  //       children: [
  //         { path: `${process.env.PUBLIC_URL}/app/chat-app/chats`, type: "link", title: "Chats" },
  //         { path: `${process.env.PUBLIC_URL}/app/chat-app/chat-video-app`, type: "link", title: "Video-app" },
  //       ],
  //     },
  //     {
  //       title: "Users",
  //       icon: "user",
  //       path: `${process.env.PUBLIC_URL}/app/users/profile`,
  //       type: "sub",
  //       bookmark: true,
  //       active: false,
  //       children: [
  //         { path: `${process.env.PUBLIC_URL}/app/users/profile`, type: "link", title: "User Profile" },
  //         { path: `${process.env.PUBLIC_URL}/app/users/edit`, type: "link", title: "User Edit" },
  //         { path: `${process.env.PUBLIC_URL}/app/users/cards`, type: "link", title: "User Cards" },
  //         {
  //           title: "User-list",
  //           path: `${process.env.PUBLIC_URL}/app/users/listing-page`,
  //           type: "link",
  //         },
  //       ],
  //     },
  //     { path: `${process.env.PUBLIC_URL}/app/bookmark`, icon: "bookmark", type: "link", title: "Bookmark" },
  //     {
  //       title: "Contact",
  //       icon: "contact",
  //       type: "link",
  //       active: false,
  //       path: `${process.env.PUBLIC_URL}/app/contact-app/contacts`,
  //     },
  //     { path: `${process.env.PUBLIC_URL}/app/task`, icon: "task", type: "link", title: "Task" },
  //     { path: `${process.env.PUBLIC_URL}/app/calendar/draggable-calendar`, icon: "calendar", type: "link", title: "Calendar" },

  //     { path: `${process.env.PUBLIC_URL}/app/social-app`, icon: "social", type: "link", title: "Social-App", bookmark: true },
  //     { path: `${process.env.PUBLIC_URL}/app/todo-app/todo`, icon: "to-do", type: "link", title: "Todo" },
  //     { path: `${process.env.PUBLIC_URL}/app/search`, icon: "search", type: "link", title: "Search Result" },
  //   ],
  // },



  // {
  //   menutitle: "Forms & Table",
  //   menucontent: "Ready to use froms & tables",
  //   Items: [
  //     {
  //       title: "Forms",
  //       icon: "form",
  //       type: "sub",
  //       menutitle: "Forms & Table",
  //       menucontent: "Ready to use froms & tables",
  //       active: false,
  //       children: [
  //         {
  //           title: "Controls",
  //           type: "sub",
  //           children: [
  //             { title: "Validation", type: "link", path: `${process.env.PUBLIC_URL}/forms/controls/validation` },
  //             { title: "Input", type: "link", path: `${process.env.PUBLIC_URL}/forms/controls/input` },
  //             { title: "Radio-Checkbox", type: "link", path: `${process.env.PUBLIC_URL}/forms/controls/radio-checkbox` },
  //             { title: "Group", type: "link", path: `${process.env.PUBLIC_URL}/forms/controls/group` },
  //             { title: "MegaOption", type: "link", path: `${process.env.PUBLIC_URL}/forms/controls/megaoption` },
  //           ],
  //         },
  //         {
  //           title: "Widget",
  //           type: "sub",
  //           children: [
  //             { title: "Datepicker", type: "link", path: `${process.env.PUBLIC_URL}/forms/widget/datepicker` },
  //             { title: "Datetimepicker", type: "link", path: `${process.env.PUBLIC_URL}/forms/widget/datetimepicker` },
  //             { title: "Touchspin", type: "link", path: `${process.env.PUBLIC_URL}/forms/widget/touchspin` },
  //             { title: "Select2", type: "link", path: `${process.env.PUBLIC_URL}/forms/widget/select2` },
  //             { title: "Switch", type: "link", path: `${process.env.PUBLIC_URL}/forms/widget/switch` },
  //             { title: "Typeahead", type: "link", path: `${process.env.PUBLIC_URL}/forms/widget/typeahead` },
  //             { title: "Clipboard", type: "link", path: `${process.env.PUBLIC_URL}/forms/widget/clipboard` },
  //           ],
  //         },
  //         {
  //           title: "Layout",
  //           type: "sub",
  //           children: [
  //             { path: `${process.env.PUBLIC_URL}/forms/layout/formdefault`, title: "FormDefault", type: "link" },
  //             { path: `${process.env.PUBLIC_URL}/forms/layout/formwizard`, title: "FormWizard", type: "link" },
  //           ],
  //         },
  //       ],
  //     },

  //     {
  //       title: "Table",
  //       icon: "table",
  //       type: "sub",
  //       children: [
  //         {
  //           title: "ReactstrapTable",
  //           type: "link",
  //           path: `${process.env.PUBLIC_URL}/table/reactstraptable/basictable`,
  //         },
  //         {
  //           title: "DataTable",
  //           path: `${process.env.PUBLIC_URL}/table/datatable`,
  //           type: "link",
  //         },
  //       ],
  //     },
  //   ],
  // },


  // {
  //   menutitle: "Components",
  //   menucontent: "UI Components & Elements",
  //   Items: [
  //     {
  //       title: "Ui-Kits",
  //       icon: "ui-kits",
  //       type: "sub",
  //       active: false,
  //       children: [
  //         { path: `${process.env.PUBLIC_URL}/ui-kits/typography`, title: "Typography", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/ui-kits/avatar`, title: "Avatar", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/ui-kits/helper-class`, title: "Helper-Class", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/ui-kits/grids`, title: "Grids", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/ui-kits/tag-pills`, title: "Tag-Pills", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/ui-kits/progress`, title: "Progress", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/ui-kits/modal`, title: "Modal", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/ui-kits/alert`, title: "Alert", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/ui-kits/popover`, title: "Popover", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/ui-kits/tooltips`, title: "Tooltips", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/ui-kits/spinner`, title: "Spinner", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/ui-kits/dropdown`, title: "Dropdown", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/ui-kits/accordion`, title: "Accordion", type: "link" },
  //         {
  //           title: "Tabs",
  //           type: "sub",
  //           children: [
  //             { title: "Bootstrap", type: "link", path: `${process.env.PUBLIC_URL}/ui-kits/tabs/bootstrap` },
  //             { title: "Line", type: "link", path: `${process.env.PUBLIC_URL}/ui-kits/tabs/line` },
  //           ],
  //         },
  //         { path: `${process.env.PUBLIC_URL}/ui-kits/shadow`, title: "Shadow", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/ui-kits/list`, title: "List", type: "link" },
  //       ],
  //     },

  //     {
  //       title: "Bonus-Ui",
  //       icon: "bonus-kit",
  //       type: "sub",
  //       badge1: true,
  //       active: false,
  //       children: [
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/scrollable`, title: "Scrollable", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/bootstrap-notify`, title: "Bootstrap-Notify", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/tree-view`, title: "Tree View", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/rating`, title: "Rating", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/dropzone`, title: "Dropzone", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/tour`, title: "Tour ", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/sweet-alert`, title: "Sweet-Alert", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/carousel`, title: "Carousel", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/ribbons`, title: "Ribbons", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/pagination`, title: "Pagination", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/breadcrumb`, title: "Breadcrumb", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/rangeslider`, title: "RangeSlider", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/imagecropper`, title: "ImageCropper", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/stickynotes`, title: "StickyNotes", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/drag_and_drop`, title: "Drag_and_Drop", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/image-upload`, title: "Image-Upload", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/card/basiccards`, title: "BasicCards", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/card/creativecards`, title: "CreativeCards", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/card/tabcard`, title: "TabCard", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/bonus-ui/timelines/timeline1`, title: "Timeline1", type: "link" },
  //       ],
  //     },

  //     {
  //       title: "Icons",
  //       icon: "icons",
  //       path: `${process.env.PUBLIC_URL}/icons/flag_icons`,
  //       type: "sub",
  //       active: false,
  //       bookmark: true,
  //       children: [
  //         { path: `${process.env.PUBLIC_URL}/icons/flag_icons`, title: "Flag Icon", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/icons/fontawesome_icon`, title: "Fontawesome Icon", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/icons/ico_icon`, title: "Ico Icon", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/icons/themify_icons`, title: "Themify Icon", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/icons/feather_icons`, title: "Feather Icon", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/icons/weather_icons`, title: "Weather Icons", type: "link" },
  //       ],
  //     },

  //     {
  //       title: "Buttons",
  //       icon: "button",
  //       type: "sub",
  //       active: false,
  //       children: [
  //         { path: `${process.env.PUBLIC_URL}/buttons/simplebutton`, title: "SimpleButton", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/buttons/flat`, title: "Flat", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/buttons/edge`, title: "Edge", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/buttons/raised`, title: "Raised", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/buttons/group`, title: "Group", type: "link" },
  //       ],
  //     },

  //     {
  //       title: "Charts",
  //       icon: "charts",
  //       type: "sub",
  //       active: false,
  //       children: [
  //         { path: `${process.env.PUBLIC_URL}/charts/apex`, type: "link", title: "Apex" },
  //         { path: `${process.env.PUBLIC_URL}/charts/google`, type: "link", title: "Google" },
  //         { path: `${process.env.PUBLIC_URL}/charts/chartjs`, type: "link", title: "Chartjs" },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   menutitle: "Pages",
  //   menucontent: "All neccesory pages added",
  //   Items: [
  //     {
  //       icon: "sample-page",
  //       badge2: true,
  //       active: false,
  //       path: `${process.env.PUBLIC_URL}/pages/sample-page`,
  //       title: "Sample-Page",
  //       type: "link",
  //     },
  //     {
  //       title: "Others",
  //       icon: "others",
  //       type: "sub",
  //       children: [
  //         {
  //           title: "Error Pages",
  //           type: "sub",
  //           children: [
  //             { title: "Error Page 1", type: "link", path: `${process.env.PUBLIC_URL}/pages/errors/error400` },
  //             { title: "Error Page 2", type: "link", path: `${process.env.PUBLIC_URL}/pages/errors/error401` },
  //             { title: "Error Page 3", type: "link", path: `${process.env.PUBLIC_URL}/pages/errors/error403` },
  //             { title: "Error Page 4", type: "link", path: `${process.env.PUBLIC_URL}/pages/errors/error404` },
  //             { title: "Error Page 5", type: "link", path: `${process.env.PUBLIC_URL}/pages/errors/error500` },
  //             { title: "Error Page 6", type: "link", path: `${process.env.PUBLIC_URL}/pages/errors/error503` },
  //           ],
  //         },
  //         {
  //           title: "Authentication",
  //           type: "sub",
  //           children: [
  //             { title: "Login Simple", type: "link", path: `${process.env.PUBLIC_URL}/pages/authentication/login-simple` },
  //             { title: "Login with bg image", type: "link", path: `${process.env.PUBLIC_URL}/pages/authentication/login-bg-img` },
  //             { title: "Login with image two", type: "link", path: `${process.env.PUBLIC_URL}/pages/authentication/login-img` },
  //             { title: "Login with validation", type: "link", path: `${process.env.PUBLIC_URL}/pages/authentication/login-validation` },
  //             { title: "Login with tooltip", type: "link", path: `${process.env.PUBLIC_URL}/pages/authentication/login-tooltip` },
  //             { title: "Login with sweetalert", type: "link", path: `${process.env.PUBLIC_URL}/pages/authentication/login-sweetalert` },
  //             { title: "Register Simple", type: "link", path: `${process.env.PUBLIC_URL}/pages/authentication/register-simple` },
  //             { title: "Register with Bg Image", type: "link", path: `${process.env.PUBLIC_URL}/pages/authentication/register-bg-img` },
  //             { title: "Register with Bg Video", type: "link", path: `${process.env.PUBLIC_URL}/pages/authentication/register-video` },
  //             { title: "Unloack User", type: "link", path: `${process.env.PUBLIC_URL}/pages/authentication/unlock-user` },
  //             { title: "Forget Password", type: "link", path: `${process.env.PUBLIC_URL}/pages/authentication/forget-pwd` },
  //             { title: "Reset Password", type: "link", path: `${process.env.PUBLIC_URL}/pages/authentication/create-pwd` },
  //             { title: "Maintenance", type: "link", path: `${process.env.PUBLIC_URL}/pages/authentication/maintenance` },
  //           ],
  //         },
  //         {
  //           title: "Coming Soon",
  //           type: "sub",
  //           children: [
  //             { title: "Coming Simple", type: "link", path: `${process.env.PUBLIC_URL}/pages/comingsoon/comingsoon` },
  //             { title: "Coming with Bg Video", type: "link", path: `${process.env.PUBLIC_URL}/pages/comingsoon/coming-bg-video` },
  //             { title: "Coming with bg Image", type: "link", path: `${process.env.PUBLIC_URL}/pages/comingsoon/coming-bg-img` },
  //           ],
  //         },
  //       ],
  //     },
  //   ],
  // },

  // {
  //   menutitle: "Miscellaneous",
  //   menucontent: "Bouns Pages & Apps",
  //   Items: [
  //     {
  //       title: "Gallery",
  //       icon: "gallery",
  //       type: "sub",
  //       active: false,
  //       children: [
  //         { path: `${process.env.PUBLIC_URL}/app/gallery/grids`, title: "Grids", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/app/gallery/griddesc`, title: "GridDesc", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/app/gallery/masonrys`, title: "Masonrys", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/app/gallery/masonrydesc`, title: "MasonryDesc", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/app/gallery/hover_effect`, title: "Hover_Effect", type: "link" },
  //       ],
  //     },

  //     {
  //       title: "Blog",
  //       icon: "blog",
  //       type: "sub",
  //       active: false,
  //       children: [
  //         { path: `${process.env.PUBLIC_URL}/app/blog/blogdetails`, title: "BlogDetails", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/app/blog/blogsingle`, title: "BlogSingle", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/app/blog/blogpost`, title: "BlogPost", type: "link" },
  //       ],
  //     },
  //     { path: `${process.env.PUBLIC_URL}/app/faq`, icon: "faq", type: "link", active: false, title: "FAQ" },
  //     {
  //       title: "JobSearch",
  //       icon: "job-search",
  //       type: "sub",
  //       active: false,
  //       children: [
  //         { path: `${process.env.PUBLIC_URL}/app/jobsearch/cardview`, title: "CardView", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/app/jobsearch/joblist`, title: "JobList", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/app/jobsearch/jobdetail`, title: "JobDetail", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/app/jobsearch/jobapply`, title: "JobApply", type: "link" },
  //       ],
  //     },
  //     {
  //       title: "Learning",
  //       icon: "learning",
  //       type: "sub",
  //       active: false,
  //       children: [
  //         { path: `${process.env.PUBLIC_URL}/app/learning/learninglist`, title: "LearningList", type: "link" },
  //         { path: `${process.env.PUBLIC_URL}/app/learning/learningdetail`, title: "LearningDetail", type: "link" },
  //       ],
  //     },
  //     {
  //       title: "Map",
  //       icon: "maps",
  //       type: "sub",
  //       active: false,
  //       children: [
  //         { path: `${process.env.PUBLIC_URL}/app/map/googlemap`, type: "link", title: "GoogleMap" },
  //         { path: `${process.env.PUBLIC_URL}/app/map/pigeonmap`, type: "link", title: "PigeonMap" },
  //       ],
  //     },
  //     {
  //       title: "Editor",
  //       icon: "editors",
  //       type: "sub",
  //       active: false,
  //       children: [
  //         { path: `${process.env.PUBLIC_URL}/editor/ckeditor`, type: "link", title: "CKEditor" },
  //         { path: `${process.env.PUBLIC_URL}/editor/mdeeditor`, type: "link", title: "MDEEditor" },
  //         { path: `${process.env.PUBLIC_URL}/editor/aceeditor`, type: "link", title: "ACEEditor" },
  //       ],
  //     },

  //     { path: `${process.env.PUBLIC_URL}/app/knowledgebase`, icon: "knowledgebase", type: "link", active: false, title: "Knowledgebase" },
  //     { path: `${process.env.PUBLIC_URL}/app/supportticket`, icon: "support-tickets", type: "link", active: false, title: "SupportTicket" },
  //   ],
  // },
];
