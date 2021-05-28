var db=require('../config/connection');
var collections = require('../config/collection');
var bcrypt = require('bcrypt');
module.exports = {
    doLogin:(userData)=> {
         return new Promise(async (resolve, reject)=>{
             let loginStatus = false
             let response = {}
             let user = await db.get().collection(collections.ADMIN).findOne({email:userData.email})
             if (user) {
                    bcrypt.compare(userData.password,user.password).then((status)=> {
                            if (status) {
                                console.log("Admin Login Success");
                                response.user=user
                                response.status=true
                                resolve(response)
                            } else {
                                console.log("Admin Login failed: Password");
                                resolve({status:false})
                            }
                    })
             } else {
                console.log("Admin Login failed : Email");
                resolve({status:false})
             }
         })
    },
    getAllOrderList:()=> {
        return new Promise(async(resolve, reject)=>{
            let order=await db.get().collection(collections.ORDER_COLLECTION).find().toArray()
            
            resolve(order)
                })
    }
}