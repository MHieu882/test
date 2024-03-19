// userRoute.js
const express = require('express');
const router = express();
const session = require('express-session');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const multer  = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // cb(null, 'public/images');
        cb(null,'public/uploads')
    },
    filename: function (req, file, cb) {
      // cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
      cb(null,Date.now()+'.jpg')
    },
  });
  
const upload = multer({ storage: storage })
  // Đối tượng lưu trữ các kết nối
  
router.use(session({ secret: 'process.env.SESSION_SECRET' ,cookie: { maxAge: 600000 }}));

router.get('/', auth.checkLogin, userController.loadIndex);

router.get('/login', auth.checkLogout, userController.loadlogin);
router.post('/login', userController.login);

router.get('/register', auth.checkLogout, userController.loadRegister);
router.post('/register', userController.register);

router.get('/logout',auth.checkLogin,userController.logout);

router.get('/changePassword', auth.checkLogin, userController.loadChangePassword);
router.post('/changePassword', userController.changePassword);

router.get('/resetPassword', auth.checkLogout, userController.loadResetPassword);
router.post('/resetPassword', userController.resetPassword);

router.get('/OtpPage', auth.checkLogout, userController.loadOtpPage);
router.post('/OtpPage', userController.OtpPage);

router.post('/profile',auth.checkLogin,upload.single('avatar'),userController.profile)
module.exports = router;
