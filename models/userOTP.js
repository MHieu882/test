var mongoose = require('mongoose')
const userOTPSchema =new mongoose.Schema({
    idUser: String,
    OTP: String,
    createdAt: Date,//ngay` tao.
    expiredAt: Date,// tg het han. 1-5p ke tu luc tap.
})

module.exports = mongoose.model('UserOtp',userOTPSchema);