import React, { useContext, useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft } from 'react-feather';
import { useLocation } from 'react-router-dom';
import CustomizerContext from '../../_helper/Customizer';
import SidebarMenuItems from './SidebarMenuItems';
import { MENUITEMS } from './Menu';

const SidebarMenu = ({ setMainMenu, props, sidebartoogle, setNavActive, activeClass, width, showMenuTitle }) => {
  const { customizer } = useContext(CustomizerContext);
  const wrapper = customizer.settings.sidebar.type;
  const [margin, setMargin] = useState(0);
  const location = useLocation();
  const { product_name } = location.state || {};

  // Save product_name to localStorage if it exists
  useEffect(() => {
    if (product_name) {
      localStorage.setItem('product_name', product_name);
    }
  }, [product_name]);

  // Retrieve product_name from localStorage if location.state is null
  const Product = product_name || localStorage.getItem('product_name');

  const scrollToRight = () => {
    if (margin <= -2598 || margin <= -2034) {
      if (width === 492) {
        setMargin(-3570);
      } else {
        setMargin(-3464);
      }
      document.querySelector('.right-arrow').classList.add('d-none');
      document.querySelector('.left-arrow').classList.remove('d-none');
    } else {
      setMargin((margin) => (margin += -width));
      document.querySelector('.left-arrow').classList.remove('d-none');
    }
  };

  const scrollToLeft = () => {
    if (margin >= -width) {
      setMargin(0);
      document.querySelector('.left-arrow').classList.add('d-none');
      document.querySelector('.right-arrow').classList.remove('d-none');
    } else {
      setMargin((margin) => (margin += width));
      document.querySelector('.right-arrow').classList.remove('d-none');
    }
  };

  // Filter MENUITEMS based on showMenuTitle (product name)
  const filteredMenuItems = MENUITEMS.filter(item => item.menutitle === Product);
  console.log('showMenuTitle', showMenuTitle);

  return (
    <nav className="sidebar-main" id="sidebar-main">
      <div className="left-arrow" onClick={scrollToLeft}>
        <ArrowLeft />
      </div>
      <div
        id="sidebar-menu"
        style={
          wrapper.split(' ').includes('horizontal-wrapper')
            ? { marginLeft: margin + 'px' }
            : { margin: '0px' }
        }
      >
        <ul className="sidebar-links custom-scrollbar">
          <li className="back-btn">
            <div className="mobile-back text-end">
              <span>{'Back'}</span>
              <i className="fa fa-angle-right ps-2" aria-hidden="true"></i>
            </div>
          </li>
          <SidebarMenuItems setMainMenu={setMainMenu} props={props} sidebartoogle={sidebartoogle} setNavActive={setNavActive} activeClass={activeClass} menuItems={filteredMenuItems} />
        </ul>
      </div>
      <div className="right-arrow" onClick={scrollToRight}>
        <ArrowRight />
      </div>
    </nav>
  );
};

export default SidebarMenu;
