const express = require('express');
const app= express();
const  connectDB = require('./connfig/mongodb');
const { handleSocketEvents } = require('./controllers/socketSever');
require('dotenv').config();
const userRoute=require('./routes/userRoute');
const bodyParser= require('body-parser');
app.use(express.static('public'));
app.use(express.static('uploads'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use('/',userRoute);
app.set('view engine','ejs');
app.set('/views','./views');
connectDB();


const server = app.listen(3000,()=>{
  console.log('Server running');
})

const socket = require('socket.io');
const io= socket(server);


io.on('connection', (socket) => {
  handleSocketEvents(socket);
});