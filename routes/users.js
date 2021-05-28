
const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const productHelper = require('../helpers/product-helpers');
const userHelper = require('../helpers/user-helper');
const orderHelper = require('../helpers/order-helper');
const { resolve } = require('promise');
var tax = 25;
const verfiylog = (req, res, next)=> {
  if(req.session.userLoggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/',verfiylog, async (req, res, next)=> {
  let user = req.session.user
   let cartCount = null
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  res.render('index', {user, cartCount});
});


router.get('/product', verfiylog, async (req, res, next)=> {
    let cartCount = null
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  productHelper.getAllProduct().then(async (products) => {
    let user = req.session.user
    productHelper.getAllAccessories().then((accessories)=>{
      res.render('user/product', { accessories, products, user, cartCount });
    })
    
  });

});

router.get('/login', function (req, res) {
  if (req.session.user) {
    res.redirect("/")
  }
 else res.render('user/login')
req.session.status=false 
});
router.post('/login', body('email')
                      .not().isEmpty().withMessage('Email empty')
                      .normalizeEmail(),
                     body('password')
                     .not().isEmpty().withMessage('Password empty'), 
                      function (req, res) {
                        const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                      const alert = errors.array()

                          if (alert!='undefined') {

                            res.render('user/login', {alert});
                              } 
                            else {
                              res.render('user/login'); 
                            } 
                          } 
                          else {
                            userHelper.doLogin(req.body).then((login) => {
                              if (login.status) {  
                                req.session.user=login.user
                                req.session.user.password=null;
                                req.session.userLoggedIn= true
                                res.redirect('/')
                              } else {
                                let err = login
                                console.log(err)
                                res.render('user/login', {err})
                              }
                            })
                          }

});

router.get('/signup', function (req, res) {
  res.render('user/sign-up');
});
router.post('/signup', body('email')
                          .trim().toLowerCase()
                          .isEmail().withMessage('Not a valid Email')
                          .normalizeEmail()
                            .not().isEmpty(),
                      body('fullname')
                          .toUpperCase()
                          .not().isEmpty().withMessage('Name cannot be empty'),
                      body('password')
                         .not().isEmpty().withMessage('Password cannot be empty'),
                          function (req, res) {
  
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const alert = errors.array()

      if (alert!='undefined') {

        res.render('user/sign-up', {alert});
      }
       else {
        res.render('user/sign-up');
      }
  
    } else {
      userHelper.doSignup(req.body).then((response) => {
      req.session.user=response
      req.session.user.password=null;
      req.session.userLoggedIn=true
      res.redirect('/')
    })
    }

  

});
router.get('/cart', verfiylog, async(req, res, next)=>{
  let wishListCount = null;
  let user=req.session.user
  let product = await userHelper.getCartProduct(req.session.user._id)
  if (product.length>0){
  let total=await userHelper.getTotalAmount(req.session.user._id)
  wishListCount = await userHelper.getCartCount(user._id)
  let finalAmt = total + tax
  res.render('user/user-cart', { product, finalAmt, total, user, wishListCount })
  }
  else {
    res.render('user/user-cart', { product, user:req.session.user })
  } 

})

router.get('/wish-list',verfiylog, async(req, res)=>{
  let user =req.session.user;
  let cartCount = await userHelper.getCartCount(req.session.user._id)
  let wishList = await orderHelper.getWishListProduct(user._id)

  res.render('orders/wishlist', { wishList, user, cartCount })
})


router.post('/add-to-wish/', (req, res)=>{
  let user=req.session.user;
   orderHelper.addToWish(req.body.proId, user._id).then((result)=>{

    res.json(result)
  })
  })
router.post('/remove-wishlist-item/', (req, res)=>{
  let user=req.session.user;
  console.log(req.body)
  orderHelper.removeWish(req.body.proId, user._id).then((result)=>{
    res.json(result)
  })
})



router.get('/add-to-cart/:id', (req, res)=>{
  userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{ 
    res.json({status:true})
  })
})
router.get('/add-to-cartFromWish/:id', (req, res)=>{
  userHelper.addToCartFromWish(req.params.id,req.session.user._id).then(()=>{ 
    res.json({status:true})
  })
})


router.post('/change-product-quantity', (req, res)=>{
  userHelper.changeProductQuantity((req.body)).then(async(response)=>{
    response.totalAmount =await userHelper.getTotalAmount(req.body.user)
    response.finalAmt= response.totalAmount + tax 
    res.json(response)
    
    
  })
})

router.post('/remove-item/',async (req,res,next)=>{
let proId =req.body.proId
  productHelper.removeCartItem(req.session.user._id,proId).then((result)=>{
    res.json(result)
  })
})

router.get('/contact',verfiylog, (req, res)=>{
  let user=req.session.user
  res.render('user/contact', {user})
})

router.get('/unreachable', verfiylog, (req, res)=>{
  let user=req.session.user
  res.render('user/unreachable', {user})
})

router.get('/logout', function(req, res) {
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect('/login')
})
module.exports = router;
