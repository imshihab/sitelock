/**
 * @fileoverview SiteLock Chrome Extension
 * A security extension for protecting website access using Password and passkeys.
 */

// Constants and Utilities
//----------------------------------------
const authenticatedSites = new Set();
const tabsPerSite = new Map();

const toDomain = (_url) => {
    const url = new URL(_url);
    return url.origin + "/";
};

// Authentication Management Functions
//----------------------------------------
function isAuthenticated(_url) {
    return authenticatedSites.has(toDomain(_url));
}

function addAuthenticatedSite(_url) {
    const site = toDomain(_url);
    authenticatedSites.add(site);
    if (!tabsPerSite.has(site)) {
        tabsPerSite.set(site, 1);
    } else {
        tabsPerSite.set(site, tabsPerSite.get(site) + 1);
    }
}

function removeAuthenticatedSite(_url) {
    const site = toDomain(_url);
    authenticatedSites.delete(site);
    tabsPerSite.delete(site);
}

// Extension Installation and Setup
//----------------------------------------
chrome.runtime.onInstalled.addListener(() => {
    // Create initial tab
    chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });

    // Setup context menu
    chrome.contextMenus.create({
        id: "preferences",
        title: "Preferences",
        contexts: ["all"],
    });
});

// URL Redirection Rules
//----------------------------------------
chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [
        {
            id: 1,
            priority: 1,
            action: {
                type: "redirect",
                redirect: { extensionPath: "/index.html" },
            },
            condition: {
                urlFilter: "chrome-extension://" + chrome.runtime.id + "/",
                resourceTypes: ["main_frame"],
            },
        },
    ],
    removeRuleIds: [1],
});

//----------------------------------------
// Delete domain with password
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "deleteDomain") {
        (async () => {
            try {
                const result = await chrome.storage.sync.get("domains");
                const domains = result.domains || [];
                const domain = domains.find(
                    (item) => item.site === message.data.site
                );

                if (!domain) {
                    sendResponse({
                        status: "fail",
                        msg: "Site not found. Reload the page",
                    });
                    return;
                }

                if (message.data.password === domain.password) {
                    const updatedDomains = domains.filter(
                        (item) => item.site !== message.data.site
                    );
                    await chrome.storage.sync.set({ domains: updatedDomains });
                    sendResponse({
                        status: "success",
                        msg: "Site successfully deleted!",
                    });
                } else {
                    sendResponse({
                        status: "fail",
                        msg: "Password does not match.",
                    });
                }
            } catch (err) {
                console.error("Error:", err);
                sendResponse({
                    status: "fail",
                    msg: "An unexpected error occurred.",
                });
            }
        })();
        return true;
    }
});

// Delete domain with passkey
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "deleteDomainPasskey") {
        (async () => {
            try {
                const result = await chrome.storage.sync.get("domains");
                const domains = result.domains || [];
                const domain = domains.find(
                    (item) => item.site === message.data.site
                );

                if (!domain) {
                    sendResponse({ status: "fail", msg: "Site not found." });
                    return;
                }

                const updatedDomains = domains.filter(
                    (item) => item.site !== message.data.site
                );
                await chrome.storage.sync.set({ domains: updatedDomains });
                sendResponse({
                    status: "success",
                    msg: "Site successfully deleted!",
                });
            } catch (err) {
                sendResponse({
                    status: "fail",
                    msg: "An unexpected error occurred.",
                });
            }
        })();
        return true;
    }
});

// Add domain with password
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "addDomain") {
        (async () => {
            try {
                const result = await chrome.storage.sync.get("domains");
                const domains = result.domains || [];
                console.log(domains);

                const domain = domains.find(
                    (item) => item.site === message.data.site
                );

                if (domain) {
                    sendResponse({
                        status: "fail",
                        msg: "Site already Secured. Reload the page",
                    });
                    return;
                }

                const updatedDomains = domains.concat(message.data);
                await chrome.storage.sync.set({ domains: updatedDomains });
                sendResponse({
                    status: "success",
                    msg: "Site successfully added!",
                });
            } catch (err) {
                console.error("Error:", err);
                sendResponse({
                    status: "fail",
                    msg: "An unexpected error occurred.",
                });
            }
        })();

        return true;
    }
});

// Site Status Checking
//----------------------------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "checkSite") {
        chrome.storage.sync.get(["domains"], function (result) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tab = tabs[0];

                if (
                    !tab?.url ||
                    tab.url.startsWith("chrome://") ||
                    tab.url.startsWith("edge://") ||
                    tab.url.startsWith("chrome-extension://")
                ) {
                    sendResponse({
                        status: { msg: "Restricted URL or no URL available." },
                    });
                    return;
                }

                try {
                    const hostname = new URL(tab.url).origin + "/";
                    const domain = result.domains?.find(
                        (item) => item.site === hostname
                    );

                    if (domain?.password) {
                        sendResponse({
                            status: {
                                code: "correct",
                                site: hostname,
                            },
                        });
                    } else {
                        sendResponse({
                            status: {
                                code: "error",
                                site: hostname,
                            },
                        });
                    }
                } catch (error) {
                    sendResponse({
                        status: { msg: "Invalid URL format." },
                    });
                }
            });
        });
        return true;
    }
});

// Authentication Flow
//----------------------------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "authenticate") {
        const tabId = sender.tab.id;
        chrome.storage.sync.get(["domains"], function (result) {
            const domain = result.domains?.find(
                (item) => item.site === message.site
            );

            if (!domain) {
                chrome.tabs.update(tabId, { url: message.redirectUrl });
                return;
            }

            if (message.code === domain.password) {
                addAuthenticatedSite(message.site);
                chrome.tabs.update(tabId, { url: message.redirectUrl });
            } else {
                sendResponse({
                    fail: true,
                    msg: "Password does not match.",
                });
            }
        });
        return true;
    }
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === "Authentication__Success") {
        const tabId = sender.tab.id;
        addAuthenticatedSite(message.redirectUrl);
        chrome.tabs.update(tabId, { url: message.redirectUrl });
        return true;
    }
});

// Navigation Management
//----------------------------------------
chrome.webNavigation.onBeforeNavigate.addListener(
    async (details) => {
        const url = new URL(details.url);
        const site = url.origin + "/";

        if (details.frameId === 0 && !isAuthenticated(site)) {
            chrome.storage.sync.get(["domains"], async (result) => {
                const domain = result.domains?.find(
                    (item) => item.site === site
                );

                if (domain?.password) {
                    const authUrl =
                        chrome.runtime.getURL("auth.html") +
                        "?redirect=" +
                        encodeURIComponent(details.url);
                    chrome.tabs.update(details.tabId, { url: authUrl });
                }
            });
        }
    },
    { url: [{ schemes: ["http", "https"] }] }
);

// Tab Management
//----------------------------------------
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
    const tabs = await chrome.tabs.query({});
    const currentSites = new Map();

    tabs.forEach((tab) => {
        const site = toDomain(tab.url);
        if (site) {
            currentSites.set(site, (currentSites.get(site) || 0) + 1);
        }
    });

    for (let site of authenticatedSites) {
        if (!currentSites.has(site)) {
            removeAuthenticatedSite(site);
        } else {
            tabsPerSite.set(site, currentSites.get(site));
        }
    }
});

// Context Menu Handling
//----------------------------------------
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "preferences") {
        chrome.tabs.create({
            url: chrome.runtime.getURL("index.html"),
        });
    }
});

// Domain List Management
//----------------------------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "SecuredDomains") {
        chrome.storage.sync.get(["domains"], function (result) {
            const data = result.domains || [];
            const sites = data.map((item) => item.site);
            sendResponse({ data: sites });
        });
        return true;
    }
});
