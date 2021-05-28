var Promise = require('promise');
var db=require('../config/connection');
var collections = require('../config/collection');
var ObjectId = require('mongodb').ObjectID;

module.exports={

    addProduct:(product, cb)=> {
        product.price=parseInt(product.price)
        db.get().collection(collections.PRODUCT_COLLECTION).insertOne(product).then((data)=> {
            cb(data.ops[0]._id);
        })
    },

    getAllProduct:()=> {
        return new Promise(async(resolve, reject)=>{
            let products=await db.get().collection(collections.PRODUCT_COLLECTION).find({category:'SmartPhone'}).toArray()
            resolve(products)
        })
    },

    removeCartItem:(user,product)=>{
            return new Promise(async (resolve)=>{
                let itemRemoved=await db.get().collection(collections.USER_CART)
                    .updateOne({user:ObjectId(user)},{$pull:{products:{item:ObjectId(product)} }})
                if(itemRemoved){
                    
                    resolve({status:true})
                }
            })
    },

    getProductDetails:(prodID) => {
        return new Promise(async(resolve, reject)=>{
          await db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id: ObjectId(prodID)}).then((product)=>{
                resolve(product)
            
            })
        })
    },

    updateProduct:(proID, proDetails)=> {
        return new Promise((resolve, reject)=>{
            let price = parseInt(proDetails.price)
            db.get().collection(collections.PRODUCT_COLLECTION)
            .updateOne({_id:ObjectId(proID)},{
                $set:{
                    itemName:proDetails.itemName,
                    description:proDetails.description,
                    price:price,
                    category:proDetails.category
                }
            }).then(()=>{
                resolve()
            })
        })
    },
    getAllAccessories:()=> {
        return new Promise(async(resolve, reject)=>{
            let products=await db.get().collection(collections.PRODUCT_COLLECTION).find({category:{$ne:"SmartPhone"}}).toArray()
            resolve(products)
        })
    }
}