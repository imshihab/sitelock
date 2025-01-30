chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
    chrome.storage.sync.set({ isFirstInstall: true });
    chrome.contextMenus.create({
        id: "Settings",
        title: "Settings",
        contexts: ["all"],
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkFirstInstall") {
        (async () => {
            try {
                const result = await chrome.storage.sync.get([
                    "isFirstInstall",
                    "goatPIN",
                ]);

                if (result.isFirstInstall && result.goatPIN === undefined) {
                    sendResponse({
                        isFirstInstall: true,
                    });
                } else {
                    sendResponse({
                        isFirstInstall: false,
                    });
                }
            } catch (error) {
                sendResponse({
                    error: error,
                });
                console.error("Error:", error);
            }
        })();
        return true;
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "createPin") {
        chrome.storage.sync.get(["goatPIN"], (result) => {
            if (result.goatPIN) {
                sendResponse({
                    status: "fail",
                    msg: "PIN already exists. Reload the page",
                });
                return;
            }

            chrome.storage.sync.set(
                { isFirstInstall: false, goatPIN: message.pin },
                () => {
                    sendResponse({
                        status: "success",
                        msg: "PIN successfully created!",
                    });
                }
            );
        });
        return true;
    }
});
