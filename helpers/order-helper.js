var Promise = require('promise');
var db=require('../config/connection');
var collections = require('../config/collection');
var ObjectId = require('mongodb').ObjectID;
var dateObj = new Date();
var month = dateObj.getUTCMonth() + 1; //months from 1-12
var day = dateObj.getUTCDate();
var year = dateObj.getUTCFullYear();
var newDate =  day + "-" + month +"-"+ year;
var Crypto = require("crypto");
var Razorpay =require('razorpay');
var instance = new Razorpay({
    key_id:  RAZORPAY_PUBLIC_KEY,
    key_secret: RAZORPAY_SECRET_KEY,
  });
module.exports={
    placeOrder:(order, products, total, finalAmt)=>{
        return new Promise ((resolve, reject)=>{
            let status = order['payment-method']==='COD'? 'Placed':'Pending'
            let orderObj = {
                deliveryDetails:{
                    customerFName:order.fname,
                    customerLName:order.lname,
                    address:order.address,
                    addressLineTwo:order.addressLine2,
                    mobileNo:order.phone,
                    emailID:order.email,
                    city:order.city,
                    state:order.state,
                    pinCode:order.zip,
                    country:order.country
                },
                userId:ObjectId(order.userId),
                date:newDate,
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,
                finalAmount:finalAmt,
                status:status
            }
            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then(async(res)=>{
                orderObj.deliveryDetails.user=ObjectId(order.userId)
                let userObj =orderObj.deliveryDetails
                let userExists = await db.get().collection(collections.USER_DETAILS).findOne({user:ObjectId(order.userId)})
                if (!userExists) {
                    await db.get().collection(collections.USER_DETAILS).insertOne(userObj)
                }

                    resolve(res.ops[0]._id)
                   
            })
        }) 
    },
    getCartProductList:(userId)=>{
        return new Promise(async (resolve, reject)=>{
            let cart =await db.get().collection(collections.USER_CART).findOne({user:ObjectId(userId)})
            resolve(cart.products)
        })
    },
    getUserOrder:(userId)=>{
        return new Promise(async (resolve, reject)=>{
            let orders= await db.get().collection(collections.ORDER_COLLECTION).find({userId:(ObjectId(userId))}).toArray()
            resolve(orders)
        })
    },
    getOrderProduct:(orderId)=>{
        return new Promise (async(resolve, reject)=>{
            let orderItems= await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:ObjectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as: 'product'

                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            resolve(orderItems)
        })
    },
    generateRazorPay:(orderId, totalPrice)=>{
       let stringOrderId= orderId.toString()
        let totalPriceInt= parseInt(totalPrice)
        return new Promise((resolve, reject)=>{
            var options = {
                amount: totalPriceInt * 100,  
                receipt: stringOrderId,
              };
              instance.orders.create(options, function(err, order) {
                if (err) {
                    console.log(err)
                } else {                  
                    resolve(order)
                }
               
              });
        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve, reject)=>{
            
            var hmac = Crypto.createHmac('sha256', 'QPFqfakYAgVwyaOBhILAkHON')
            hmac.update=(details['payment[razorpay_order_id]'] + '|' +  details['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex')
            if (hmac==details['payment[razorpay_signature]']){
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve, reject)=>{
            db.get().collection(collections.ORDER_COLLECTION)
            .updateOne({_id:ObjectId(orderId)},
            {
                $set:{status:'Placed'}
            }
            ).then(()=>{
                resolve()
            })
        })
    },
    changeOrderStatus:(orderId)=>{
        return new Promise((resolve, reject)=>{
            db.get().collection(collections.ORDER_COLLECTION)
            .updateOne({_id:ObjectId(orderId.order)},
            {
                $set:{status:'Shipped'}
            }).then(()=>{
                resolve({orderStatus: true})
            })
        })
    },
    getOrderedItem:(orderId)=>{
        return new Promise(async(resolve, reject)=>{
            let orderedItem=await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:ObjectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            resolve(orderedItem)
            
        })
    },
    cancelOrder:(order)=>{
        return new Promise((resolve, reject)=>{
            db.get().collection(collections.ORDER_COLLECTION)
            .updateOne({_id:ObjectId(order.orderId)},
            {
                $set:{status:'Cancelled'}
            })
        }).then(()=>{  
            resolve(true)
        })
    },
    addToWish:(proId, userId)=>{
        let wishListObj ={
            user: ObjectId(userId),
            products:[ObjectId(proId)]
        }
        return new Promise(async(resolve, reject)=>{
           let wishList = await db.get().collection(collections.WISHLIST).findOne({user:ObjectId(userId)})
           if (wishList) {
            let prodExits = await db.get().collection(collections.WISHLIST)
            .findOne({products:{$in:[ObjectId(proId)]}})
                if (prodExits) {
                        resolve({status:false})
                } else {
                            db.get().collection(collections.WISHLIST)
                            .updateOne({ user: ObjectId(userId) },
                            {
                                $push: { products: ObjectId(proId) }

                            }).then(()=>{
                                db.get().collection(collections.USER_CART)
                                .updateOne({user:ObjectId(userId)},
                                {
                                    $pull: { products: { item: ObjectId(proId) } }
                                })                            
                                resolve({status:true})
                                
                            })
                }
           } else {
                    db.get().collection(collections.WISHLIST)
                    .insertOne(wishListObj).then(()=>{
                        db.get().collection(collections.USER_CART)
                        .updateOne({user:ObjectId(userId)},
                        {
                            $pull: { products: { item: ObjectId(proId) } }
                        })
                        resolve({wishStatus:true})
                        
                    })
           }
           
        })

    },
    getWishListProduct:(userId)=>{
        return new Promise(async(resolve, reject)=>{
           let wishListItem= await db.get().collection(collections.WISHLIST).aggregate([{

                $match: { user: ObjectId(userId) }
            }, {
                $unwind: '$products'
            },
                {
                $project:{
                    item:'$products'
                }
            }, {
                $lookup:{
                    from: collections.PRODUCT_COLLECTION,
                    localField: 'item',
                    foreignField: '_id',
                    as: 'product'
                }
            },{
                $project:{
                    item: 1, _id: 0, product: { $arrayElemAt: ['$product', 0] }
                }
            }
                
            ]).toArray()
            resolve(wishListItem)
            console.log(wishListItem)
        })
    },
    removeWish:(proId, userId)=>{
        return new Promise(async(resolve, reject)=>{
            await db.get().collection(collections.WISHLIST)
            .updateOne({user:ObjectId(userId)},{
                $pull: { products: {$in:[ObjectId(proId)]}  }
            })
            resolve(true)
        })
       
    },
    getUserDetails:(userId)=>{
        return new Promise (async(resolve, reject)=>{
            await db.get().collection(collections.USER_DETAILS).findOne({
              user:ObjectId(userId)
          }).then((res)=>{
              resolve(res)

          })

        })
        
    },
    clearCart:(userId)=>{
        return new Promise (async(resolve, reject)=>{
                    await db.get().collection(collections.USER_CART).removeOne({user:ObjectId(userId)}).then(()=>{
                        resolve({status:true})
                    })
        })
    }

}