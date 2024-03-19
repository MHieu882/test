var socket = io();
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
let peerConnection;
const config={iceServers: [
  {
    urls: "stun:stun.relay.metered.ca:80",
  },
  {
    urls: "turn:global.relay.metered.ca:80",
    username: "028872b2c64baf9d9e5317c4",
    credential: "6KQet7Vcl1w7sINF",
  },
  {
    urls: "turn:global.relay.metered.ca:80?transport=tcp",
    username: "028872b2c64baf9d9e5317c4",
    credential: "6KQet7Vcl1w7sINF",
  },
  {
    urls: "turn:global.relay.metered.ca:443",
    username: "028872b2c64baf9d9e5317c4",
    credential: "6KQet7Vcl1w7sINF",
  },
  {
    urls: "turns:global.relay.metered.ca:443?transport=tcp",
    username: "028872b2c64baf9d9e5317c4",
    credential: "6KQet7Vcl1w7sINF",
  },
],}

socket.emit('Login', userLoggin);

async function callUser() {
  var Username = document.getElementById('target');
  const targetUsername = Username.value.trim();
  var userConfirmed = confirm('Bạn muốn bắt đầu cuộc gọi video không?');
  if (userConfirmed && targetUsername) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideo.srcObject = stream;
      
      document.getElementById('videoContainer').style.display = 'flex';
      document.getElementById('chat-container').style.display = 'none';
      peerConnection= new RTCPeerConnection(config);
      peerConnection.ontrack = OnTrackFunction;
      stream.getTracks().forEach((track) => {peerConnection.addTrack(track, stream);});
      offer = await peerConnection.createOffer();
      socket.emit('offer', {
        targetUserId: targetUsername,
        offer,
        caller: userLoggin,
      });
      peerConnection.onicecandidate = (event) => handleIceCandidate(event, targetUsername);

      await peerConnection.setLocalDescription(offer);
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  }
}

socket.on('offer', async (data) => {
  const accept = confirm(`Có cuộc gọi từ ${data.caller}. Chấp nhận?`);
  if (accept) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localVideo.srcObject = stream;
      localVideo.onloadeddata = (e) => {
        localVideo.play();
      };
      document.getElementById('videoContainer').style.display = 'flex';
      document.getElementById('chat-container').style.display = 'none';
      peerConnection= new RTCPeerConnection(config);
      peerConnection.ontrack = OnTrackFunction;
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      peerConnection.onicecandidate = (event) =>
      handleIceCandidate(event, data.caller);
      socket.emit('answer', {
        targetUserId: data.caller,
        answer,
        answercreater: userLoggin,
      });

    
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  }
});

socket.on('candidate', (data) => {
  const iceCandidate = new RTCIceCandidate(data.candidate);
  peerConnection.addIceCandidate(iceCandidate)
});

socket.on('answer', async (data) => {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
  } catch (error) {
    console.error('Lỗi khi nhận câu trả lời:', error);
  }
});

const chatMessages = document.getElementById('card-body msg_card_body');

socket.on('receiveMessage', (data) => {
  const div = document.createElement('div')
  const container = document.createElement('div');;
  let targetUserId =document.getElementById('target');
  let usertarget=targetUserId.value.trim();
  console.log(usertarget);
  if(data.message.sender==usertarget && data.message.receiver==userLoggin){
    div.classList.add('msg_cotainer');
    container.classList.add('d-flex', 'justify-content-start', 'mb-4');
    div.innerHTML = `${data.message.content}`;
    container.appendChild(div);
    chatMessages.appendChild(container)
  }
  
});
function handleIceCandidate(event, targetUserId) {
  if (event.candidate !== null) {
    console.log('gui candidate');
    socket.emit("candidate", { targetUserId, candidate: event.candidate });
  }
}
function OnTrackFunction(event) {
  remoteVideo.srcObject = event.streams[0];
  remoteVideo.onloadeddata = function (e) {
    remoteVideo.play();
  }
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    let targetUserId =document.getElementById('target');
    let usertarget=targetUserId.value.trim();
    // Lấy giá trị từ textarea
    const message = messageInput.value.trim();
    if (message &&usertarget) {
      const div = document.createElement('div');
      const container=document.createElement('div');

      div.classList.add('msg_cotainer_send');
      container.classList.add('d-flex','justify-content-end', 'mb-4');

      div.innerHTML = `${message}`;
      container.appendChild(div);
      chatMessages.appendChild(container);
      socket.emit('sendMessage',{message,usertarget,userLoggin})
        // Xóa nội dung của textarea sau khi gửi tin nhắn
      messageInput.value = '';
    }
}
function showChatContainer(targetUser) {
  var Username =document.getElementById('target').value.trim();
  if(targetUser=='delete'){
    socket.emit('deleteMessage',{targetUser:Username,userLoggin})
  }else{
  const targetElement = document.getElementById(targetUser);
  document.getElementById('message-container').style.display = 'block';
  
  const currentActiveElement = document.querySelector('.active');
  //set target
  document.getElementById('target').innerHTML = `${targetUser}`;
  if (currentActiveElement) {
      // Remove 'active' class from the current active element
      currentActiveElement.classList.remove('active');
  }
  // Add 'active' class to the target element
  if (targetElement) {
      targetElement.classList.add('active');
  }
  socket.emit('getMessage', { targetUser });
  }
}
socket.on("loadMess", async(data) => {
  const messages=data.messages;
  chatMessages.innerHTML = '';
  document.getElementById('user_info-chat').innerHTML = `<span> ${data.targetUser}  </span>`;
 
//avt
  document.getElementById('avt-chat').src=data.avat;
  //
  messages.forEach((message) => {
    const div = document.createElement('div');
    const container = document.createElement('div');
    if(message.sender==userLoggin && message.receiver==data.targetUser){
      div.classList.add('msg_cotainer_send');
      container.classList.add('d-flex', 'justify-content-end', 'mb-4');
      div.innerHTML = `${message.content}`;
    }else if(message.sender==data.targetUser && message.receiver==userLoggin){
      div.classList.add('msg_cotainer');
      container.classList.add('d-flex', 'justify-content-start', 'mb-4');
      div.innerHTML = `${message.content}`;
    }
    container.appendChild(div);
    chatMessages.appendChild(container)
   
  });
});


//click to show
document.addEventListener('DOMContentLoaded', function() {
  // menu action
  document.getElementById('action_menu_btn').addEventListener('click', function() {
      var actionMenu = document.querySelector('.action_menu');
      if (actionMenu.style.display === 'none' || actionMenu.style.display === '') {
          actionMenu.style.display = 'block';
      } else {
          actionMenu.style.display = 'none';
      }
  });
  // menu user
  document.getElementById('user-menu-btn').addEventListener('click', function() {
    var userMenu = document.querySelector('.user-menu');
    if (userMenu.style.display === 'none' || userMenu.style.display === '') {
        userMenu.style.display = 'block';
    } else {
        userMenu.style.display = 'none';}
  });
});
//create group
function showForm(input) {
  if(input===5){
    document.getElementById('formprofileContainer').style.display = 'block';
  }
  else{
    document.getElementById('formContainer').style.display = 'block';
  }
  document.getElementById('overlay').style.display = 'block';
}

// Function to hide the form overlay
function hideForm() {
 
    document.getElementById('formprofileContainer').style.display ='none';
    document.getElementById('formContainer').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function endCall() {
  // Your code to end the call
  document.getElementById('chat-container').style.display = 'flex';
  document.getElementById('videoContainer').style.display = 'none';
}
