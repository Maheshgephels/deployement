import React, { useState, useEffect, useContext, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Col, Container, Row, Button } from "reactstrap";
import { BackendAPI } from "../api";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import SweetAlert from 'sweetalert2';
import { FaArrowRight } from "react-icons/fa";
import CustomBreadcrumbs from "../CommonElements/Breadcrumbs/CustomBreadcrumbs";
import ProductPageHeader from "../Layout/Header/ProductPageHeader";
import useAuth from "../Auth/protectedAuth";
import './ProductPage.css';

const ProductPage = () => {
  useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedProductName, setSelectedProductName] = useState(''); // Initialize as an empty string

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${BackendAPI}/auth/products`);
        setProducts(response.data);
      } catch (error) {
        toast.error("Failed to fetch products.");
      }
    };

    fetchProducts();
  }, []);

  const handleCardClick = (product_name, product_url) => {
    console.log('Clicked product name:', product_name);
    setSelectedProductName(product_name);  // Set the selected product name
    if (product_url) {
      navigate(`${process.env.PUBLIC_URL}/${product_url}Consoft`, { state: { product_name } });
      // navigate(`${process.env.PUBLIC_URL}/${product_url}Consoft?product_name=${encodeURIComponent(product_name)}`);
    }
  };

  useEffect(() => {
    if (selectedProductName) {
      console.log('Selected product name updated:', selectedProductName);
      // Any additional logic after the product name is set can go here
    }
  }, [selectedProductName]);

  return (
    <Fragment>
      <ProductPageHeader />
      <Container className="mt-5 mb-5">
        <CustomBreadcrumbs className="bg-white sh" mainTitle="Conference Management Solutions" />
        <Row>
          {products.map((product) => (
            <Col sm="6" md="4" lg="3" key={product.product_id} className="mb-4">
              <Card>
                <div className="card-body">
                  <div>
                    {product.product_id === 1 && (
                      <img
                        src={require("../assets/images/logo/registration.png")}
                        alt="Event Admin"
                        style={{
                          width: '100px',
                          height: '100px',
                          marginLeft: '220px',
                          padding: '5px',
                          position: 'absolute'
                        }}
                      />
                    )}
                    {product.product_id === 2 && (
                      <img
                        src={require("../assets/images/logo/eventapp.png")}
                        alt="Event Admin"
                        style={{
                          width: '100px',
                          height: '100px',
                          marginLeft: '220px',
                          padding: '10px',
                          position: 'absolute'
                        }}
                      />
                    )}
                    {product.product_id === 3 && (
                      <img
                        src={require("../assets/images/logo/onsiteadmin.png")}
                        alt="Event Admin"
                        style={{
                          width: '100px',
                          height: '100px',
                          marginLeft: '220px',
                          padding: '5px',
                          position: 'absolute'
                        }}
                      />
                    )}
                  </div>

                  <h5 className="card-title mb-3">{product.product_name}</h5>




                  <Button
                    color="primary"
                    onClick={() => {
                      if (!product.product_url) {
                        SweetAlert.fire({
                          text: 'This Module is not accessible.  Please contact to ConSoft Team',
                          icon: 'info',
                          timer: 3000,
                          showConfirmButton: false,
                          allowOutsideClick: false,
                          allowEscapeKey: false,
                        });
                      } else {
                        handleCardClick(product.product_name, product.product_url);
                      }
                    }}
                    className={!product.product_url ? 'unclickable-card' : ''}
                  >
                    Enter
                    <FaArrowRight style={{ marginLeft: '5px', verticalAlign: 'middle' }} />
                  </Button>

                  <br />
                  <br />
                  {product.product_id === 1 && (
                    <small style={{ color: 'gray' }}>
                      Manage your Attendee Registrations & Form,  Add, Edit, Track Status, Reports, View stats & visual graphs, charts, Emails & Module Settings.
                    </small>
                  )}
                  {product.product_id === 2 && (
                    <small style={{ color: 'gray' }}>
                      Create, schedule events, manage sessions, exhibitors, and user data, monitor event statistics and generate reports.</small>
                  )}
                  {product.product_id === 3 && (
                    <small style={{ color: 'gray' }}>
                      Manage check-in, registration forms, category-wise access to the facilities, generate reports, view statistics and graphs, design badges and export.</small>
                  )}
                </div>
              </Card>

            </Col>
          ))}
        </Row>
        <ToastContainer />
      </Container>
    </Fragment>
  );
};

export default ProductPage;
