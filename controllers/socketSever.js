const activeUsers ={};
const Message = require('../models/MessageModel');
const User=require('../models/userModel');
const handleSocketEvents = (socket) => {
    socket.on('Login', (userLoggin) => {
        activeUsers[userLoggin] = socket.id;
        console.log(`User ${userLoggin} logged in.`);
    });
    socket.on('offer', (data) => {
        const {targetUserId,offer,caller}=data;
        const targetSocketId=activeUsers[targetUserId];
        socket.to(targetSocketId).emit('offer',{offer,caller});
    });
    // Handle video answer
    socket.on('answer', (data) => {
        const {targetUserId,answer,answercreater}=data;
        const targetSocketId=activeUsers[targetUserId];
        socket.to(targetSocketId).emit('answer', { answer ,answercreater});
    });
    socket.on('candidate',(data)=>{
        const { targetUserId, candidate } = data;
        const targetSocketId=activeUsers[targetUserId];
        socket.to(targetSocketId).emit('candidate',{candidate});
    });

    socket.on('sendMessage', async(data)=>{
        const targetSocketId=activeUsers[data.usertarget];
        const message = new Message({ 
            sender: data.userLoggin, 
            receiver: data.usertarget, 
            content: data.message 
        });
        await message.save();
        socket.to(targetSocketId).emit('receiveMessage',{message});
    });
    socket.on('getMessage',async(data)=>{
        const{targetUser}=data;
        const getavt= await User.findOne({username:targetUser});
        const avat=getavt.avatar
        const messages = await Message.find(
            {
              $or: [
                { receiver: targetUser },
                { sender: targetUser }
              ]
            },
            { sender: 1, content: 1,receiver:1, _id: 0 } // Chỉ lấy trường sender và content, bỏ qua trường _id
          ).sort({ timestamp: 1 });
        socket.emit('loadMess',{messages,targetUser,avat});
    });
    socket.on('deleteMessage',async(data)=>
    {
        const{targetUser,userLoggin}=data;
        await Message.deleteMany({ sender:userLoggin, receiver:targetUser })
        const messages = await Message.find(
            {
              $or: [
                { receiver: targetUser },
                { sender: targetUser }
              ]
            },
            { sender: 1, content: 1,receiver:1, _id: 0 } // Chỉ lấy trường sender và content, bỏ qua trường _id
          ).sort({ timestamp: 1 });
        socket.emit('loadMess',{messages,targetUser});
    });
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        const userId = findUserIdBySocketId(socket.id);
        if (userId) {
            delete activeUsers[userId];
        }
    });
}
function findUserIdBySocketId(socketId) {
    for (const [userId, connectedSocketId] of Object.entries(activeUsers)) {
        if (connectedSocketId === socketId) {
            return userId;
        }
    }
    return null;
}

module.exports = { handleSocketEvents };
