const Cors=require("cors")
const Bcrypt=require("bcrypt")
const Express=require("express")
const Jwt=require("jsonwebtoken")
const Mongoose=require("mongoose")
let app=Express()
app.get("/",(req,res)=>{
    res.send("heello")

})
app.listen(3030,()=>{
    console.log("server start")
})