function toDomain(url) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol !== "chrome:" ? parsedUrl.origin + "/" : null;
    } catch {
        return null;
    }
}

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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "SecuredDomains") {
        chrome.storage.sync.get(["domains"], function (result) {
            const data = result.domains || [];
            const sites = data.map((item) => {
                return {
                    site: item.site,
                    pinOnly: item.pinOnly || false,
                    range: item.pass?.length || 0,
                    icon: item.icon,
                };
            });
            sendResponse({ data: sites });
        });
        return true;
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "addDomain") {
        (async () => {
            try {
                const result = await chrome.storage.sync.get("domains");
                const domains = result.domains || [];

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
                const Domain = toDomain(message.data.site);
                if (message.data.pinOnly) {
                    const updatedDomains = domains.concat({
                        site: Domain,
                        pinOnly: true,
                    });
                    await chrome.storage.sync.set({ domains: updatedDomains });
                } else {
                    const updatedDomains = domains.concat({
                        site: Domain,
                        pass: message.data.password,
                    });
                    await chrome.storage.sync.set({ domains: updatedDomains });
                }
                sendResponse({
                    status: "success",
                    msg: "Site successfully added!",
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "deleteDomain") {
        (async () => {
            try {
                const result = await chrome.storage.sync.get("domains");
                const goatPIN = await chrome.storage.sync.get("goatPIN");
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
                if (message.data.pinOnly) {
                    if (message.data.pin === goatPIN) {
                        const updatedDomains = domains.filter(
                            (item) => item.site !== message.data.site
                        );
                        await chrome.storage.sync.set({
                            domains: updatedDomains,
                        });
                        sendResponse({
                            status: "success",
                            msg: "Site successfully deleted!",
                        });
                    } else {
                        sendResponse({
                            status: "fail",
                            msg: "PIN does not match.",
                        });
                    }
                    return;
                }

                if (message.data.password === domain.pass) {
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
                sendResponse({
                    status: "fail",
                    msg: "An unexpected error occurred.",
                });
            }
        })();
        return true;
    } else if (message.type === "deleteDomainPasskey") {
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
                        status: {
                            code: "fail",
                            msg: "Restricted URL or no URL available.",
                        },
                    });
                    return;
                }

                try {
                    const hostname = new URL(tab.url).origin + "/";
                    const domain = result.domains?.find(
                        (item) => item.site === hostname
                    );

                    if (domain?.pass || domain?.pinOnly) {
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
                        status: { code: "fail", msg: "Invalid URL format." },
                    });
                }
            });
        });
        return true;
    }
});

async function isAuthenticated(url) {
    const site = toDomain(url);
    if (!site) return true;

    try {
        const { authenticatedSites = [] } = await chrome.storage.session.get(
            "authenticatedSites"
        );
        return authenticatedSites.includes(site);
    } catch {
        return true;
    }
}

async function addAuthenticatedSite(url) {
    const site = toDomain(url);
    const { authenticatedSites = [] } = await chrome.storage.session.get(
        "authenticatedSites"
    );

    if (!authenticatedSites.includes(site)) {
        authenticatedSites.push(site);
        await chrome.storage.session.set({ authenticatedSites });
    }

    const { tabsPerSite = {} } = await chrome.storage.session.get(
        "tabsPerSite"
    );
    tabsPerSite[site] = (tabsPerSite[site] || 0) + 1;
    await chrome.storage.session.set({ tabsPerSite });
}

async function removeAuthenticatedSite(url) {
    const site = toDomain(url);
    const { authenticatedSites = [] } = await chrome.storage.session.get(
        "authenticatedSites"
    );
    const filteredSites = authenticatedSites.filter((s) => s !== site);

    await chrome.storage.session.set({ authenticatedSites: filteredSites });

    const { tabsPerSite = {} } = await chrome.storage.session.get(
        "tabsPerSite"
    );
    delete tabsPerSite[site];
    await chrome.storage.session.set({ tabsPerSite });
}

chrome.webNavigation.onBeforeNavigate.addListener(
    async (details) => {
        if (details.frameId !== 0) return;
        const site = toDomain(details.url);
        if (!site) return;

        if (await isAuthenticated(site)) {
            return;
        }
        chrome.storage.sync.get(["domains"], async (result) => {
            const domain = result.domains?.find((item) => item.site === site);
            if (domain?.pass || domain?.pinOnly) {
                const _PINONLY = domain.pinOnly ? "&pinOnly=true" : "";
                const authUrl =
                    chrome.runtime.getURL("auth.html") +
                    "?redirect=" +
                    encodeURIComponent(details.url) +
                    _PINONLY;
                chrome.tabs.update(details.tabId, { url: authUrl });
            }
        });
    },
    { url: [{ schemes: ["http", "https"] }] }
);

// Helper function to fetch favicon
async function fetchFavicon(tabId) {
    return new Promise((resolve) => {
        chrome.tabs.get(tabId, (tab) => {
            if (tab && tab.favIconUrl) {
                resolve(tab.favIconUrl);
                return;
            }
            chrome.scripting.executeScript(
                {
                    target: { tabId },
                    func: () => {
                        const faviconLink =
                            document.querySelector("link[rel*='icon']")?.href;
                        return faviconLink || null;
                    },
                },
                (results) => {
                    if (results && results[0]?.result) {
                        resolve(results[0].result);
                    } else {
                        resolve(null);
                    }
                }
            );
        });
    });
}

chrome.webNavigation.onCompleted.addListener(async (details) => {
    if (details.frameId !== 0) return;
    const site = toDomain(details.url);
    if (!site) return;

    if (await isAuthenticated(site)) {
        chrome.storage.sync.get(["domains"], async (result) => {
            const domains = result.domains || [];
            const domainEntry = domains.find((item) => item.site === site);
            if (domainEntry && domainEntry.favicon) {
                return;
            }
            const favicon = await fetchFavicon(details.tabId);
            if (favicon) {
                domainEntry.icon = favicon;
                chrome.storage.sync.set({ domains });
            }
        });
    }
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === "PasskeyAuthenticate") {
        const tabId = sender.tab.id;
        addAuthenticatedSite(message.site);
        chrome.tabs.update(tabId, { url: message.redirectUrl });
        return true;
    }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "authenticate") {
        (async () => {
            const tabId = sender.tab.id;
            chrome.storage.sync.get(["domains", "goatPIN"], function (result) {
                const domain = result.domains?.find(
                    (item) => item.site === message.site
                );

                if (!domain) {
                    chrome.tabs.update(tabId, { url: message.redirectUrl });
                    return;
                }

                if (message.data.pinOnly) {
                    if (message.data.pin === result.goatPIN) {
                        addAuthenticatedSite(message.site);
                        sendResponse({
                            status: "success",
                        });
                        chrome.tabs.update(tabId, { url: message.redirectUrl });
                    } else {
                        sendResponse({
                            status: "fail",
                            msg: "PIN does not match.",
                        });
                    }
                    return;
                }

                if (message.data.password === domain.pass) {
                    addAuthenticatedSite(message.site);
                    sendResponse({
                        status: "success",
                    });
                    chrome.tabs.update(tabId, { url: message.redirectUrl });
                } else {
                    sendResponse({
                        status: "fail",
                        msg: "Password does not match.",
                    });
                }
            });
        })();
        return true;
    }
});

chrome.tabs.onRemoved.addListener(() => {
    chrome.tabs.query({}, async (tabs) => {
        const siteCounts = new Map();
        tabs.forEach((tab) => {
            if (tab.url && tab.url.startsWith("chrome://")) {
                return;
            }
            const site = toDomain(tab.url);
            if (site) {
                siteCounts.set(site, (siteCounts.get(site) || 0) + 1);
            }
        });

        const { authenticatedSites = [] } = await chrome.storage.session.get(
            "authenticatedSites"
        );
        const { tabsPerSite = {} } = await chrome.storage.session.get(
            "tabsPerSite"
        );

        for (const site of authenticatedSites) {
            if (!siteCounts.has(site)) {
                await removeAuthenticatedSite(site);
            } else {
                tabsPerSite[site] = siteCounts.get(site);
                await chrome.storage.session.set({ tabsPerSite });
            }
        }
    });
});
