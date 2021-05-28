var Promise = require('promise');
var db = require('../config/connection');
var collections = require('../config/collection');
var bcrypt = require('bcrypt');
var ObjectId = require('mongodb').ObjectID;
const collection = require('../config/collection');

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collections.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.ops[0])
            })
        })

    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            response.ErrMsg =null
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log("Login Success");
                        response.user = user
                        response.status = true
                        response.ErrMsg =null
                        resolve(response)
                    } else {
                        console.log("Login failed: Password");
                        response.status = false
                        response.ErrMsg ="invalid Password"
                        resolve(response)
                    }
                })
            } else {
                console.log("Login failed : Email");
                response.status = false
                response.ErrMsg ="invalid Email"
                resolve(response)
            }
        })
    },
    addToCart: (proID, userID) => {
        let prodObj = {
            item: ObjectId(proID),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collections.USER_CART).findOne({ user: ObjectId(userID) })
            if (userCart) {
                let prodExists = userCart.products.findIndex(product => product.item == proID)
                if (prodExists != -1) {
                    db.get().collection(collections.USER_CART)
                        .updateOne({ user: ObjectId(userID), 'products.item': ObjectId(proID) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }).then(() => {
                                resolve()
                            })
                } else {
                    db.get().collection(collections.USER_CART)
                        .updateOne({ user: ObjectId(userID) },
                            {
                                $push: { products: prodObj }

                            }
                        ).then((response) => {
                            resolve()
                        })
                }

            } else {
                let cartObj = {
                    user: ObjectId(userID),
                    products: [prodObj]
                }
                db.get().collection(collections.USER_CART).insertOne(cartObj).then((response) => {
                    resolve(response)
                })
            }

        })
    },
    getCartProduct: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collections.USER_CART).aggregate([{

                $match: { user: ObjectId(userId) }
            }, {
                $unwind: '$products'
            }, {
                $project: {
                    item: '$products.item',
                    quantity: '$products.quantity'
                }
            },
            {
                $lookup: {
                    from: collection.PRODUCT_COLLECTION,
                    localField: 'item',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $project: {
                    item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                }
            }


            ]).toArray()
            resolve(cartItems)
        }
        )
    },
    getCartCount: (userID) => {
        return new Promise(async (resolve, reject) => {
            let count = 0;
            let cart = await db.get().collection(collections.USER_CART).findOne({ user: ObjectId(userID) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collections.USER_CART)
                    .updateOne({ _id: ObjectId(details.cart) },
                        {
                            $pull: { products: { item: ObjectId(details.product) } }
                        }).then(() => {
                            resolve({ removeProduct: true })
                        })
            } else {
                db.get().collection(collections.USER_CART)
                    .updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }).then((res) => {
                            resolve({status:true})
                        })
            }
        })
    },
    removeCartItem: (item) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.USER_CART)
                .updateOne({ user: ObjectId(item.user) },
                    {
                        $pull: { products: { item: ObjectId(item.product) } }
                    }

                ).then(() => {

                    resolve({ removeProduct: true })

                })
        })
    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collections.USER_CART).aggregate([{

                $match: { user: ObjectId(userId) }
            }, {
                $unwind: '$products'
            }, {
                $project: {
                    item: '$products.item',
                    quantity: '$products.quantity'
                }
            },
            {
                $lookup: {
                    from: collection.PRODUCT_COLLECTION,
                    localField: 'item',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $project: {
                    item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                        }
                    },
                {
                    $group: {
                        _id:null,
                        total:{$sum:{$multiply:[ '$quantity','$product.price' ]}}
                    }
                }


            ] ).toArray()
            resolve(total[0].total)
           
           

        })
    },
    addToCartFromWish: (proID, userID) => {
        let prodObj = {
            item: ObjectId(proID),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collections.USER_CART).findOne({ user: ObjectId(userID) })
            if (userCart) {
                let prodExists = userCart.products.findIndex(product => product.item == proID)
                if (prodExists != -1) {
                    db.get().collection(collections.USER_CART)
                        .updateOne({ user: ObjectId(userID), 'products.item': ObjectId(proID) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }).then(async() => {

                                resolve()
                            })
                } else {
                    db.get().collection(collections.USER_CART)
                        .updateOne({ user: ObjectId(userID) },
                            {
                                $push: { products: prodObj }

                            }
                        ).then( async() => {
                            await db.get().collection(collections.WISHLIST).updateOne({user:ObjectId(userID)},
                            { $pull:{ products: {$in:[ObjectId(proId)]}
                         }}).then(()=>{
                             resolve({status:true})
                         })
                            resolve()
                        })
                }

            } else {
                let cartObj = {
                    user: ObjectId(userID),
                    products: [prodObj]
                }
                db.get().collection(collections.USER_CART).insertOne(cartObj).then(async (response) => {
                    await db.get().collection(collections.WISHLIST).updateOne({user:ObjectId(userID)},
                    { $pull:{ products: {$in:[ObjectId(proId)]}
                 }}).then(()=>{
                     resolve({status:true})
                 })
                    resolve(response)
                })
            }

        })

    },
    getWishListCount:(userId)=> {
        return new Promise(async (resolve, reject) => {
            let count = 0;
            let wishlist = await db.get().collection(collections.WISHLIST).findOne({ user: ObjectId(userId) })
            if (cart) {
                count = wishlist.products.length
            }
            resolve(count)
        })
    }
}