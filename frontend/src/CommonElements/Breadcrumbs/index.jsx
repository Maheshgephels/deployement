// import React, { Fragment, useContext } from 'react';
// import { Container, Row, Col } from 'reactstrap';
// import { Link } from 'react-router-dom';
// import H3 from '../Headings/H3Element';
// import CustomizerContext from '../../_helper/Customizer';
// import SvgIcon from '../../Components/Common/Component/SvgIcon';

// const Breadcrumbs = (props) => {
//   const { layoutURL } = useContext(CustomizerContext);
//   return (
//     <Fragment>
//       <Container fluid={true}>
//         <div className='page-title'>
//           <Row>
//             <Col xs='6'>
//               <H3>{props.mainTitle}</H3>
//             </Col>
//             <Col xs='6'>
//               <ol className='breadcrumb'>
//                 <li className='breadcrumb-item'>
//                   <Link to={`${process.env.PUBLIC_URL}/dashboard/default/${layoutURL}`}>
//                     <SvgIcon iconId='stroke-home' />
//                   </Link>
//                 </li>
//                 <li className='breadcrumb-item'>{props.parent}</li>
//                 {props.subParent ? <li className='breadcrumb-item'>{props.subParent}</li> : ''}
//                 <li className='breadcrumb-item active'>{props.title}</li>
//               </ol>
//             </Col>
//           </Row>
//         </div>
//       </Container>
//     </Fragment>
//   );
// };

// export default Breadcrumbs;


import React, { Fragment, useContext, useEffect, useState } from 'react';
import { Container, Row, Col } from 'reactstrap';
import { Link } from 'react-router-dom';
import H3 from '../Headings/H3Element';
import CustomizerContext from '../../_helper/Customizer';
import { useLocation } from 'react-router-dom';
import SvgIcon from '../../Components/Common/Component/SvgIcon';

const Breadcrumbs = (props) => {
    const { layoutURL } = useContext(CustomizerContext);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 720);

    const location = useLocation();
    const { product_name } = location.state || {};

    // Retrieve product_name from localStorage if location.state is null
    const Product = product_name || localStorage.getItem('product_name');

    console.log("Props", props);


    // Dynamic Breadcrumb home page URL 

    let dashboardURL = '/dashboard/default/';
    if (Product === "Onsite App Admin") {
        dashboardURL = '/dashboard/default/';
    } else if (Product === "Event App Admin") {
        dashboardURL = '/event/dashboard/';
    } else if (Product === "Registration Admin") {
        dashboardURL = '/registration/dashboard/';
    }


    const handleParentClick = (e) => {
        e.preventDefault();
        if (props.parentClickHandler) {
            props.parentClickHandler();
        }
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 720);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <Fragment>
            <Container fluid={true}>
                <div className='page-title'>
                    <Row>
                        {/* First Column */}
                        <Col xs={!isMobile ? '6' : '12'} className={!isMobile ? '' : 'order-2'}>
                            <H3>{props.mainTitle}</H3>
                        </Col>

                        {/* Second Column */}
                        <Col xs={!isMobile ? '6' : '12'} className={!isMobile ? '' : 'order-1'}>
                            <ol className={`breadcrumb ${!isMobile ? 'justify-content-end' : 'justify-content-start mb-2'}`}>
                                <li className='breadcrumb-item'>
                                    <Link to={`${process.env.PUBLIC_URL}${dashboardURL}${layoutURL}`}>
                                        <SvgIcon iconId='stroke-home' />
                                    </Link>
                                </li>
                                <li className="breadcrumb-item active">
                                    {props.parentClickHandler.name === "handleNavigation" ? (
                                        <a href='' onClick={handleParentClick}>
                                            {props.parent}
                                        </a>
                                    ) : (
                                        <a>{props.parent}</a>
                                    )}
                                </li>

                                <li className='breadcrumb-item active'>{props.title}</li>
                            </ol>
                        </Col>
                    </Row>
                </div>

            </Container>
        </Fragment>
    );
};

// Setting default props
Breadcrumbs.defaultProps = {
    parentClickHandler: () => { }, // Default no-op function
};

export default Breadcrumbs;


