let message_textarea = document.getElementById('message_text');
let messages_container = document.getElementById("messages_container");
let rooms_container = document.getElementById("rooms_container");
let send_button = document.getElementById('send_button');
let user_container = document.querySelector("div.conversation-wrap");
let open_chat_buttons = user_container.querySelectorAll("button[username]");
let open_room_buttons = document.querySelectorAll("button[roomname]");
let current_username = document.getElementById('current-username').textContent.replace(/['"]+/g, '');
let new_chat_button = document.getElementById("new_room_button");
let new_chat_input = document.getElementById("new_room_input");

let room_name = document.getElementById('chat-name').textContent;
room_name = room_name.replace(/['"]+/g, '')

// Connect to global chat room(by default)-----------------------------------------------------
let chatSocket = new WebSocket('ws://' + window.location.host + '/ws/chat/' + room_name + '/');

chatSocket.onmessage = function(e) {
  const data = JSON.parse(e.data);
  let icon_src = document.getElementById(`${data['from_user']}_image`).src;
  messages_container.insertAdjacentHTML('beforeend', `<div class="media msg">
                    <a class="pull-left" href="#">
                        <img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 32px; height: 32px;" src="${icon_src}">
                    </a>
                    <div class="media-body">
                        <small class="pull-right time"><i class="fa fa-clock-o"></i>${data['message_time']}</small>

                        <h5 class="media-heading">${data['from_user']}</h5>
                        <small class="col-lg-10">${data['message']}</small>
                    </div>
                </div>`)
};

chatSocket.onclose = function(e) {
    console.error('Chat socket closed unexpectedly');
};
// ----------------------------------------------------------------------------------------------

// Add event listener to button( click/(press enter in textarea) -> send message )---------------
send_button.onclick = send_message;
message_textarea.onkeypress = function(e) {
    let key = e.keyCode;
    if (key == 13) {
        send_message(e);
    };
};
// ----------------------------------------------------------------------------------------------

// Function send messages via WebSocket ---------------------------------------------------------
function send_message(e) {
    const message_input = message_textarea.value;
    //console.log(room_name);
    chatSocket.send(JSON.stringify({
        'room_name': room_name,
        'message': message_input
    }));
    message_textarea.value = '';
    let messages_container = document.getElementById('messages_container');
    setTimeout(()=>{
        messages_container.scrollTo(0, messages_container.scrollHeight);
    }, 1);
};
// ----------------------------------------------------------------------------------------------

// Add event listener for each open_chat_button(buttons near users) -----------------------------
open_chat_buttons.forEach(chat_button => {
    let username = chat_button.getAttribute('username');
    chat_button.onclick = function(e) {
        // Set (new)room_name, which should be equal if first user clicked button open_chat_with_second_user,
        // or second user clicked button open_chat_with_first_user,
        let new_room_name = username + "__" + current_username;
        if(username > current_username) {
            new_room_name = username + "__" + current_username;
        } else {
            new_room_name = current_username + "__" + username
        }
        new_room_name = new_room_name.replace(/['"]+/g, '');
        room_name = new_room_name;
        // --------------------------------------------------------------------------------------------------

        // Close old webSocket connection and reopen to another room ----------------------------------------
        chatSocket.close();
        chatSocket = new WebSocket('ws://' + window.location.host + '/ws/chat/' + new_room_name + '/');

        chatSocket.onmessage = function(e) {
              console.log(room_name);
              const data = JSON.parse(e.data);
              let messages_container = document.getElementById('messages_container');
              let icon_src = document.getElementById(`${data['from_user']}_image`).src;
              messages_container.insertAdjacentHTML('beforeend', `<div class="media msg">
                                <a class="pull-left" href="#">
                                    <img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 32px; height: 32px;" src="${icon_src}">
                                </a>
                                <div class="media-body">
                                    <small class="pull-right time"><i class="fa fa-clock-o"></i>${data['message_time']}</small>

                                    <h5 class="media-heading">${data['from_user']}</h5>
                                    <small class="col-lg-10">${data['message']}</small>
                                </div>
                            </div>`)
            };

        console.log('User ' + current_username + "opened ws connection to room " + new_room_name);

        // Request body to add user to room
        let request_body = {
                group_name: new_room_name,
                username: username
            }

        let csrf_token = document.cookie.replace('csrftoken=', '')

        let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        myHeaders.append('Accept', 'application/json');
        // This header prevent from CSRF Error. Must be here...
        myHeaders.append('X-CSRFToken', csrf_token);

        // Request object to add user to room
        let request = new Request("http://" + window.location.host + "/api/rooms/add_user/", {
            method: "POST",
            headers: myHeaders,
            body: JSON.stringify(request_body)
        })

        // Add user to current_room if not already
        fetch(request)
            .then(response => response.json())
            .then(response => {
                if (!('Error' in response)) { console.log(`${response}\n\n User ${username} was added to room ${new_room_name}`) }
                else { console.log(`${response}\n`)}
            })


        // Request body to add current user to new_room_name chat
        request_body = { group_name: new_room_name, username: current_username}
        request = new Request("http://" + window.location.host + "/api/rooms/add_user/",
        {
            method: "POST",
            headers: myHeaders,
            body: JSON.stringify(request_body),
        })

        // Add current_user to current_room if not already
        fetch(request)
            .then(response => response.json())
            .then(response => {
                if (!('Error' in response)) { console.log(`${response}\n\n User ${username} was added to room ${new_room_name}`) }
                else { console.log(`${response}\n`)}
            })

        // Remove all messages from old room/chat -----------------------------------------------------------------
        while (messages_container.hasChildNodes()) { messages_container.removeChild(messages_container.firstChild)};

        // Set new room name at the bottom of page-----------------------------------------------------------------
        let chat_name_element = document.getElementById("chat_name");
        chat_name_element.textContent = new_room_name;

        // Enable all button, except current------
        open_chat_buttons.forEach(chat_button => {
            chat_button.disabled = false;
        });
        chat_button.disabled = true;
        // ---------------------------------------

        // Get all messages from server and append them ---------------------------------------------------------------
        fetch("http://" + window.location.host + "/api/messages/" + `?group=${room_name}`)
            .then(response => response.json())
            .then(messages => {
                if (messages.length != 0) {
                    for(const message of messages) {
                    console.log(message);
                    let icon = document.querySelector(`img[user_id=\"${message['from_user']}\"]`);
                    let icon_src = icon.src;
                    let username = icon.getAttribute('username');
                    messages_container.insertAdjacentHTML('beforeend', `<div class="media msg">
                                <a class="pull-left" href="#">
                                    <img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 32px; height: 32px;" src="${icon_src}">
                                </a>
                                <div class="media-body">
                                    <small class="pull-right time"><i class="fa fa-clock-o"></i>${message['time_added']}</small>

                                    <h5 class="media-heading">${username}</h5>
                                    <small class="col-lg-10">${message['message']}</small>
                                </div>
                            </div>`)
                }
                }
            })
}});

// add actions for Open room buttons -----------------------------------------------------------------------------------
for(const openRoomBtn of open_room_buttons) {
    let roomName = openRoomBtn.getAttribute('roomname')

    openRoomBtn.onclick = async function(e) {
        room_name = document.getElementById('chat_name').textContent;
        room_name = room_name.replace(/['"]+/g, '');

        // Remove all messages from old room/chat -----------------------------------------------------------------
        while (messages_container.hasChildNodes()) { messages_container.removeChild(messages_container.firstChild)};

        // close old ws connection
        chatSocket.close();
        chatSocket = new WebSocket('ws://' + window.location.host + '/ws/chat/' + roomName + '/');

        chatSocket.onmessage = function(e) {
          console.log(roomName);
          const data = JSON.parse(e.data);
          let icon_src = document.getElementById(`${data['from_user']}_image`).src;
          messages_container.insertAdjacentHTML('beforeend', `<div class="media msg">
                            <a class="pull-left" href="#">
                                <img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 32px; height: 32px;" src="${icon_src}">
                            </a>
                            <div class="media-body">
                                <small class="pull-right time"><i class="fa fa-clock-o"></i>${data['message_time']}</small>

                                <h5 class="media-heading">${data['from_user']}</h5>
                                <small class="col-lg-10">${data['message']}</small>
                            </div>
                        </div>`)
        };

        // Set new room name at the bottom of page-----------------------------------------------------------------
        let chat_name_element = document.getElementById("chat_name");
        chat_name_element.textContent = roomName;

        // Enable all button, except current------
        open_chat_buttons.forEach(chat_button => {
            chat_button.disabled = false;
        });

        open_room_buttons.forEach(room_button => {
            room_button.disabled = false;
            room_button.textContent = "Open room";
        });
        openRoomBtn.disabled = true;
        openRoomBtn.textContent = "Current room";
        // ---------------------------------------

        // ----------------------------------------------------------
        let old_buttons = document.querySelectorAll('button[classname="add_user"]');
            for(old_button of old_buttons){
                old_button.remove();
                }
        for(userButton of open_chat_buttons){
            let button_username = userButton.getAttribute('username');
            let response = await fetch('http://' + window.location.host + `/api/users/?group=${roomName}`);
            let roomUsers = await response.json();
            let notInGroup = true;
            for(user of roomUsers){
                if(user.username == button_username) {
                    notInGroup = false;
                    break;}
            }
            if (notInGroup){
                userButton.insertAdjacentHTML('beforebegin', `<button classname="add_user" id="${roomName}_${button_username}" username="${button_username}" class="pull-right"  type="button">Add</button>`)
                let newAddUserButton = document.getElementById(`${roomName}_${button_username}`);
                let csrf_token = document.cookie.replace('csrftoken=', '')
                newAddUserButton.onclick = function(e) {
                    fetch("http://" + window.location.host + "/api/rooms/add_user/",{
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-CSRFToken': csrf_token
                        },
                        body: JSON.stringify({
                            group_name: roomName,
                            username: button_username})
                    })
                    .then(response => response.json())
                    .then(result => {
                        if(result.users){
                            newAddUserButton.remove();
                        }
                    })
                }
            }
        }
        // ----------------------------------------------------------

        // Get all messages from server and append them ---------------------------------------------------------------
        fetch("http://" + window.location.host + "/api/messages/" + `?group=${roomName}`)
            .then(response => response.json())
            .then(messages => {
                if (messages.length != 0) {
                    for(const message of messages) {
                    console.log(message);
                    let icon = document.querySelector(`img[user_id=\"${message['from_user']}\"]`);
                    let icon_src = icon.src;
                    let username = icon.getAttribute('username');
                    messages_container.insertAdjacentHTML('beforeend', `<div class="media msg">
                                <a class="pull-left" href="#">
                                    <img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 32px; height: 32px;" src="${icon_src}">
                                </a>
                                <div class="media-body">
                                    <small class="pull-right time"><i class="fa fa-clock-o"></i>${message['time_added']}</small>

                                    <h5 class="media-heading">${username}</h5>
                                    <small class="col-lg-10">${message['message']}</small>
                                </div>
                            </div>`)
                }
                }
            })
    }
}

// Event listener on button "New ChatRoom" -----------------------------------------------------------------------------
new_room_button.onclick = async function(e) {
    let newRoomName = new_chat_input.value;
    if(newRoomName != ''){

        // Request body to add new room
        let request_body = {
                group_name: newRoomName,
            }

        let csrf_token = document.cookie.replace('csrftoken=', '')

        let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        myHeaders.append('Accept', 'application/json');
        // This header prevent from CSRF Error. Must be here...
        myHeaders.append('X-CSRFToken', csrf_token);

        // Request object to add user to room
        let request = new Request("http://" + window.location.host + "/api/rooms/new/", {
            method: "POST",
            headers: myHeaders,
            body: JSON.stringify(request_body)
        })

        // Add room if not exist ---------------------------------------------------------------------------------------
        let fetch_response = await fetch(request);
        let response = await fetch_response.json();
        if ('Error' in response) { console.log(`${response}\n\n room was not added`) }
        else {
            rooms_container.insertAdjacentHTML('afterbegin', `<div class="media conversation">
                    <div class="media-body">
                        <h5 class="media-heading" style="color: white;">${response.name}</h5>
                    </div>
                        <button id="${response.name}_chat_btn" roomname="${response.name}" class="pull-right">Open room</button>
                    </div>`)
        }

        // -------------------------------------------------------------------------------------------------------------

        let new_button_id = `${newRoomName}_chat_btn`;
        let new_button = document.getElementById(new_button_id);

        new_button.onclick = async function(e){
            // Remove all messages from old room/chat -----------------------------------------------------------------
            while (messages_container.hasChildNodes()) { messages_container.removeChild(messages_container.firstChild)};

            // close old ws connection and open new one
            chatSocket.close();
            chatSocket = new WebSocket('ws://' + window.location.host + '/ws/chat/' + newRoomName + '/');

            chatSocket.onmessage = function(e) {
              console.log(newRoomName);
              const data = JSON.parse(e.data);
              let icon_src = document.getElementById(`${data['from_user']}_image`).src;
              messages_container.insertAdjacentHTML('beforeend', `<div class="media msg">
                                <a class="pull-left" href="#">
                                    <img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 32px; height: 32px;" src="${icon_src}">
                                </a>
                                <div class="media-body">
                                    <small class="pull-right time"><i class="fa fa-clock-o"></i>${data['message_time']}</small>

                                    <h5 class="media-heading">${data['from_user']}</h5>
                                    <small class="col-lg-10">${data['message']}</small>
                                </div>
                            </div>`)
            };

            // Set new room name at the bottom of page-----------------------------------------------------------------
            let chat_name_element = document.getElementById("chat_name");
            chat_name_element.textContent = newRoomName;

            // Enable all button, except current------
            open_chat_buttons.forEach(chat_button => {
                chat_button.disabled = false;
            });

            open_room_buttons = document.querySelectorAll("button[roomname]");
            open_room_buttons.forEach(room_button => {
                room_button.disabled = false;
                room_button.textContent = "Open room";
            });
            new_button.disabled = true;
            new_button.textContent = "Current room";
            // ---------------------------------------

            // ----------------------------------------------------------
            let old_buttons = document.querySelectorAll('button[classname="add_user"]');
            for(old_button of old_buttons){ old_button.remove(); }
            for(userButton of open_chat_buttons){
                let button_username = userButton.getAttribute('username');
                let response = await fetch('http://' + window.location.host + `/api/users/?group=${newRoomName}`);
                let roomUsers = await response.json();
                let notInGroup = true;
                for(user of roomUsers){
                    if(user.username == button_username) {
                        notInGroup = false;
                        break;}
                }
                if (notInGroup){
                    userButton.insertAdjacentHTML('beforebegin', `<button classname="add_user" id="${newRoomName}_${button_username}" username="${button_username}" class="pull-right"  type="button">Add</button>`)
                    let newAddUserButton = document.getElementById(`${newRoomName}_${button_username}`);
                    let csrf_token = document.cookie.replace('csrftoken=', '')
                    newAddUserButton.onclick = function(e) {
                        fetch("http://" + window.location.host + "/api/rooms/add_user/",{
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'X-CSRFToken': csrf_token
                            },
                            body: JSON.stringify({
                                group_name: newRoomName,
                                username: button_username})
                        })
                        .then(response => response.json())
                        .then(result => {
                            if(result.users){
                                newAddUserButton.remove();
                            }
                        })
                    }
                }
            }
            // ----------------------------------------------------------
            // Get all messages from server and append them ---------------------------------------------------------------
            fetch("http://" + window.location.host + "/api/messages/" + `?group=${newRoomName}`)
                .then(response => response.json())
                .then(messages => {
                    if (messages.length != 0) {
                        for(const message of messages) {
                        console.log(message);
                        let icon = document.querySelector(`img[user_id=\"${message['from_user']}\"]`);
                        let icon_src = icon.src;
                        let username = icon.getAttribute('username');
                        messages_container.insertAdjacentHTML('beforeend', `<div class="media msg">
                                    <a class="pull-left" href="#">
                                        <img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 32px; height: 32px;" src="${icon_src}">
                                    </a>
                                    <div class="media-body">
                                        <small class="pull-right time"><i class="fa fa-clock-o"></i>${message['time_added']}</small>

                                        <h5 class="media-heading">${username}</h5>
                                        <small class="col-lg-10">${message['message']}</small>
                                    </div>
                                </div>`)
                    }
                    }
                })

            }
    }
}
