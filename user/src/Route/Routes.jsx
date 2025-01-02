
import UserDashboard from "../Components/User/Userdashboard.jsx";
import AddConferenceUser from "../Components/User/add-user.jsx";
import PaymentConfirmPage from "../Components/User/PaymentConfirmPage.jsx";
import EditBasicUserDetails from "../Components/User/Edit-basicdetails.jsx";
import Ordersummary from "../Components/User/order-summary.jsx";
import UserCertificate from "../Components/User/UserCertificate.jsx";
import UserFeedback from "../Components/User/UserFeedback.jsx";
import PaymentReceipt from "../Components/User/payment-receipt.jsx";



export const routes = [

// User Routes

{ path: `${process.env.PUBLIC_URL}/user-dashboard/:layout`, Component: <UserDashboard/> },
{ path: `${process.env.PUBLIC_URL}/conference-register/:layout`, Component: <AddConferenceUser/> },
{ path: `${process.env.PUBLIC_URL}/edit-basicdetails/:layout`, Component: <EditBasicUserDetails/> },
{ path: `${process.env.PUBLIC_URL}/confirm-payment/:layout`, Component: <PaymentConfirmPage/> },
{ path: `${process.env.PUBLIC_URL}/order-summary/:layout`, Component: <Ordersummary/> },
{ path: `${process.env.PUBLIC_URL}/download-certificate/:layout`, Component: <UserCertificate/> },
{ path: `${process.env.PUBLIC_URL}/submit-feedback/:layout`, Component: <UserFeedback/> },
{ path: `${process.env.PUBLIC_URL}/payment-receipt/:layout`, Component: <PaymentReceipt/> },



];