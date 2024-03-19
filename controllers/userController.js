
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const session = require('express-session');
const nodemailer = require("nodemailer");
const UserOTP=require('../models/userOTP');
const {OAuth2Client }=require('google-auth-library');
const loadIndex=async(req,res)=>{
    try {
        const users = await User.find();
        const  loggin=await User.findOne({username:req.session.user})
        res.render('index',{ username: req.session.user, users,loggin });
    } catch (error) {
        console.log(error.message);
        
    }
}
const loadlogin= async(req,res)=>{
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message);
    }
}
const login=async (req,res)=>{
        try {
            const userData= await User.findOne({username:req.body.username});
            if(userData){
                const checkPass= await bcrypt.compare(req.body.password,userData.password)
                if(checkPass){
                    req.session.user=req.body.username;//
                    res.redirect('/');
                }
                else{
                    res.render('login',{message:'Password is Incorrect!'});
                }
            }
            else{
                res.render('login',{message:'Username is Incorrect!'})
            }
        } catch (error) {
            console.log(error.message);
        }
}
const loadRegister = async(req,res)=>{
    try {
        res.render('register');
    } catch (error) {
        console.log(error.message);
    }
};
const register= async(req,res)=>{
    try {
        const userData= await User.findOne({username:req.body.username});
        const email=await User.findOne({username:req.body.email});;
        if(userData){
            res.render('register',{success:false,message:'Username is already exists!'})
        }
        else if (email){
            res.render('register',{success:false,message:'Email is already exists!'})
        }
        else{
            const passwordHash= await bcrypt.hash(req.body.password,10);
            const users = new User({
                name: req.body.name,
                email: req.body.email,
                username:req.body.username,
                password: passwordHash,
                avatar:'https://www.pikpng.com/pngl/m/80-805523_default-avatar-svg-png-icon-free-download-264157.png',
            })
            await users.save();
            res.render('register',{ success:true, message: 'Your Registration has beend Completed!' });
        }
        
    } catch (error) {
        console.log(error.message);
    }
};
const logout = async(req, res) =>{
    try {
        req.session.destroy();
        return res.redirect('login');
        
    } catch (error) {
        console.log(error.message);
    }
};
const changePassword= async(req,res)=>{
    try {
        const userData= await User.findOne({username:req.session.user})
        const checkPass= await bcrypt.compare(req.body.oldpassword,userData.password)
        if(!checkPass){
            res.render('ChangePass',{message:'Password is Incorrect!'});
        }else if(req.body.newpassword!=req.body.newpassword2){
            res.render('ChangePass',{message:'New Password 2 is not Same!'})
        }else{
            const passwordHash= await bcrypt.hash(req.body.newpassword2,10);
    
            userData.password = passwordHash;
            await userData.save();
            req.session.destroy();
            res.render('login',{message:'Password updated successfully'});
        }
    } catch (error) {
        console.log(error.message);
    }
}
const loadChangePassword= async(req,res)=>{
    try {
        res.render('ChangePass');
    } catch (error) {
        console.log(error.message);
    }
}

const loadResetPassword= async(req,res)=>{
    try {
        res.render('ResetPassword');
    } catch (error) {
        console.log(error.message);
    }
}
const resetPassword= async(req,res)=>{
    try {
       const mail=req.body.email;
       const userData= await User.findOne({email:mail});
       if(!userData){
        res.render('ChangePass',{message:'Email is not  registed !'});
       }
       else{
          sendOtpVerificationEmail(mail)
        return res.render('OtpPage', { email: mail });
      
       }
    } catch (error) {
        console.log(error.message);
    }
}
const loadOtpPage= async(req,res)=>{
    try {
        res.render('OtpPage');
    } catch (error) {
        console.log(error.message);
    }
}
const OtpPage=async(req,res)=>{
    let { email, otp, password, password2 } = req.body;
    const data= await UserOTP.findOne({ idUser: email });
    const DateNow = new Date().toString();
    if (Date.parse(data.expiredAt) < Date.parse(DateNow)) {
        UserOTP.deleteMany({ idUser: email });
        return res.render('ResetPassword', { message: 'Your OTP already expried Please send request again'});
    } else if(otp === data.OTP) {
        if (password === password2) {
            const userData= await User.findOne({email:email})
            const passwordHash= await bcrypt.hash(password,10);
            userData.password = passwordHash;
            await userData.save();
            UserOTP.deleteMany({ idUser: email });
            return res.render('login',{message:'Your Password updated successfully'});
        }
        else {
            console.log('2 password must be the same');
            return res.render('OtpPage', { email: email });
            }
        } else {
            return res.render('OtpPage', {  email: email,message: 'Your OTP is wrong' });
        }
}
const profile= async(req,res)=>{
    let {name} = req.body;
    const avatar = req.file ? '/uploads/' + req.file.filename : '';
    const  loggin=await User.findOne({username:req.session.user});
    loggin.name = name;
    loggin.avatar = avatar;
    await loggin.save();
    return res.redirect('/');
}

async function sendOtpVerificationEmail(email) {
    try {
      const otp = `${Math.floor(10000 + Math.random() * 90000)}`;
      const createOtp= await new UserOTP({
        idUser: email,
        OTP: otp,
        createdAt: Date.now(),
        expiredAt: Date.now() + 300000,
      })
      createOtp.save();
      //transporter
      // Khởi tạo OAuth2Client với Client ID và Client Secret 
        const myOAuth2Client = new OAuth2Client(
            process.env.GOOGLE_MAILER_CLIENT_ID,
            process.env.GOOGLE_MAILER_CLIENT_SECRET
        )
        myOAuth2Client.setCredentials({
            refresh_token:  process.env.GOOGLE_MAILER_REFRESH_TOKEN
        })
        const myAccessTokenObject = await myOAuth2Client.getAccessToken()
        const myAccessToken = myAccessTokenObject?.token
        let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user:  process.env.ADMIN_EMAIL_ADDRESS,
            clientId:  process.env.GOOGLE_MAILER_CLIENT_ID,
            clientSecret:  process.env.GOOGLE_MAILER_CLIENT_SECRET,
            refresh_token:  process.env.GOOGLE_MAILER_REFRESH_TOKEN,
            accessToken: myAccessToken
        },
      });
  
      const  info = await transporter.sendMail({
        from: 'le927011@gmail.com>', // sender address
        to: email, // list of receivers
        subject: "Reset Password", // Subject line
        html: `<p>Here is your OTP to refresh your password: <b>${otp}</b> </p>
                <p>This code expires in <b>5 min</b> </p>`
    });
    console.log("Message sent: %s", info.messageId);
    }catch (error) {
        console.log(error.message);
    }
  };

module.exports={
    loadIndex,
    loadlogin,
    loadRegister,
    login,
    register,
    logout,
    changePassword,
    loadChangePassword,
    loadResetPassword,
    resetPassword,
    OtpPage,
    loadOtpPage,
    profile,
}