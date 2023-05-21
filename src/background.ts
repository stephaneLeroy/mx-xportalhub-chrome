console.log("Hello World!");

chrome.runtime.onMessage.addListener(async (message: any, sender: any) => {
    console.log("Received message from background", message);
    if(!message) return;
    if(message.tabId) {
        const tabId = parseInt(message.tabId);
        delete message["tabId"];
        await chrome.tabs.sendMessage(tabId, message);
        return;
    }

    const storedWallet = await chrome.storage.local.get(["wallet"]);
    if(!storedWallet.wallet) {
        return;
    }

    try {
        if(message.type !== 'SIGN_TRANSACTIONS_REQUEST') {
            return;
        }
        await chrome.storage.local.set({ transactions: message.message, response: false })

        const newWindow = () => {
            console.log('in new window function');
        };
        await chrome.windows.create(
            {
                url: `index.html?signRequest&tabId=${sender.tab.id}`,
                type: 'popup',
                width: 400,
                height: 500,
                left:0,
                tabId: sender.tab.id,
                focused: true,
            },
            newWindow
        );
    } catch(err) {
        console.error("Error sending signed transactions", err)
    }
});

