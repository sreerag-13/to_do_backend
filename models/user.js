const Mongoose=require("mongoose")
const userschema=Mongoose.Schema({
    name:{
        type:String,
        required:true
    },
      phone:{
        type:String,
        required:true
    },
      email:{
        type:String,
        required:true
    },
      password:{
        type:String,
        required:true
    },
      gender:{
        type:String,
        required:true
    },
      address:{
        type:String,
        required:true
    }
})
var UserModel=Mongoose.model("users",userschema)
module.exports=UserModel