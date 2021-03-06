import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { Col, Row, Card, ListGroup, Image, Button } from 'react-bootstrap'
import { useSelector, useDispatch } from 'react-redux'
import { PayPalButton } from "react-paypal-button-v2";
import Message from '../components/Message'
import Loader from '../components/Loader'
import { getOrderDetails, payOrder } from '../actions/orderActions'
import { ORDER_PAY_RESET } from '../constants/orderConstants'

const OrderScreen = ({ match }) => {
  const orderId = match.params.id

  const [sdkReady, setSdkReady] = useState(false)

  const dispatch = useDispatch()

  const orderDetails = useSelector(state => state.orderDetails)
  const { loading, order, error } = orderDetails

  const orderPay = useSelector(state => state.orderPay)
  const { loading: loadingPay, success: successPay } = orderPay

  const userLogin = useSelector(state => state.userLogin)
  const { userInfo } = userLogin

  useEffect(() => {
    const addPayPalScript = async () => {
      const { data: clientId } = await axios.get('/api/config/paypal')
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}`
      script.async = true
      script.onload = () => { setSdkReady(true) }
      document.body.appendChild(script)
    }

    if (!order || order._id !== orderId || successPay) {
      dispatch({ type: ORDER_PAY_RESET })
      //if you dont put this, when you pay, it will keep refreshing, successPay will always be true
      dispatch(getOrderDetails(orderId))
    } else if (!order.isPaid) {
      if (!window.paypal) {
        addPayPalScript()
      }
    } else {
      setSdkReady(true)
    }
  }, [dispatch, order, orderId, successPay])

  const successPaymentHandler = (paymentResult) => {
    console.log(paymentResult)
    dispatch(payOrder(orderId, paymentResult))
  }

  const deliveredHandler = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      }

      await axios.put(`/api/orders/${orderId}/deliver`, {}, config)

      dispatch(getOrderDetails(orderId))
    } catch (error) {
      console.log(error.response && error.response.data.message ? error.response.data.message : error.message)
    }
  }

  return loading
    ? (<Loader />)
    : error
      ? (<Message variant='danger'> {error} </Message>)
      : (<>
        <Row>
          <Col md={8}>
            <ListGroup variant='flush'>

              <ListGroup.Item>
                <h2>Shipping</h2>
                <p>
                  <strong>Name: </strong>{order.user.name}
                </p>
                <p>
                  <strong>Email: </strong> <a href={`mailto:${order.user.email}`}>{order.user.email}</a>
                </p>
                <p>
                  <strong>Address: </strong>
                  {order.shippingAddress.address}, {order.shippingAddress.city}, {' '}
                  {order.shippingAddress.postalCode}, {' '} {order.shippingAddress.country}
                </p>
                {order.isDelivered
                  ? (<Message variant='success'>Delivered on {order.deliveredAt}</Message>)
                  : (<Message variant='danger'>Not Delivered</Message>)}
              </ListGroup.Item>

              <ListGroup.Item>
                <h2>Payment Method</h2>
                <strong>Method: </strong>
                {order.paymentMethod}
                {order.isPaid
                  ? (<Message variant='success'>Paid on {order.paidAt}</Message>)
                  : (<Message variant='danger'>Not Paid</Message>)}
              </ListGroup.Item>

              <ListGroup.Item>
                <h2>Order items</h2>
                {order.orderItems.length === 0
                  ? (<Message>Order is empty</Message>)
                  : (

                    <ListGroup>
                      {order.orderItems.map((item, index) => (
                        <ListGroup.Item key={index}>
                          <Row>
                            <Col md={2}>
                              <Image src={item.image} alt={item.name} fluid rounded />
                            </Col>
                            <Col className='py-3'>
                              <Link to={`/product/${item.product}`}>
                                {item.name}
                              </Link>
                            </Col>
                            <Col md={4} className='py-3'>
                              {item.qty} x ${item.price} = {item.qty * item.price}
                            </Col>
                          </Row>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>

                  )}
              </ListGroup.Item>

            </ListGroup>
          </Col>
          <Col md={4}>
            <Card>
              <ListGroup variant='flush'>

                <ListGroup.Item>
                  <h2>Order Summary: </h2>
                </ListGroup.Item>

                <ListGroup.Item>
                  <Row>
                    <Col>Items</Col>
                    <Col>${order.itemsPrice}</Col>
                  </Row>
                </ListGroup.Item>

                <ListGroup.Item>
                  <Row>
                    <Col>Shipping</Col>
                    <Col>${order.shippingPrice}</Col>
                  </Row>
                </ListGroup.Item>

                <ListGroup.Item>
                  <Row>
                    <Col>Tax</Col>
                    <Col>${order.taxPrice}</Col>
                  </Row>
                </ListGroup.Item>

                <ListGroup.Item>
                  <Row>
                    <Col>Total Price</Col>
                    <Col>${order.totalPrice}</Col>
                  </Row>
                </ListGroup.Item>
                {!order.isPaid && (
                  <ListGroup.Item>
                    {loadingPay && <Loader />}
                    {!sdkReady ? <Loader /> : (
                      <PayPalButton amount={order.totalPrice} onSuccess={successPaymentHandler} />
                    )}
                  </ListGroup.Item>
                )}

              </ListGroup>
            </Card>

            {userInfo && userInfo.isAdmin && order.isDelivered
              ? (<Button className='my-3 btn-block' variant='dark' disabled onClick={deliveredHandler}>
                Delivered</Button>)
              : userInfo && userInfo.isAdmin && order.isPaid
                ? (<Button className='my-3 btn-block' variant='dark' onClick={deliveredHandler}>
                  Mask as Deliver</Button>)
                : (<></>)}

          </Col>
        </Row>
      </>
      )

}


export default OrderScreen
