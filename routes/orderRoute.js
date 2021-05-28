const express = require('express');
const router = express.Router();
const productHelper = require('../helpers/product-helpers');
const orderHelper = require('../helpers/order-helper');
const userHelper = require('../helpers/user-helper');
const { resolve } = require('promise');

var tax= 25;
const verfiylog = (req, res, next)=> {
  if(req.session.userLoggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

router.get('/', verfiylog, async(req, res)=>{
  let user=req.session.user;
  let orders=await orderHelper.getUserOrder(user._id)
  let cartCount = await userHelper.getCartCount(req.session.user._id)
  res.render('orders/orders', { user,  orders, cartCount})
}) 




router.get('/payment', async(req, res)=>{
    let user=req.session.user
    let total= await userHelper.getTotalAmount(user._id)
    let userDetails= await orderHelper.getUserDetails(user._id)
    let finalAmt = total + tax
    res.render('orders/place-order', {total, user:user, finalAmt, userDetails})
  }) 
 

  router.post('/payment/place-order', async(req, res)=>{
    let products = await orderHelper.getCartProductList(req.body.userId)
    let totalPrice = await userHelper.getTotalAmount(req.body.userId)
    let finalAmt = totalPrice + tax
    orderHelper.placeOrder(req.body, products, totalPrice, finalAmt).then((orderId)=>{
      let user = req.body
     if (req.body['payment-method'] =='COD') {
        orderHelper.clearCart(user.userId).then((result)=>{
          res.json(result)
        })
      
     }else {
       orderHelper.generateRazorPay(orderId, finalAmt).then((response)=>{

         res.json({response, user})
       })
     }
    })
  })

  router.get('/view-products/:id', verfiylog, async(req, res)=>{
    let user=req.session.user
    let products=await orderHelper.getOrderProduct(req.params.id)
    res.render('orders/view-ordered-products', {user, products})
  })

router.post('/verify-payment', async(req, res)=>{
  let user = req.session.user
  orderHelper.verifyPayment(req.body).then(()=>{
    orderHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      orderHelper.clearCart(user._id)
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err);
    res.json({status:false})
  })

})
  module.exports = router;