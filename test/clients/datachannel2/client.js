
(function() {

    let connectButton = null;
    let disconnectButton = null;

    let ws = null;

    let sessionIDField = null;
    let sendButton = null;
    let messageInputBox = null;
    let receiveBox = null;

    let rtcConnection = null;
    let dataChannel = null;

    function onPageLoad() {
        connectButton = document.getElementById('connectButton');
        disconnectButton = document.getElementById('disconnectButton');
        sessionIDField = document.getElementById('sessionIDField');
        sendButton = document.getElementById('sendButton');
        messageInputBox = document.getElementById('message');
        receiveBox = document.getElementById('receivebox');

        connectButton.addEventListener('click', connectSession, false);
        disconnectButton.addEventListener('click', disconnectSession, false);
        sendButton.addEventListener('click', sendChatMessage, false);
    }

    function connectSession() {
        ws = new WebSocket("ws://localhost");
        ws.onmessage = onSessionMessage;
        ws.onopen = () => ws.send(JSON.stringify({ sessionControl: "joinSession", sessionID: sessionIDField.value }));
    }

    function disconnectSession() {
        ws.close();
        sessionIDField.value = "";
        sessionIDField.style.backgroundColor = "transparent";
        closeRTC();
    }

    function onSessionMessage(message) {
        const mes = JSON.parse(message.data);

        if(mes.sessionControl === "sessionJoined") {
            console.log("Session joined: " + mes.sessionID);
            sessionIDField.style.backgroundColor = "lightgreen";
            startRTC();
        }

        if(mes.sessionControl === "sessionDestroyed") {
            console.log("Session destroyed");
            disconnectSession();
        }

        if(mes.serverSDP) {
            rtcConnection.setRemoteDescription(new RTCSessionDescription(mes.serverSDP))
                .then(() => rtcConnection.createAnswer())
                .then(desc => rtcConnection.setLocalDescription(desc))
                .catch(handleError);
        }
    }

    function startRTC() {
        // Create the local connection and its event listeners
        rtcConnection = new RTCPeerConnection({});

        // Set up the ICE candidates
        rtcConnection.onicecandidate = e => {
            if (!e.candidate)
                ws.send(JSON.stringify({ clientSDP: rtcConnection.localDescription }));
        };

        // Wait for data channel
        rtcConnection.ondatachannel = event => {
            dataChannel = event.channel;
            dataChannel.onopen = handleChannelStatusChange;
            dataChannel.onclose = handleChannelStatusChange;
            dataChannel.onmessage = handleChannelOnMessage;
        };
    }

    function sendChatMessage() {
        const mes = messageInputBox.value;

        dataChannel.send(mes);

        messageInputBox.value = "";
        messageInputBox.focus();
    }

    function printMessage(mes) {
        const el = document.createElement("p");
        const txtNode = document.createTextNode(mes);
        el.appendChild(txtNode);
        receiveBox.appendChild(el);
    }

    function handleChannelStatusChange(event) {
        if (dataChannel) {
            const state = dataChannel.readyState;

            console.log("sendChannelStatusChange:", event);

            if (state === "open") {
                messageInputBox.disabled = false;
                messageInputBox.focus();
                sendButton.disabled = false;
            } else {
                messageInputBox.disabled = true;
                sendButton.disabled = true;
            }
        }
    }

    function handleChannelOnMessage(event) {
        const el = document.createElement("p");
        const txtNode = document.createTextNode(event.data);

        el.appendChild(txtNode);
        receiveBox.appendChild(el);
    }

    function handleError(error) {
        console.log("RTC Error:", + error);
    }

    function closeRTC() {

        if (dataChannel) dataChannel.close();
        if (rtcConnection) rtcConnection.close();

        dataChannel = null;
        rtcConnection = null;

        messageInputBox.value = "";
        messageInputBox.disabled = true;
        sendButton.disabled = true;
    }

    window.addEventListener('load', onPageLoad, false);

})();
