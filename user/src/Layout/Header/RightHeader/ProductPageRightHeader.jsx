// import React, { Fragment } from 'react';

// import Language from './Language';
// import Searchbar from './Searchbar';
// import Notificationbar from './Notificationbar';
// import MoonLight from './MoonLight';
// import CartHeader from './CartHeader';
// import BookmarkHeader from './BookmarkHeader';
// import UserHeader from './UserHeader';
// import ProductPageUserHeader from './ProductPageUserHeader';
// import { UL } from '../../../AbstractElements';
// import { Col } from 'reactstrap';

// const RightHeader = () => {
//   return (
//     <Fragment>
//       <Col xxl='7' xl='6' md='7' className='nav-right pull-right right-header col-8 p-0 ms-auto'>
//         {/* <Col md="8"> */}
//         <UL attrUL={{ className: 'simple-list nav-menus flex-row' }}>
//                     {/* <Language />
//           <Searchbar />
//           <BookmarkHeader />
//           <CartHeader />
//           <Notificationbar /> */}
//            <MoonLight />{/*  For future use  */}
//            <UserHeader /> : <ProductPageUserHeader />

//            {/* <ProductPageUserHeader /> */}
//         </UL>
//         {/* </Col> */}
//       </Col>
//     </Fragment>
//   );
// };

// export default RightHeader;
import React, { Fragment } from 'react';
import Language from './Language';
import Searchbar from './Searchbar';
import Notificationbar from './Notificationbar';
import MoonLight from './MoonLight';
import CartHeader from './CartHeader';
import BookmarkHeader from './BookmarkHeader';
import UserHeader from './UserHeader';
import ProductPageUserHeader from './ProductPageUserHeader';
import { UL } from '../../../AbstractElements';
import { Col } from 'reactstrap';

const ProductPageRightHeader = () => {
  return (
    <Fragment>
      <Col xxl='7' xl='6' md='7' className='nav-right pull-right right-header col-8 p-0 ms-auto'>
        <UL attrUL={{ className: 'simple-list nav-menus flex-row' }}>
          {/* <Language />
          <Searchbar />
          <BookmarkHeader />
          <CartHeader />
          <Notificationbar /> */}
          <MoonLight />{/*  For future use  */}
          <ProductPageUserHeader />
        </UL>
      </Col>
    </Fragment>
  );
};

export default ProductPageRightHeader;
