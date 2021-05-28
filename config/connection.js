const mongoClient = require('mongodb').MongoClient
const state = {
    db:null
}
module.exports.connect=function(done) {
    const url = process.ENV.MONGODB_URL
    const dbname= "shoppingCart"

   mongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, data)=>{
       if (err) return done(err)
        state.db=data.db(dbname)
        done()
   }) 
   
}

module.exports.get=function() {
    return state.db
}