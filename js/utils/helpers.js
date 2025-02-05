import Storage from "./esmls.js";
import toast from "./toast.js";
import { addDomain, removeDomain } from "./Domains.js";
import { PINInputsFunction } from "./UI_Helper.js";

export const CONSTANT = {
    FIRST_ATTEMPT: "FIRST_ATTEMPT",
    STORAGE_KEY: "passkey_credentials",
    AUTO_LOGIN_KEY: "passkey_auto_login",
    IS_PIN_Only: "IS_PIN_Only",
    Auto_Confirm: "IS_Auto_Confirm",
};

const isPasskeySupported = async () => {
    if (
        !window.PublicKeyCredential ||
        !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ||
        !PublicKeyCredential.isConditionalMediationAvailable
    ) {
        return false;
    }

    try {
        const [isPlatformAuthenticatorAvailable, isConditionalUIAvailable] =
            await Promise.all([
                PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
                PublicKeyCredential.isConditionalMediationAvailable(),
            ]);

        return isPlatformAuthenticatorAvailable && isConditionalUIAvailable;
    } catch (error) {
        toast(`Error checking passkey support: ${error}`, "error");
        return false;
    }
};

export const generateRandomChallenge = (length = 32) => {
    const challenge = new Uint8Array(length);
    crypto.getRandomValues(challenge);
    return challenge;
};

const getCredentials = () => Storage.get(CONSTANT.STORAGE_KEY) || {};
const saveCredential = (credentialData) => {
    if (Storage.get(CONSTANT.STORAGE_KEY)) {
        throw new Error("Passkey already exists.");
    }
    Storage.set(CONSTANT.STORAGE_KEY, credentialData);
};

const redirectUrl = () =>
    new URLSearchParams(window.location.search).get("redirect");

export const SetUpPIN = () => {
    const container = document.createElement("div");
    container.className = "pin-container";

    container.innerHTML = /*html*/ `
    <p>Set a PIN to securely authenticate yourself, even if you forget other passwords. This PIN will also be needed before adding new passkeys. You can also use it to secure site or Setting Page.</p>
    <form id="createPinForm">
        <h4 class="pintitle">Set a PIN</h4>
        <div class="pin-input-container"></div>
        <div class="button-container">
            <button type="button" id="PINclearBtn" class="button button-cancel button-clear">Clear</button>
            <button type="submit" id="createPinBtn" class="button button-submit">Next</button>
        </div>
    </form>`;
    const PINinputContainer = container.querySelector(".pin-input-container");
    PINinputContainer.appendChild(PINInputsFunction());

    const createPinForm = container.querySelector("#createPinForm");
    const title = createPinForm.querySelector(".pintitle");
    const pinBoxes = container.querySelectorAll(".pin-box");
    const clearBtn = container.querySelector("#PINclearBtn");
    const createPinBtn = container.querySelector("#createPinBtn");

    clearBtn.addEventListener("click", () => {
        Array.from(pinBoxes).forEach((box) => (box.value = ""));
        pinBoxes[0].focus();
    });

    let firstPin = "";
    createPinForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const pin = Array.from(pinBoxes)
            .map((box) => box.value)
            .join("");
        if (pin.length < 4) {
            toast("PIN must be exactly 4 digits.", "error");
            return;
        }
        if (!/^\d{4}$/.test(pin)) {
            toast("PIN must be exactly 4 digits.", "error");
            return;
        }
        if (firstPin && firstPin !== pin) {
            toast("PINs do not match", "error");
            return;
        }
        if (!firstPin) {
            firstPin = pin;
            title.textContent = "Re-enter your PIN";
            createPinBtn.textContent = "Confirm";
            createPinBtn.classList.remove("active");
            Array.from(pinBoxes).forEach((box) => (box.value = ""));
            pinBoxes[0].focus();
            return;
        }
        chrome.runtime.sendMessage(
            { action: "createPin", pin: pin },
            (response) => {
                if (response.reload) {
                    window.location.reload();
                }
                if (response.status === "success") {
                    toast("PIN successfully created.");
                    container.remove();
                    Storage.set(CONSTANT.FIRST_ATTEMPT, "false");
                } else {
                    toast(response.msg, "error");
                }
            }
        );
    });

    return container;
};
export const checkFirstInstall = async () => {
    const checkFirstAttempt = Storage.get(CONSTANT.FIRST_ATTEMPT);
    try {
        const isFirstInstall = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                { action: "checkFirstInstall" },
                (response) => {
                    if (response.error) {
                        reject(response.error);
                    } else {
                        resolve(response.isFirstInstall);
                    }
                }
            );
        });
        if (checkFirstAttempt !== "false" && isFirstInstall) {
            return [null, isFirstInstall];
        } else {
            Storage.set(CONSTANT.FIRST_ATTEMPT, "false");
            return [null, false];
        }
    } catch (error) {
        return [error, null];
    }
};

const createPinDialog = (submitForm, noCancel = false) => {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay-container");

    const dialog = document.createElement("div");
    dialog.classList.add("dialog-container");

    dialog.innerHTML = /*html*/ `
        <h3 class="auth-title">Authentication Required</h3>
        <form id="pinForm">
            <div class="pin-input-container"></div>
            <div class="button-container">
                <button type="button" id="PINcancelBtn" class="button button-cancel">Cancel</button>
                <button type="submit" class="button button-submit">Submit</button>
            </div>
        </form>
    `;
    const PINinputContainer = dialog.querySelector(".pin-input-container");
    PINinputContainer.appendChild(PINInputsFunction());
    overlay.appendChild(dialog);

    const cancelBtn = overlay.querySelector("#PINcancelBtn");
    if (noCancel === true) {
        cancelBtn?.remove();
    }
    cancelBtn?.addEventListener("click", () => {
        overlay.remove();
        toast("Cancelled by user", "error");
    });

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay && noCancel === false) {
            overlay.remove();
            toast("Cancelled by user", "error");
        }
    });

    const PinForm = overlay.querySelector("#pinForm");
    const pinBoxes = overlay.querySelectorAll(".pin-box");

    const checkAutoConfirm = () => {
        const pin = Array.from(pinBoxes)
            .map((box) => box.value)
            .join("");
        if (Storage.get(CONSTANT.Auto_Confirm) && pin.length === 4) {
            const event = new Event("submit");
            PinForm.dispatchEvent(event);
        }
    };

    pinBoxes.forEach((box) => {
        box.addEventListener("input", checkAutoConfirm);
    });

    PinForm.addEventListener("submit", (e) => {
        const pin = Array.from(pinBoxes)
            .map((box) => box.value)
            .join("");
        submitForm(e, pin, overlay);
    });

    document.body.appendChild(overlay);
    pinBoxes[0].focus();

    return overlay;
};

const registerCredential = async () => {
    try {
        const challenge = generateRandomChallenge();
        const options = {
            challenge,
            rp: {
                id: window.location.hostname,
                name: "SiteLock",
            },
            user: {
                id: Uint8Array.from("userId", (c) => c.charCodeAt(0)),
                name: "SiteLock",
                displayName: "SiteLock",
            },
            pubKeyCredParams: [
                { alg: -7, type: "public-key" },
                { alg: -257, type: "public-key" },
            ],
            authenticatorSelection: {
                authenticatorAttachment: "platform",
                requireResidentKey: true,
            },
            timeout: 60000,
        };

        const credential = await navigator.credentials.create({
            publicKey: options,
        });
        if (!credential) {
            throw new Error("Credential creation failed.");
        }

        const credentialData = {
            id: credential.id,
            rawId: Array.from(new Uint8Array(credential.rawId)),
            type: credential.type,
            response: {
                attestationObject: Array.from(
                    new Uint8Array(credential.response.attestationObject)
                ),
                clientDataJSON: Array.from(
                    new Uint8Array(credential.response.clientDataJSON)
                ),
            },
        };
        saveCredential(credentialData);
        return true;
    } catch (error) {
        toast(`Error during passkey creation: ${error}`, "error");
        throw error;
    }
};

const authenticateUserPIN = (callback, noCancel) => {
    createPinDialog(async (event, pin, overlay) => {
        event.preventDefault();
        try {
            chrome.runtime.sendMessage(
                { action: "checkPin", pin: pin },
                (response) => {
                    if (response.status === "success") {
                        overlay.remove();
                        callback(null, pin);
                    } else {
                        callback(response.msg, false);
                    }
                }
            );
        } catch (error) {
            callback(error.message, false);
        }
    }, noCancel);
};

const AutoPassKey = () => {
    const AutoPasskeyItem = document.createElement("div");
    AutoPasskeyItem.className = "setting-item";
    AutoPasskeyItem.id = "AUTO__PASSKEY";
    AutoPasskeyItem.innerHTML = /*html*/ `
        <div class="setting-label">
            <span class="setting-title">Auto Passkey Login</span>
            <span class="setting-description"
                >Enable automatic passkey authentication</span
            >
        </div>
        <label class="toggle-switch">
            <input type="checkbox" id="Auto_Passkey"/>
            <span class="slider"></span>
        </label>`;

    const checkBox = AutoPasskeyItem.querySelector("#Auto_Passkey");
    const isAutoLogin = Storage.get(CONSTANT.AUTO_LOGIN_KEY) === true;
    checkBox.checked = isAutoLogin;
    Storage.set(CONSTANT.AUTO_LOGIN_KEY, isAutoLogin);
    checkBox.addEventListener("change", (e) => {
        Storage.set(CONSTANT.AUTO_LOGIN_KEY, e.target.checked);
    });
    return AutoPasskeyItem;
};

export const SetUpPasskeyLogin = async () => {
    const isSupported = await isPasskeySupported();
    const SettingItemPasskeyLogin = document.querySelector("#PASSKEY__LOGIN");
    if (!isSupported) {
        SettingItemPasskeyLogin.innerHTML = `This device does not support passkeys.`;
        return;
    }

    const credentials = getCredentials();

    if (Object.keys(credentials).length > 0 && redirectUrl()) {
        window.location.href = redirectUrl();
        return;
    }

    const checkBox = document.querySelector("#Passkey_Login");
    const AutoPassKeySetting = AutoPassKey();
    try {
        const response = await chrome.runtime.sendMessage({
            action: "getPasskeyStatus",
        });
        const hasPasskey = response.hasPasskey;
        const isEnabled = response.isEnabled;
        Storage.set("passkeyStatus", hasPasskey && isEnabled);
        checkBox.checked = hasPasskey && isEnabled;
        if (hasPasskey && isEnabled)
            SettingItemPasskeyLogin.after(AutoPassKeySetting);
    } catch (error) {
        toast(`Failed to get passkey status: ${error}`);
        Storage.set("passkeyStatus", false);
        checkBox.checked = false;
    }

    checkBox.addEventListener("click", async function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const [error, isFirstInstall] = await checkFirstInstall();
        if (error) {
            console.error("Error checking first install:", error);
            return;
        }

        if (isFirstInstall) {
            toast(
                "Please set a PIN first before enabling passkey protection.",
                "error"
            );
            Storage.set("passkeyStatus", false);
            checkBox.checked = false;
            return;
        }

        try {
            const { hasPasskey, isEnabled } = await chrome.runtime.sendMessage({
                action: "getPasskeyStatus",
            });

            if (!hasPasskey) {
                authenticateUserPIN(async (err, pin) => {
                    if (err) {
                        toast(err, "error");
                        return;
                    }
                    try {
                        await registerCredential();
                        await chrome.runtime.sendMessage(
                            {
                                action: "setPasskeyStatus",
                                data: {
                                    hasPasskey: true,
                                    isEnabled: true,
                                },
                                pin,
                            },
                            (res) => {
                                if (res.status === "success") {
                                    Storage.set("passkeyStatus", true);
                                    checkBox.checked = true;
                                    SettingItemPasskeyLogin.after(
                                        AutoPassKeySetting
                                    );
                                    toast("Passkey created successfully");
                                    if (redirectUrl()) {
                                        window.location.href = redirectUrl();
                                    }
                                } else {
                                    toast(res.msg, "error");
                                }
                            }
                        );
                    } catch (error) {
                        console.error("Passkey registration failed:", error);
                        toast(
                            "Failed to create passkey. Please try again.",
                            "error"
                        );
                        checkBox.checked = false;
                        Storage.set("passkeyStatus", false);
                    }
                    return;
                });
                return;
            }

            authenticateUserPIN(async (err, pin) => {
                if (err) {
                    toast(err, "error");
                    return;
                }
                const newState = !isEnabled;
                await chrome.runtime.sendMessage(
                    {
                        action: "setPasskeyStatus",
                        data: {
                            hasPasskey: true,
                            isEnabled: newState,
                        },
                        pin,
                    },
                    (res) => {
                        if (res.status === "success") {
                            checkBox.checked = newState;
                            Storage.set("passkeyStatus", newState);
                            toast(
                                newState
                                    ? "Passkey login enabled"
                                    : "Passkey login disabled",
                                "success"
                            );
                        } else {
                            toast(res.msg, "error");
                        }
                    }
                );
            });
        } catch (error) {
            toast("Operation failed. Please try again.", "error");
            const { hasPasskey, isEnabled } = await chrome.runtime.sendMessage({
                action: "getPasskeyStatus",
            });
            const isTrue = hasPasskey && isEnabled;
            Storage.set("passkeyStatus", isTrue);
            checkBox.checked = isTrue;
        }
    });
    Storage.onChange("passkeyStatus", (val) => {
        checkBox.checked = val;
        if (val === true) {
            SettingItemPasskeyLogin.after(AutoPassKeySetting);
        } else {
            AutoPassKeySetting.remove();
        }
    });
    Storage.onChange(CONSTANT.AUTO_LOGIN_KEY, (val) => {
        const checkBox = AutoPassKeySetting.querySelector("#Auto_Passkey");
        checkBox.checked = val;
    });
};

export const ToggleUsePinOnly = () => {
    const checkBox = document.querySelector("#Use_pinOnly");
    const IsPinOnly = Storage.get(CONSTANT.IS_PIN_Only) || false;

    checkBox.checked = IsPinOnly;
    Storage.set(CONSTANT.IS_PIN_Only, IsPinOnly);

    checkBox.addEventListener("click", async function (e) {
        e.preventDefault();
        const [error, isFirstInstall] = await checkFirstInstall();
        if (error) {
            console.error("Error checking first install:", error);
            return;
        }

        if (isFirstInstall) {
            toast(
                "Please set a PIN first before enabling 'Use PIN Only'.",
                "error"
            );
            checkBox.checked = false;
            Storage.set(CONSTANT.IS_PIN_Only, false);
            return;
        }

        if (checkBox.checked) {
            checkBox.checked = false;
            Storage.set(CONSTANT.IS_PIN_Only, false);
        } else {
            checkBox.checked = true;
            Storage.set(CONSTANT.IS_PIN_Only, true);
        }
    });
    Storage.onChange(CONSTANT.IS_PIN_Only, (val) => {
        checkBox.checked = val;
    });
};

export const ToggleAutoConfirm = () => {
    const checkBox = document.querySelector("#AUTO__CONFIRM");
    const isAutoConfirm = Storage.get(CONSTANT.Auto_Confirm) || false;
    checkBox.checked = isAutoConfirm;
    Storage.set(CONSTANT.Auto_Confirm, isAutoConfirm);

    checkBox.addEventListener("click", function (e) {
        if (checkBox.checked === false) {
            checkBox.checked = false;
            Storage.set(CONSTANT.Auto_Confirm, false);
        } else {
            checkBox.checked = true;
            Storage.set(CONSTANT.Auto_Confirm, true);
        }
    });
    Storage.onChange(CONSTANT.Auto_Confirm, (val) => {
        checkBox.checked = val;
    });
};

export const ToggleLockSetting = async () => {
    const checkBox = document.querySelector("#Lock__Setting");
    try {
        const { isSettingLocked } = await chrome.runtime.sendMessage({
            action: "isSettingLocked",
        });
        Storage.set("isSettingLocked", isSettingLocked);
        checkBox.checked = isSettingLocked;
    } catch (error) {
        toast(`Failed to get Setting status: ${error}`);
        Storage.set("isSettingLocked", false);
        checkBox.checked = false;
    }

    checkBox.addEventListener("click", async function (e) {
        e.preventDefault();
        const [error, isFirstInstall] = await checkFirstInstall();
        if (error) {
            console.error("Error checking first install:", error);
            return;
        }

        if (isFirstInstall) {
            toast("Please set a PIN first before Lock Settings.", "error");
            checkBox.checked = false;
            return;
        }

        authenticateUserPIN(async (err, pin) => {
            if (err) {
                toast(err, "error");
                return;
            }
            const { isSettingLocked } = await chrome.runtime.sendMessage({
                action: "isSettingLocked",
            });
            const newStatus = !isSettingLocked;
            await chrome.runtime.sendMessage(
                {
                    action: "toggleSetting",
                    status: newStatus,
                    pin,
                },
                (res) => {
                    if (res.status === "success") {
                        checkBox.checked = newStatus;
                        Storage.set("isSettingLocked", newStatus);
                    } else {
                        toast(res.msg, "error");
                    }
                }
            );
        });
    });
    Storage.onChange("isSettingLocked", (val) => {
        const checkBox = document.querySelector("#Lock__Setting");
        checkBox.checked = val;
        toast(`Setting ${val ? "locked" : "unlocked"}.`, "success");
    });
};

export const isLockedSettings = async (Initialize) => {
    try {
        const { isSettingLocked } = await chrome.runtime.sendMessage({
            action: "isSettingLocked",
        });

        if (isSettingLocked) {
            const Settings = document.querySelector("#Settings");
            const Settings__BODY = Settings.innerHTML;
            Settings.innerHTML = ``;
            document.body.setAttribute("locked", "true");

            authenticateUserPIN((err, _) => {
                if (err) {
                    toast(`PIN Authentication error: ${err}`, "error");
                    return false;
                }
                Settings.innerHTML = Settings__BODY;
                document.body.removeAttribute("locked");
                Initialize();
            }, true);
            return true;
        }

        Initialize();
    } catch (error) {
        console.error("Error checking lock status:", error);
        toast("Failed to verify settings lock.", "error");
        return false;
    }
};

const fetchDomains = () =>
    new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "SecuredDomains" }, (response) => {
            if (response && response.data) {
                resolve(response.data);
            } else {
                reject(new Error("Failed to load domains"));
            }
        });
    });

const createDomainsList = () => {
    const domainsList = document.createElement("div");
    domainsList.classList.add("domains-container");
    domainsList.id = "domainsList";

    const addButtonContainer = document.createElement("div");
    addButtonContainer.className = "addButtonContainer";
    domainsList.appendChild(addButtonContainer);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "addButton";
    addButton.innerHTML = /*html*/ `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--text-primary)"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>
            <span>New</span>`;
    addButtonContainer.appendChild(addButton);

    // Create the "Reload" button
    const reloadButton = document.createElement("button");
    reloadButton.type = "button";
    reloadButton.className = "reloadButton";
    reloadButton.innerHTML = /*html*/ `<svg viewBox="0 0 24 24" height="24px" width="24px" fill="var(--text-primary)" xmlns="http://www.w3.org/2000/svg"><path d="M2 12C2 16.97 6.03 21 11 21C13.39 21 15.68 20.06 17.4 18.4L15.9 16.9C14.63 18.25 12.86 19 11 19C4.76 19 1.64 11.46 6.05 7.05C10.46 2.64 18 5.77 18 12H15L19 16H19.1L23 12H20C20 7.03 15.97 3 11 3C6.03 3 2 7.03 2 12Z"/></svg>
            <span>Reload</span>`;
    addButtonContainer.appendChild(reloadButton);

    // Create list container
    const ul = document.createElement("ul");
    ul.className = "site-list";
    domainsList.appendChild(ul);

    return [domainsList, addButton, ul, reloadButton];
};

const webICON = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjQiIHdpZHRoPSIyNCIgZmlsbD0iIzlhYTBhNiI+PHBhdGggZD0iTTExLjk5IDJDNi40NyAyIDIgNi40OCAyIDEyczQuNDcgMTAgOS45OSAxMEMxNy41MiAyMiAyMiAxNy41MiAyMiAxMlMxNy41MiAyIDExLjk5IDJ6bTYuOTMgNmgtMi45NWExNS42NSAxNS42NSAwIDAwLTEuMzgtMy41NkE4LjAzIDguMDMgMCAwMTE4LjkyIDh6TTEyIDQuMDRjLjgzIDEuMiAxLjQ4IDIuNTMgMS45MSAzLjk2aC0zLjgyYy40My0xLjQzIDEuMDgtMi43NiAxLjkxLTMuOTZ6TTQuMjYgMTRDNC4xIDEzLjM2IDQgMTIuNjkgNCAxMnMuMS0xLjM2LjI2LTJoMy4zOGMtLjA4LjY2LS4xNCAxLjMyLS4xNCAyIDAgLjY4LjA2IDEuMzQuMTQgMkg0LjI2em0uODIgMmgyLjk1Yy4zMiAxLjI1Ljc4IDIuNDUgMS4zOCAzLjU2QTcuOTg3IDcuOTg3IDAgMDE1LjA4IDE2em0yLjk1LThINS4wOGE3Ljk4NyA3Ljk4NyAwIDAxNC4zMy0zLjU2QTE1LjY1IDE1LjY1IDAgMDA4LjAzIDh6TTEyIDE5Ljk2Yy0uODMtMS4yLTEuNDgtMi41My0xLjkxLTMuOTZoMy44MmMtLjQzIDEuNDMtMS4wOCAyLjc2LTEuOTEgMy45NnpNMTQuMzQgMTRIOS42NmMtLjA5LS42Ni0uMTYtMS4zMi0uMTYtMiAwLS42OC4wNy0xLjM1LjE2LTJoNC42OGMuMDkuNjUuMTYgMS4zMi4xNiAyIDAgLjY4LS4wNyAxLjM0LS4xNiAyem0uMjUgNS41NmMuNi0xLjExIDEuMDYtMi4zMSAxLjM4LTMuNTZoMi45NWE4LjAzIDguMDMgMCAwMS00LjMzIDMuNTZ6TTE2LjM2IDE0Yy4wOC0uNjYuMTQtMS4zMi4xNC0yIDAtLjY4LS4wNi0xLjM0LS4xNC0yaDMuMzhjLjE2LjY0LjI2IDEuMzEuMjYgMnMtLjEgMS4zNi0uMjYgMmgtMy4zOHoiLz48L3N2Zz4=`;

export const SiteItemUI = (siteData) => {
    const li = document.createElement("li");
    li.className = "site-item";
    const siteDiv = document.createElement("div");
    siteDiv.className = "site-info";
    const favicon = document.createElement("img");
    favicon.className = "favicon";
    favicon.src = siteData.icon || webICON;
    favicon.alt = "Favicon";
    favicon.style.width = "24px";
    favicon.style.height = "24px";

    const siteAnchor = document.createElement("a");
    siteAnchor.textContent = siteData.site;
    siteAnchor.setAttribute("href", siteData.site);
    siteAnchor.setAttribute("target", "_blank");

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = `<svg height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>`;
    deleteBtn.className = "delete-btn";

    deleteBtn.addEventListener("click", async () => {
        try {
            await removeDomain(siteData, li);
        } catch (error) {
            toast(error.message, "error");
        }
    });
    siteDiv.appendChild(favicon);
    siteDiv.appendChild(siteAnchor);
    li.appendChild(siteDiv);
    li.appendChild(deleteBtn);
    return li;
};

const SHOWDomains = async (ul) => {
    const domains = await fetchDomains();
    ul.innerHTML = "";
    if (domains.length === 0) {
        return;
    }
    domains.forEach((site) => {
        const li = SiteItemUI(site);
        ul.appendChild(li);
    });
};

export const loadDomains = async () => {
    const [domainsList, addButton, ul, reloadButton] = createDomainsList();
    addButton.addEventListener("click", async () => {
        try {
            await addDomain();
        } catch (error) {
            toast(error.message, "error");
        }
    });

    const Settings = document.querySelector("#Settings");
    Settings.after(domainsList);
    SHOWDomains(ul);
    reloadButton.addEventListener("click", () => {
        SHOWDomains(ul);
    });
};
