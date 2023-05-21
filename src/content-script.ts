console.log("xportal test loading");
window.addEventListener("message", (event) => receiveMessage(event), false);

chrome.runtime.onMessage.addListener((message: any) => {
    console.log("Message", message);
    if(!message?.type) return;

    console.log("Received message from background", message);
    if(message.type === "SIGN_TRANSACTIONS_RESPONSE") {
        window.postMessage(JSON.stringify(message), "*");
    }
});

async function receiveMessage(event: any) {
    console.log("Received message", event.data);
    if(event.data) {
        const data = JSON.parse(event.data);
        if(data.type === "SIGN_TRANSACTIONS_REQUEST") {
            console.log("Sending message to background", data);
            await chrome.runtime.sendMessage(data);
        }
    }
    return true;
}
console.log("xportal test loaded");