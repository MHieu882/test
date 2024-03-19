const checkLogin = async(req, res,next)=>{
        try {
            if(req.session.user){
               next();
            }
            else{
                return res.redirect('login');
            }
        } catch (error) {
            console.log(error.message);
       }    
};

const checkLogout = async(req, res,next)=>{

    try {
        if(req.session.user){
            return res.redirect('/');
        }else{
            next();
        }
    } catch (error) {
        console.log(error.message);
    }

}

module.exports = {
    checkLogin,
    checkLogout
}