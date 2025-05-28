const Cors=require("cors")
const Bcrypt=require("bcrypt")
const Express=require("express")
const Jwt=require("jsonwebtoken")
const Mongoose=require("mongoose")
const UserModel=require("./models/user")
let app=Express()
app.use(Express.json())
app.use(Cors())

Mongoose.connect("mongodb+srv://sreerag:sreerag@cluster0.onuj57g.mongodb.net/TODdb?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("MongoDB connection error:", error));

app.post("/signup",async(req,res)=>{
    let input=req.body
    let hashedpassword=Bcrypt.hashSync(req.body.password,10)
    console.log(hashedpassword)
    req.body.password=hashedpassword
    console.log(input)
    UserModel.find({email:req.body.email}).then((items)=>{
  if(items.length>0){
        res.json({"status":"email is already exist"})
    }else{
        let result=new UserModel(input)
         result.save()
        res.json({"status":"success"})
    }
    }).catch((error)=>{

    })
})
app.post("/signin",async(req,res)=>{
    let input=req.body
    let result=UserModel.find({email:req.body.email}).then(
        (items)=>{
 
        if (items.length>0) {
            const pass=Bcrypt.compareSync(req.body.password,items[0].password)
            if (pass) {
                Jwt.sign({email:req.body.email},"todoapp",{expiresIn:"1d"},
                    (error,token)=>{
                if (error) {
                    res.json({"status":"error","errorMessage":error})
                } else {
                    res.json({"status":"success","token":token,"userId":items[0]._id})
                }
            })
              
            } else {
                res.json({"status":"incorrect password"})
            }
        } else {
            res.json({"status":"invalid email"})
        }
    }).catch()
})


app.listen(3030,()=>{
    console.log("server start")
})