chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
    chrome.storage.sync.set({ isFirstInstall: true });
    chrome.contextMenus.create({
        id: "Settings",
        title: "Settings",
        contexts: ["all"],
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "Settings") {
        chrome.tabs.create({
            url: chrome.runtime.getURL("index.html"),
        });
    }
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
                    reload: true,
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
    } else if (message.action === "checkPin") {
        chrome.storage.sync.get(["goatPIN", "passkeyEnabled"], (result) => {
            if (result.goatPIN === message.pin) {
                sendResponse({
                    status: "success",
                    msg: "PIN successfully verified!",
                });
            } else {
                sendResponse({
                    status: "fail",
                    msg: "PIN does not match.",
                });
            }
        });
        return true;
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getPasskeyStatus") {
        chrome.storage.sync.get(["hasPasskey", "passkeyEnabled"], (result) => {
            sendResponse({
                hasPasskey: result.hasPasskey === true,
                isEnabled: result.passkeyEnabled === true,
            });
        });
        return true;
    }

    if (message.action === "setPasskeyStatus") {
        chrome.storage.sync.get(["goatPIN"], (result) => {
            if (result.goatPIN === message.pin) {
                chrome.storage.sync.set(
                    {
                        hasPasskey: message.data.hasPasskey,
                        passkeyEnabled: message.data.isEnabled,
                    },
                    () => {
                        sendResponse({ status: "success" });
                    }
                );
            } else {
                sendResponse({
                    status: "fail",
                    msg: "PIN does not match.",
                });
            }
        });
        return true;
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "isSettingLocked") {
        chrome.storage.sync.get("isSettingLocked", (result) => {
            sendResponse({
                isSettingLocked: result.isSettingLocked === true,
            });
        });
        return true;
    }

    if (message.action === "toggleSetting") {
        chrome.storage.sync.get(["goatPIN"], (result) => {
            if (result.goatPIN === message.pin) {
                chrome.storage.sync.set(
                    {
                        isSettingLocked: message.status,
                    },
                    () => {
                        sendResponse({ status: "success" });
                    }
                );
            } else {
                sendResponse({
                    status: "fail",
                    msg: "PIN does not match.",
                });
            }
        });
        return true;
    }
});
