import React, { Fragment, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import SvgIcon from "../../Components/Common/Component/SvgIcon";
import CustomizerContext from "../../_helper/Customizer";
import { PermissionsContext } from '../../contexts/PermissionsContext';

const SidebarMenuItems = ({ setMainMenu, sidebartoogle, setNavActive, activeClass, menuItems }) => {
  const { layout } = useContext(CustomizerContext);
  const layout1 = localStorage.getItem("sidebar_layout") || layout;
  const id = window.location.pathname.split("/").pop();
  const layoutId = id;
  const CurrentPath = window.location.pathname;
  const { permissions } = useContext(PermissionsContext);
  const { t } = useTranslation();
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);

  // Function to check if a permission is granted
  const hasPermission = (menuItemKey) => {
    if (permissions.hasOwnProperty(menuItemKey)) {
      const menuItemPermissions = permissions[menuItemKey];
      return menuItemPermissions.view === 1;
    }
    return false;
  };

  useEffect(() => {
    filterMenuItems();
  }, [permissions]);

  // Function to filter menu items based on permissions
  const filterMenuItems = () => {
    const filteredItems = menuItems.map((Item) => {
      const filteredChildren = Item.Items.map((menuItem) => {
        if (menuItem.type === "sub") {
          const filteredSubChildren = menuItem.children.filter((child) => hasPermission(child.permission));
          if (filteredSubChildren.length === 0) return null;
          return {
            ...menuItem,
            children: filteredSubChildren,
          };
        }
        return hasPermission(menuItem.permission) ? menuItem : null;
      }).filter((item) => item !== null);

      if (filteredChildren.length === 0) return null;

      return {
        ...Item,
        Items: filteredChildren,
      };
    }).filter((item) => item !== null);

    setFilteredMenuItems(filteredItems);
  };

  const toggletNavActive = (item) => {
    if (window.innerWidth <= 991) {
      if (item.type === "sub") {
        document.querySelector(".page-header").className = "page-header";
        document.querySelector(".sidebar-wrapper").className = "sidebar-wrapper";
      }
    }
    if (!item.active) {
      menuItems.map((a) => {
        a.Items.filter((Items) => {
          if (a.Items.includes(item)) Items.active = false;
          if (!Items.children) return false;
          Items.children.forEach((b) => {
            if (Items.children.includes(item)) {
              b.active = false;
            }
            if (!b.children) return false;
            b.children.forEach((c) => {
              if (b.children.includes(item)) {
                c.active = false;
              }
            });
          });
          return Items;
        });
        return a;
      });
    }
    item.active = !item.active;
    setMainMenu({ mainmenu: menuItems });
  };

  return (
    <>
      {filteredMenuItems.map((Item, i) => (
        <Fragment key={i}>
          <li className="sidebar-main-title">
            <div>
              <h6 className="lan-1">{t(Item.menutitle)}</h6>
            </div>
          </li>
          {Item.Items.map((menuItem, i) => (
            <li className="sidebar-list" key={i}>
              {menuItem.type === "sub" ? (
                <a
                  href="javascript"
                  className={`sidebar-link sidebar-title ${CurrentPath.includes(menuItem.title.toLowerCase()) ? "active" : ""} ${menuItem.active && "active"}`}
                  onClick={(event) => {
                    event.preventDefault();
                    setNavActive(menuItem);
                    activeClass(menuItem.active);
                  }}>
                  <SvgIcon className="stroke-icon" iconId={`stroke-${menuItem.icon}`} />
                  <SvgIcon className="fill-icon" iconId={`fill-${menuItem.icon}`} />
                  <span>{t(menuItem.title)}</span>
                  {menuItem.badge ? <label className={menuItem.badge}>{menuItem.badgetxt}</label> : ""}
                  <div className="according-menu">{menuItem.active ? <i className="fa fa-angle-down"></i> : <i className="fa fa-angle-right"></i>}</div>
                </a>
              ) : (
                ""
              )}

              {menuItem.type === "link" ? (
                <Link to={menuItem.path + "/" + layoutId} className={`sidebar-link sidebar-title link-nav  ${CurrentPath.includes(menuItem.title.toLowerCase()) ? "active" : ""}`} onClick={() => toggletNavActive(menuItem)}>
                  <SvgIcon className="stroke-icon" iconId={`stroke-${menuItem.icon}`} />
                  <SvgIcon className="fill-icon" iconId={`fill-${menuItem.icon}`} />
                  <span>{t(menuItem.title)}</span>
                  {menuItem.badge ? <label className={menuItem.badge}>{menuItem.badgetxt}</label> : ""}
                </Link>
              ) : (
                ""
              )}

              {menuItem.children ? (
                <ul className="sidebar-submenu" style={layout1 !== "compact-sidebar compact-small" ? (menuItem?.active || CurrentPath.includes(menuItem?.title?.toLowerCase()) ? (sidebartoogle ? { opacity: 1, transition: "opacity 500ms ease-in" } : { display: "block" }) : { display: "none" }) : { display: "none" }}>
                  {menuItem.children.map((childrenItem, index) => {
                    return (
                      <li key={index} className={`sidebar-list ${CurrentPath.includes(childrenItem.path.toLowerCase()) ? "active" : ""}`}>
                        <Link to={childrenItem.path + "/" + layoutId} className="sidebar-link sidebar-title link-nav" onClick={() => toggletNavActive(childrenItem)}>
                          {/* <SvgIcon className="stroke-icon" iconId={`stroke-${childrenItem.icon}`} />
                          <SvgIcon className="fill-icon" iconId={`fill-${childrenItem.icon}`} /> */}
                          <span>{t(childrenItem.title)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                ""
              )}
            </li>
          ))}
        </Fragment>
      ))}
    </>
  );
};

export default SidebarMenuItems;
