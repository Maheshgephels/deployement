import React, { useState } from 'react';
import { InputGroup } from 'reactstrap';

import { Minus, Plus, X } from 'react-feather';
import { Link, useNavigate } from 'react-router-dom';
import cartItem1 from '../../../assets/images/other-images/cart-img.jpg';
import { Cart, CheckOut, GOTOYOURCART, OrderTotal } from '../../../Constant';
import SvgIcon from '../../../Components/Common/Component/SvgIcon';

const CartHeader = () => {
  const history = useNavigate();
  const id = window.location.pathname.split('/').pop();
  const layout = id;
  const [cartDropdown, setCartDropDown] = useState(false);
  const RedirectToCart = () => {
    history(`${process.env.PUBLIC_URL}/app/ecommerce/cart/${layout}`);
  };
  return (
    <li className='cart-nav onhover-dropdown'>
      {/* <div className='cart-box' onClick={() => setCartDropDown(!cartDropdown)}>
        <SvgIcon iconId='stroke-ecommerce' />
        <span className='badge rounded-pill badge-success'>{'2'}</span>
      </div>
  */}
    </li>
  );
};

export default CartHeader;
