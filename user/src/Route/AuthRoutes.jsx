import ComingSimple from '../Components/Pages/ComingSoon/ComingSimple';
import CreatePwd from '../Components/Pages/Auth/CreatePwd';
import ForgetPwd from '../Components/Pages/Auth/ForgetPwd';
import LoginOne from '../Components/Pages/Auth/LoginOne';
import LoginSweetalert from '../Components/Pages/Auth/LoginSweetalert';
import LoginTooltip from '../Components/Pages/Auth/LoginTooltip';
import LoginTwo from '../Components/Pages/Auth/LoginTwo';
import LoginValidation from '../Components/Pages/Auth/LoginValidation';
import Maintenance from '../Components/Pages/Auth/Maintenance';
import RegisterBgImg from '../Components/Pages/Auth/RegisterBgImg';
import RegisterSimple from '../Components/Pages/Auth/RegisterSimple';
import RegisterVideo from '../Components/Pages/Auth/RegisterVideo';
import UnlockUser from '../Components/Pages/Auth/UnlockUser';
import ErrorPage1 from '../Components/Pages/ErrorPages/ErrorPage400';
import ErrorPage2 from '../Components/Pages/ErrorPages/ErrorPage401';
import ErrorPage3 from '../Components/Pages/ErrorPages/ErrorPage403';
import ErrorPage4 from '../Components/Pages/ErrorPages/ErrorPage404';
import LoginForm from '../Components/Pages/Auth/LoginForm';
import ComingBgImg from '../Components/Pages/ComingSoon/ComingBgImg';
import ComingBgVideo from '../Components/Pages/ComingSoon/ComingBgVideo';
import Error500 from '../Components/Pages/ErrorPages/ErrorPage500';
import Error503 from '../Components/Pages/ErrorPages/ErrorPage503';

import PrivateRoute from './PrivateRoute';
import UserSignin from '../Auth/UserSignin';
import UserSignup from '../Auth/UserSignup';

import Certificate from '../Components/User/Certificate';
import Feedback from '../Components/User/Feedback';
import ThankYouPage from '../Components/User/ThankYou';
import NotFound from '../Auth/404';
import AddUserDirectly from '../Components/User/add-directuser';
import DirectPaymentConfirmPage from '../Components/User/directforpayment';
import Multipleuser from "../Components/User/mulipleuserform.jsx";
import ThankYouPagereg from '../Components/User/Thankyouafterreg.jsx';


export const authRoutes = [

  { path: `${process.env.PUBLIC_URL}/userlogin`, Component: <UserSignin /> },
  { path: `${process.env.PUBLIC_URL}/usersignup`, Component: <UserSignup /> },
  { path: `${process.env.PUBLIC_URL}/404`, Component: <NotFound/> },
  { path: `${process.env.PUBLIC_URL}/conirmdirectformpayment`, Component: <DirectPaymentConfirmPage/> },



  { path: `${process.env.PUBLIC_URL}/certificate`, Component: <Certificate /> },
  { path: `${process.env.PUBLIC_URL}/feedback`, Component: <Feedback /> },
  { path: `${process.env.PUBLIC_URL}/thank-you`, Component: <ThankYouPage /> },
  { path: `${process.env.PUBLIC_URL}/multiple-user/:layout`, Component: <Multipleuser/> },


  { path: `${process.env.PUBLIC_URL}/Thank-you-for-reg`, Component: <ThankYouPagereg/> },
  { path: `${process.env.PUBLIC_URL}/userregister`, Component: <AddUserDirectly /> },


  { path: `${process.env.PUBLIC_URL}/pages/authentication/login-simple/:layout`, Component: <LoginForm /> },
  { path: `${process.env.PUBLIC_URL}/pages/authentication/login-img/:layout`, Component: <LoginOne /> },
  { path: `${process.env.PUBLIC_URL}/pages/authentication/login-bg-img/:layout`, Component: <LoginTwo /> },
  { path: `${process.env.PUBLIC_URL}/pages/authentication/login-validation/:layout`, Component: <LoginValidation /> },
  { path: `${process.env.PUBLIC_URL}/pages/authentication/login-tooltip/:layout`, Component: <LoginTooltip /> },
  { path: `${process.env.PUBLIC_URL}/pages/authentication/login-sweetalert/:layout`, Component: <LoginSweetalert /> },
  { path: `${process.env.PUBLIC_URL}/pages/authentication/register-simple/:layout`, Component: <RegisterSimple /> },
  { path: `${process.env.PUBLIC_URL}/pages/authentication/register-bg-img/:layout`, Component: <RegisterBgImg /> },
  { path: `${process.env.PUBLIC_URL}/pages/authentication/register-video/:layout`, Component: <RegisterVideo /> },
  { path: `${process.env.PUBLIC_URL}/pages/authentication/unlock-user/:layout`, Component: <UnlockUser /> },
  { path: `${process.env.PUBLIC_URL}/pages/authentication/forget-pwd/:layout`, Component: <ForgetPwd /> },
  { path: `${process.env.PUBLIC_URL}/pages/authentication/create-pwd/:layout`, Component: <CreatePwd /> },
  { path: `${process.env.PUBLIC_URL}/pages/authentication/maintenance/:layout`, Component: <Maintenance /> },

  //Coming-soon
  { path: `${process.env.PUBLIC_URL}/pages/comingsoon/comingsoon/:layout`, Component: <ComingSimple /> },
  { path: `${process.env.PUBLIC_URL}/pages/comingsoon/coming-bg-img/:layout`, Component: <ComingBgImg /> },
  { path: `${process.env.PUBLIC_URL}/pages/comingsoon/coming-bg-video/:layout`, Component: <ComingBgVideo /> },

  //Error
  { path: `${process.env.PUBLIC_URL}/pages/errors/error400/:layout`, Component: <ErrorPage1 /> },
  { path: `${process.env.PUBLIC_URL}/pages/errors/error401/:layout`, Component: <ErrorPage2 /> },
  { path: `${process.env.PUBLIC_URL}/pages/errors/error403/:layout`, Component: <ErrorPage3 /> },
  { path: `${process.env.PUBLIC_URL}/pages/errors/error404/:layout`, Component: <ErrorPage4 /> },
  { path: `${process.env.PUBLIC_URL}/pages/errors/error500/:layout`, Component: <Error500 /> },
  { path: `${process.env.PUBLIC_URL}/pages/errors/error503/:layout`, Component: <Error503 /> },
];
