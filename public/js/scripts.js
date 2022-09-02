const socket = io('/chattings');

const getElementById = (id) => document.getElementById(id) || null;

const helloStrangerElement = getElementById('hello_stranger');
const chattingElement = getElementById('chatting_box');
const formElement = getElementById('chat_form');

socket.on('user_connected', (userName) => {
  drawNewChat(`${userName} connected!`);
});

socket.on('new_chat', (data) => {
  const { userName, chat } = data;
  drawNewChat(`${userName}: ${chat}`);
});

const handleSubmit = (event) => {
  event.preventDefault();
  const inputValue = event.target.elements[0].value;
  if (inputValue) {
    socket.emit('submit_chat', inputValue);
    drawNewChat(`me: ${inputValue}`);
    event.target.elements[0].value = '';
  }
};

const drawHelloStranger = (userName) => {
  helloStrangerElement.innerText = `Hello ${userName} Stranger :)`;
};

const drawNewChat = (message) => {
  const wrapperChatBox = document.createElement('div');
  const chatBox = `
    <div>
      ${message}
    </div>
  `;
  wrapperChatBox.innerHTML = chatBox;
  chattingElement.append(wrapperChatBox);
};

const helloUser = () => {
  const userName = prompt('What is your name?');
  socket.emit('new_user', userName, (data) => {
    drawHelloStranger(userName);
  });
};

function init() {
  helloUser();
  formElement.addEventListener('submit', handleSubmit);
}

init();
