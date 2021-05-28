var express = require('express');
const { resolve } = require('promise');

var router = express.Router();
var adminHelper = require('../helpers/admin-helper');
const orderHelper = require('../helpers/order-helper');
var productHelper = require('../helpers/product-helpers');
const verfiylog = (req, res, next)=> {
  if( req.session.adminLoggedIn) {
    next()
  } else {
    res.redirect('/admin/login')
  }
}
/* GET admin Login. */
router.get('/login', function(req, res) {
  if ( req.session.adminLoggedIn) {
    res.redirect("/")
  }
 else {
  res.render('admin/admin-login', {"loginErr":req.session.adminLoginErr})
  req.session.adminLoginErr=false 
 }

});
/* Post admin Login. */
router.post('/login', function(req, res) {
  adminHelper.doLogin(req.body).then((response)=> {
    if (response.status) {
      let admin=req.session.admin
      req.session.admin=response.user
      req.session.adminLoggedIn=true
      res.redirect('/admin')
    } else { 
      res.redirect('/admin/login')
    }
  })
});

router.get('/', verfiylog, function(req, res) {
  let admin=req.session.admin
  productHelper.getAllProduct().then((products)=> {
    res.render('admin/dashboard', { admin, products})
  });
  
 });

 router.get('/add-product',verfiylog, function(req, res) {
  let admin=req.session.admin
   res.render('admin/add-product', {admin})
 });
router.post('/add-product', function (req, res) {

  productHelper.addProduct(req.body, (id)=>{

    let image = req.files.image
    image.mv('./public/images/product/'+id+'.jpg', (err, done)=>{
      if(!err) {
        res.render('admin/add-product') }
        else {
          console.log(err)
        }
      
    })

  })
})


router.get('/product', verfiylog, (req, res) =>{
  let admin=req.session.admin
  productHelper.getAllProduct().then((products)=>{
    res.render('admin/view-products', {admin, products})
  });
  })
// Get user orders list 
router.get('/order-list', verfiylog, async(req, res) =>{
  let admin=req.session.admin
  adminHelper.getAllOrderList().then((orderList)=>{
    res.render('admin/orders-list', {admin, orderList})
  })
});

router.get('/delete-product/:id', (req, res) => {
  let prodId = req.params.id
  productHelper.deleteProduct(prodId).then(()=>{
    res.redirect('/')
  })
  
});
router.get('/edit-product/:id', async (req, res) => {
  let admin=req.session.admin
  let product = await productHelper.getProductDetails(req.params.id)
  res.render('admin/edit-product', {admin, product })
});

router.post('/edit-product/:id',  (req, res) => {
  productHelper.updateProduct(req.params.id, req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.image) {
      let image = req.files.image
      image.mv('./public/images/product/'+req.params.id+'.jpg')
    }
  })
})
router.post('/change-order-status', (req, res)=>{
  orderHelper.changeOrderStatus((req.body)).then((res)=>{
    resolve(res)
  })
})


router.post('/cancel-order', (req, res)=>{
  orderHelper.cancelOrder((req.body)).then((result)=>{
    res.json(result)
  }) 
})

router.get('/view-ordered-item/:id', async(req, res)=>{
  let admin=req.session.admin
  let products =  await orderHelper.getOrderedItem((req.params.id))
  res.render('admin/view-ordered', {admin, products})

})
router.get('/logout', (req, res)=> {
  req.session.admin=null
  req.session.adminLoggedIn=false
  res.redirect('/admin/login')
})
module.exports = router;
