import React, { Fragment, useState, useEffect, useCallback, useContext } from 'react';
import { Form, Row } from 'reactstrap';
import CustomContext from '../../_helper/Customizer';
import Leftbar from './Leftbar/index';
import RightHeader from './RightHeader/index';
import { MENUITEMS } from '../Sidebar/Menu';

const Header = () => {
  const id = window.location.pathname.split('/').pop();
  const layout = id;
  const { toggleIcon } = useContext(CustomContext);
  // eslint-disable-next-line
  const [mainmenu, setMainMenu] = useState(MENUITEMS);
  const [searchValue, setsearchValue] = useState('');
  // eslint-disable-next-line
  const [searchResult, setSearchResult] = useState(false);
  // eslint-disable-next-line
  const [searchResultEmpty, setSearchResultEmpty] = useState(false);
  const { customizer } = useContext(CustomContext);

  const layout_type = customizer.settings.layout_type;
  // const layout_versions = customizer.color.mix_background_layout;

  // const layout_version = localStorage.getItem('layout_version') || (layout_versions && localStorage.setItem('layout_version', layout_versions));

  const escFunction = useCallback((event) => {
    if (event.keyCode === 27) {
      setsearchValue('');
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', escFunction, false);
    return () => {
      document.removeEventListener('keydown', escFunction, false);
    };
  }, [escFunction]);

  const handleSearchKeyword = (keyword) => {
    keyword ? addFix() : removeFix();
    const items = [];

    mainmenu.map((menuItems) => {
      menuItems.Items.filter((mItems) => {
        if (mItems.title.toLowerCase().includes(keyword) && mItems.type === 'link') {
          items.push(mItems);
        }
        if (!mItems.children) return false;
        mItems.children.filter((subItems) => {
          if (subItems.title.toLowerCase().includes(keyword) && subItems.type === 'link') {
            subItems.icon = mItems.icon;
            items.push(subItems);
          }
          if (!subItems.children) return false;
          subItems.children.filter((suSubItems) => {
            if (suSubItems.title.toLowerCase().includes(keyword)) {
              suSubItems.icon = mItems.icon;
              items.push(suSubItems);
            }
            return suSubItems;
          });
          return subItems;
        });
        checkSearchResultEmpty(items);
        setsearchValue(items);
        return mItems;
      });
      return menuItems;
    });
  };

  const checkSearchResultEmpty = (items) => {
    if (!items.length) {
      setSearchResultEmpty(true);
      document.querySelector('.empty-menu').classList.add('is-open');
    } else {
      setSearchResultEmpty(false);
      document.querySelector('.empty-menu').classList.remove('is-open');
    }
  };

  const addFix = () => {
    setSearchResult(true);
    document.querySelector('.Typeahead-menu').classList.add('is-open');
    document.body.classList.add(`${layout_type}`);
    // if (document.body.classList.value !== 'box-layout') {
    //   document.body.classList.add('offcanvas');
    // }
  };

  const removeFix = () => {
    setSearchResult(false);
    setsearchValue('');
    document.querySelector('.Typeahead-menu').classList.remove('is-open');
    document.body.classList.add(`${layout_type}`);
    document.body.classList.remove('offcanvas');
  };

  return (
    <Fragment>
      <div className={`page-header ${toggleIcon ? 'close_icon' : ''}`}>
        <Row className='header-wrapper m-0'>
          <Leftbar />
          <RightHeader />
        </Row>
      </div>
    </Fragment>
  );
};

export default Header;
