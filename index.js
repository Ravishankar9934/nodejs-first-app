import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
mongoose
    .connect("mongodb://127.0.0.1:27017",{
        dbName:"backend",
    })
    .then(()=>console.log("Databse connected"))
    .catch((e)=> console.log(e));
    
    const userSchema = new mongoose.Schema({
        name:String,
        email:String,
        password:String,
    });

    const User = mongoose.model("User", userSchema);

const app = express();
//MIDDLEWARE

//middleware for static handling
app.use(express.static(path.join(path.resolve(),"public")));

//middleware for post -> this is accessing data from form
app.use(express.urlencoded({extended:true}));

//middleware for cookie-parser
app.use(cookieParser());

// setting up view engine for ejs
app.set("view engine", "ejs" );

//self made handler
const isAuthenticate = async (req,res,next)=>{
    const {token} = req.cookies;
    if(token){

        const decoded = jwt.verify(token, "sjsskslslkshs");
        // console.log(decoded)
        req.user = await User.findById(decoded._id);

        next();
    }else{
        res.redirect("/login");
    }
};

app.get("/", isAuthenticate, (req,res)=>{
    // console.log(req.user);
    res.render("logout",{name:req.user.name});
});

app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("/register", (req,res)=>{
    // console.log(req.user);
    res.render("register");
});

app.post('/login',async (req,res)=>{
    const {email,password} = req.body;
    let user = await User.findOne({email});
    if(!user) return res.redirect("/register");

    const isMatch = await bcrypt.compare(password,user.password);

    if(!isMatch) return res.render("login",{email, message:"Incorrect Passeword"});

    const token = jwt.sign({_id:user._id}, "sjsskslslkshs");

    res.cookie("token", token,{
        httpOnly: true,
        expires:new Date(Date.now()+60*1000),
    });
    res.redirect("/");

});

app.post("/register",async (req,res)=>{

    console.log(req.body)

    const {name,email,password} = req.body;

    let user = await User.findOne({email});
    if(user){
        // return console.log("Register first!");
        return res.redirect("/login");
    }

    const hashedPassword = await bcrypt.hash(password,10)

    user = await User.create({
        name,
        email,
        password:hashedPassword,
    });

    const token = jwt.sign({_id:user._id}, "sjsskslslkshs");
   

    res.cookie("token", token,{
        httpOnly: true,
        expires:new Date(Date.now()+60*1000),
    });
    res.redirect("/");
})

app.get("/logout",(req,res)=>{
    res.cookie("token", null,{
        httpOnly: true,
        expires:new Date(Date.now()),
    });
    res.redirect("/");
});

app.listen(5000,()=>{
    console.log("Server is working...");
});