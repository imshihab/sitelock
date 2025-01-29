// Constants
const STORAGE_KEY = "passkey_credentials";
const AUTO_LOGIN_KEY = "passkey_auto_login";
const FIRST_ATTEMPT = "FIRST_ATTEMPT";

// Utility functions
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateRandomChallenge = (length = 32) => {
    const challenge = new Uint8Array(length);
    crypto.getRandomValues(challenge);
    return challenge;
};

// DOM Helpers
const $ = document.querySelector.bind(document);
const container = $(".container");

const getCredentials = () =>
    JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const saveCredential = (credentialData) => {
    if (localStorage.getItem(STORAGE_KEY)) {
        throw new Error("Passkey already exists.");
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentialData));
};

const urlParams = new URLSearchParams(window.location.search);
const isSidePanel = urlParams.has("sidePanel");

if (isSidePanel) {
    // Create FAB elements
    const fab = document.createElement("button");
    fab.className = "fab-reload";

    // Create icon element
    const icon = document.createElement("span");
    icon.className = "material-icons";
    icon.textContent = "refresh";

    // Add click handler
    fab.addEventListener("click", () => {
        // Add ripple effect
        fab.style.animation = "ripple 0.6s linear";

        // Remove animation after completion
        setTimeout(() => {
            fab.style.animation = "";
        }, 600);

        // Reload the side panel
        window.location.reload();
    });

    // Assemble elements
    fab.appendChild(icon);
    document.body.appendChild(fab);
}

const createDomainsList = () => {
    const list = document.createElement("div");
    list.classList.add("domains-container");
    list.id = "domainsList";
    return list;
};

const createPasskeyContainer = () => {
    const container = document.createElement("div");
    container.className = "passkey-container";
    return container;
};

const createPinContainer = () => {
    const container = document.createElement("div");
    container.className = "pin-container";
    return container;
};

const showHidePassword = (dialog) => {
    // Create the show-hide button
    const showHideButton = document.createElement("button");
    showHideButton.type = "button"; // Prevent it from submitting a form
    showHideButton.className = "show-hide-button";
    const SHOW__ICON = `<svg viewBox="0 0 24 24" width="24px" height="24px" xmlns="http://www.w3.org/2000/svg"><path d="M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,4.5C17,4.5 21.27,7.61 23,12C21.27,16.39 17,19.5 12,19.5C7,19.5 2.73,16.39 1,12C2.73,7.61 7,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C15.76,17.5 19.17,15.36 20.82,12C19.17,8.64 15.76,6.5 12,6.5C8.24,6.5 4.83,8.64 3.18,12Z"/></svg>`;
    const HIDE__ICON = `<svg viewBox="0 0 24 24" width="24px" height="24px" xmlns="http://www.w3.org/2000/svg"><path d="M2,5.27L3.28,4L20,20.72L18.73,22L15.65,18.92C14.5,19.3 13.28,19.5 12,19.5C7,19.5 2.73,16.39 1,12C1.69,10.24 2.79,8.69 4.19,7.46L2,5.27M12,9A3,3 0 0,1 15,12C15,12.35 14.94,12.69 14.83,13L11,9.17C11.31,9.06 11.65,9 12,9M12,4.5C17,4.5 21.27,7.61 23,12C22.18,14.08 20.79,15.88 19,17.19L17.58,15.76C18.94,14.82 20.06,13.54 20.82,12C19.17,8.64 15.76,6.5 12,6.5C10.91,6.5 9.84,6.68 8.84,7L7.3,5.47C8.74,4.85 10.33,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C12.69,17.5 13.37,17.43 14,17.29L11.72,15C10.29,14.85 9.15,13.71 9,12.28L5.6,8.87C4.61,9.72 3.78,10.78 3.18,12Z"/></svg>`;
    showHideButton.innerHTML = SHOW__ICON;
    const passInput = dialog.querySelector(".passIcon");
    // Toggle password visibility when the button is clicked
    showHideButton.addEventListener("click", () => {
        if (passInput.type === "password") {
            passInput.type = "text";
            showHideButton.innerHTML = HIDE__ICON;
        } else {
            passInput.type = "password";
            showHideButton.innerHTML = SHOW__ICON;
        }
    });

    const passIconField = dialog.querySelector(".passIconField");
    passIconField.appendChild(showHideButton);
};

const createNewDialog = () => {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay-container");

    const dialog = document.createElement("div");
    dialog.classList.add("dialog-container");

    dialog.innerHTML = /*html*/ `
        <h3 class="auth-title">Add New Domain</h3>
        <form id="NewAuthForm">
            <div class="input-container">
                <input type="text" class="input-field urlIcon" id="NewSite" autocomplete="off" required placeholder=" ">
                <label for="NewSite" class="input-label">Domain:</label>
                <div class="active-indicator"></div>
            </div>
            <p class="supporting-text"></p>
            <div class="input-container passIconField">
                <input type="password" class="input-field passIcon" id="NewPassword" required placeholder=" ">
                <label for="NewPassword" class="input-label">Password:</label>
                <div class="active-indicator"></div>
            </div>
            <div class="requirement">At Least 4 Characters</div>
            <div class="pin-option">
                <label class="material-checkbox">
                    <input type="checkbox" id="pinOnlyCheckbox" name="PINonly" />
                    <span class="checkmark"></span><span class="label-text">Use PIN Only</span>
                </label>
            </div>
            <div class="button-container">
                <button type="button" id="newCancelBtn" class="button button-cancel">Cancel</button>
                <button type="submit" class="button button-submit">Submit</button>
            </div>
        </form>
    `;

    showHidePassword(dialog);

    overlay.appendChild(dialog);
    return overlay;
};

const createDeleteDialog = () => {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay-container");

    const dialog = document.createElement("div");
    dialog.classList.add("dialog-container");

    dialog.innerHTML = /*html*/ `
        <h3 class="auth-title">Authentication Required</h3>
        <form id="authForm">
            <div class="input-container passIconField">
                <input type="password" class="input-field passIcon" id="password" required placeholder=" ">
                <label for="password" class="input-label">Password:</label>
                <div class="active-indicator"></div>
            </div>
            <div class="button-container">
                <button type="button" id="cancelBtn" class="button button-cancel">Cancel</button>
                <button type="submit" class="button button-submit">Submit</button>
                ${
                    getCredentials().length !== 0
                        ? `<button type="button" id="passkeyBtn" class="button button-passkey">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M120-160v-112q0-34 17.5-62.5T184-378q62-31 126-46.5T440-440q20 0 40 1.5t40 4.5q-4 58 21 109.5t73 84.5v80H120ZM760-40l-60-60v-186q-44-13-72-49.5T600-420q0-58 41-99t99-41q58 0 99 41t41 99q0 45-25.5 80T790-290l50 50-60 60 60 60-80 80ZM440-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm300 80q17 0 28.5-11.5T780-440q0-17-11.5-28.5T740-480q-17 0-28.5 11.5T700-440q0 17 11.5 28.5T740-400Z"/></svg>
                </button>`
                        : ""
                }
            </div>
        </form>
    `;

    showHidePassword(dialog);
    overlay.appendChild(dialog);
    return overlay;
};

// PIN dialog to ask user for PIN verification to enable passkey.
const createPinDialog = () => {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay-container");

    const dialog = document.createElement("div");
    dialog.classList.add("dialog-container");

    dialog.innerHTML = /*html*/ `
        <h3 class="auth-title">Authentication Required</h3>
        <form id="pinForm">
            <div class="pin-input-container">
                <div class="pin-inputs">
                    <input type="text"
                        maxlength="1"
                        pattern="[0-9]" 
                        class="pin-box" 
                        inputmode="numeric" 
                        required>
                    <input type="text"
                        maxlength="1" 
                        pattern="[0-9]" 
                        class="pin-box" 
                        inputmode="numeric" 
                        required>
                    <input type="text"
                        maxlength="1" 
                        pattern="[0-9]" 
                        class="pin-box" 
                        inputmode="numeric" 
                        required>
                    <input type="text" 
                        maxlength="1" 
                        pattern="[0-9]" 
                        class="pin-box" 
                        inputmode="numeric" 
                        required>
                </div>
            </div>
            <div class="button-container">
                <button type="button" id="PINcancelBtn" class="button button-cancel">Cancel</button>
                <button type="submit" class="button button-submit">Submit</button>
            </div>
        </form>
    `;

    overlay.appendChild(dialog);
    return overlay;
};

// Passkey functions
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

async function checkUrl(url) {
    try {
        // Try to create URL object - this validates basic URL format
        const parsedUrl = new URL(url);

        try {
            const response = await fetch(parsedUrl.origin, {
                method: "HEAD",
                timeout: 100,
            });

            return {
                valid: true,
                message: new URL(response.url).origin + "/",
            };
        } catch (fetchError) {
            return { valid: false, message: "URL could not be reached" };
        }
    } catch (error) {
        return {
            valid: false,
            message: "Invalid URL format: URL must use http or https protocol",
        };
    }
}

const SiteItemUI = (siteData) => {
    // Create list item
    const li = document.createElement("li");
    li.className = "site-item";

    // Create site text
    const siteAnchor = document.createElement("a");
    siteAnchor.textContent = siteData.site;
    siteAnchor.setAttribute("href", siteData.site);
    siteAnchor.setAttribute("target", "_blank");

    // Create delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = `<svg height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>`;
    deleteBtn.className = "delete-btn";

    // Add delete functionality
    deleteBtn.addEventListener("click", async () => {
        try {
            if (siteData.pinOnly) {
                await deleteDomainPIN(siteData.site);
            } else {
                await deleteDomain(siteData.site);
            }

            li.remove();
            toast("Site successfully deleted");
        } catch (error) {
            toast(error.message, "error");
        }
    });

    // Assemble the list item
    li.appendChild(siteAnchor);
    li.appendChild(deleteBtn);
    return li;
};

// Domain management functions
const addDomain = async () => {
    const overlay = createNewDialog();
    document.body.appendChild(overlay);

    return new Promise((resolve, reject) => {
        const authForm = overlay.querySelector("#NewAuthForm");
        const cancelBtn = overlay.querySelector("#newCancelBtn");
        document.getElementById("NewSite").focus();

        authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const password = document.getElementById("NewPassword").value;
            const pinOnly = document.getElementById("pinOnlyCheckbox");
            const site = document.getElementById("NewSite").value;
            try {
                if (password.length < 4 && !pinOnly.checked) {
                    toast("Password must be at least 4 characters.", "error");
                    return;
                }
                document.querySelector(".supporting-text").textContent =
                    "Checking site...";
                const { valid, message: MessageOrUrl } = await checkUrl(site);

                if (valid === false) {
                    toast(MessageOrUrl, "error");
                    document.querySelector(".supporting-text").textContent = "";
                    return;
                }
                document.querySelector(".supporting-text").textContent =
                    "Valid site";

                if (pinOnly.checked) {
                    chrome.runtime.sendMessage(
                        {
                            type: "addDomainPINonly",
                            data: { site: MessageOrUrl, pinOnly: true },
                        },
                        (response) => {
                            if (response.status === "success") {
                                overlay.remove();
                                document
                                    .querySelector("#domainsList ul")
                                    .appendChild(
                                        SiteItemUI({
                                            site: MessageOrUrl,
                                            pinOnly: true,
                                        })
                                    );
                                resolve(response);
                            } else {
                                overlay.remove();
                                reject(new Error(response.msg));
                            }
                        }
                    );
                    return;
                }
                chrome.runtime.sendMessage(
                    {
                        type: "addDomain",
                        data: { site: MessageOrUrl, password },
                    },
                    (response) => {
                        if (response.status === "success") {
                            overlay.remove();
                            document
                                .querySelector("#domainsList ul")
                                .appendChild(
                                    SiteItemUI({ site: MessageOrUrl })
                                );
                            resolve(response);
                        } else {
                            overlay.remove();
                            reject(new Error(response.msg));
                        }
                    }
                );
            } catch (error) {
                reject(error);
                overlay.remove();
            }
        });

        let passwordvalue = "";
        document
            .getElementById("pinOnlyCheckbox")
            .addEventListener("click", function (e) {
                const Check_FIRST_ATTEMPT = localStorage.getItem(FIRST_ATTEMPT);
                if (Check_FIRST_ATTEMPT !== "false") {
                    // Prevent checkbox state change
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    chrome.runtime.sendMessage(
                        { action: "checkFirstInstall" },
                        (response) => {
                            if (response.error) {
                                toast(response.error, "error");
                                return;
                            }

                            if (response.isFirstInstall) {
                                toast(
                                    "Please set a PIN first to Use PIN Only.",
                                    "error"
                                );
                                // Force uncheck if already checked
                                this.checked = false;
                            }
                        }
                    );
                    return false;
                }
            });

        document
            .getElementById("pinOnlyCheckbox")
            .addEventListener("change", function (e) {
                // Only process changes that passed the click validation
                if (localStorage.getItem(FIRST_ATTEMPT) === "false") {
                    const showHideButton =
                        overlay.querySelector(".show-hide-button");

                    const passwordInput =
                        document.getElementById("NewPassword");
                    const requirementDiv =
                        document.querySelector(".requirement");

                    if (this.checked) {
                        passwordvalue = passwordInput.value; // Store in window object
                        passwordInput.value = "";
                        passwordInput.disabled = true;
                        passwordInput.removeAttribute("required");
                        passwordInput.placeholder = "Disabled (PIN only mode)";
                        requirementDiv.textContent =
                            "Using PIN-only authentication";
                        showHideButton.disabled = true;
                    } else {
                        passwordInput.value = passwordvalue || "";
                        passwordInput.disabled = false;
                        passwordInput.setAttribute("required", "");
                        passwordInput.placeholder = "Set A Password";
                        requirementDiv.textContent = "At Least 4 Characters";
                        showHideButton.disabled = false;
                    }
                } else {
                    // Force uncheck if validation failed
                    this.checked = false;
                }
            });

        cancelBtn.addEventListener("click", () => {
            overlay.remove();
            reject(new Error("Cancelled by user"));
        });

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                overlay.remove();
                reject(new Error("Cancelled by user"));
            }
        });
    });
};
const deleteDomain = async (site) => {
    const overlay = createDeleteDialog();
    document.body.appendChild(overlay);

    return new Promise((resolve, reject) => {
        const authForm = overlay.querySelector("#authForm");
        const cancelBtn = overlay.querySelector("#cancelBtn");
        const passkeyBtn = overlay.querySelector("#passkeyBtn");
        const passwordBtn = overlay.querySelector("#password");
        passwordBtn.focus();

        const handleDeleteResponse = (response) => {
            if (response.status === "success") {
                overlay.remove();
                resolve(response);
            } else {
                overlay.remove();
                reject(new Error(response.msg));
            }
        };

        authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const password = document.getElementById("password").value;
            try {
                chrome.runtime.sendMessage(
                    { type: "deleteDomain", data: { site, password } },
                    handleDeleteResponse
                );
            } catch (error) {
                reject(error);
                overlay.remove();
            }
        });

        passkeyBtn?.addEventListener("click", async () => {
            if (isSidePanel) {
                toast(
                    "Please open the extension Prefrences page to use passkey.",
                    "error"
                );
                return;
            }
            try {
                const challenge = generateRandomChallenge();
                const authOptions = {
                    challenge,
                    rpId: window.location.hostname,
                    userVerification: "required",
                    timeout: 60000,
                };

                await wait(1000);
                await navigator.credentials.get({ publicKey: authOptions });

                chrome.runtime.sendMessage(
                    { type: "deleteDomainPasskey", data: { site } },
                    handleDeleteResponse
                );
            } catch (error) {
                reject(error);
                overlay.remove();
            }
        });

        cancelBtn.addEventListener("click", () => {
            overlay.remove();
            reject(new Error("Cancelled by user"));
        });

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                overlay.remove();
                reject(new Error("Cancelled by user"));
            }
        });
    });
};

const deleteDomainPIN = async (site) => {
    const overlay = createPinDialog();
    document.body.appendChild(overlay);

    return new Promise((resolve, reject) => {
        const authForm = overlay.querySelector("#pinForm");
        const cancelBtn = overlay.querySelector("#PINcancelBtn");
        const pinBoxes = document.querySelectorAll(".pin-box");
        pinBoxes[0].focus();

        pinBoxes.forEach((box, index) => {
            box.addEventListener("input", (e) => {
                // Only allow digits
                e.target.value = e.target.value.replace(/[^0-9]/g, "");

                // Auto move to next input
                if (
                    e.target.value.length === 1 &&
                    index < pinBoxes.length - 1
                ) {
                    pinBoxes[index + 1].focus();
                }
            });

            // Allow backspace to move back
            box.addEventListener("keydown", (e) => {
                if (
                    e.key === "Backspace" &&
                    e.target.value === "" &&
                    index > 0
                ) {
                    pinBoxes[index - 1].focus();
                }
            });
        });

        authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const pin = Array.from(pinBoxes)
                .map((box) => box.value)
                .join("");

            try {
                chrome.runtime.sendMessage(
                    { type: "deleteDomainPIN", data: { site, pin } },
                    (response) => {
                        if (response.status === "success") {
                            overlay.remove();
                            resolve(response);
                        } else {
                            overlay.remove();
                            reject(new Error(response.msg));
                        }
                    }
                );
            } catch (error) {
                reject(error);
                overlay.remove();
            }
        });

        cancelBtn.addEventListener("click", () => {
            overlay.remove();
            reject(new Error("Cancelled by user"));
        });

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                overlay.remove();
                reject(new Error("Cancelled by user"));
            }
        });
    });
};

const loadDomains = () =>
    new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "SecuredDomains" }, (response) => {
            if (response && response.data) {
                resolve(response.data);
            } else {
                reject(new Error("Failed to load domains"));
            }
        });
    });

// UI functions
const showMessage = (message, targetContainer = createPasskeyContainer()) => {
    targetContainer.innerHTML = "";
    const messageSpan = document.createElement("span");
    messageSpan.textContent = message;
    targetContainer.appendChild(messageSpan);
    return targetContainer;
};

// Create a toggle switch element
const createToggleSwitch = (id, labelText) => {
    const toggleContainer = document.createElement("div");
    toggleContainer.className = "toggle-container";

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.id = id;
    toggle.className = "toggle-switch";

    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = labelText;
    label.className = "toggle-label";

    toggleContainer.appendChild(toggle);
    toggleContainer.appendChild(label);

    return { toggleContainer, toggle };
};

// Update passkey status
const updatePasskeyStatus = (isAutoLogin, isFirst = true) => {
    const message = isAutoLogin
        ? "Passkey Authentication Enabled (Auto-login On)"
        : "Passkey Authentication Enabled (Auto-login Off)";
    if (isFirst === false) {
        document.querySelector(".passkey-container span").textContent = message;
    } else {
        return message;
    }
};

const setupPasskeyRegistration = async (container, redirectUrl) => {
    const h4 = document.createElement("h4");
    h4.textContent = "Passkey Authentication Required";
    container.appendChild(h4);

    const regButton = document.createElement("button");
    regButton.id = "create-passkey";
    regButton.textContent = "Enable Passkey Protection";
    container.appendChild(regButton);

    regButton.addEventListener("click", async () => {
        if (isSidePanel) {
            toast(
                "Please open the extension Prefrences page to enable passkey.",
                "error"
            );
            return;
        }
        const Check_FIRST_ATTEMPT = localStorage.getItem(FIRST_ATTEMPT);
        if (Check_FIRST_ATTEMPT !== "false") {
            chrome.runtime.sendMessage(
                { action: "checkFirstInstall" },
                (response) => {
                    if (response.error) {
                        toast(response.error, "error");
                        return;
                    }

                    const isFirstInstall = response.isFirstInstall;
                    if (isFirstInstall) {
                        toast(
                            "Please set a PIN first before enabling passkey protection.",
                            "error"
                        );
                    }
                }
            );
            return;
        }

        const overlay = createPinDialog();
        document.body.appendChild(overlay);

        const cancelBtn = overlay.querySelector("#PINcancelBtn");
        cancelBtn.addEventListener("click", () => {
            overlay.remove();
            toast("Cancelled by user", "error");
        });

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                overlay.remove();
                toast("Cancelled by user", "error");
            }
        });

        const pinBoxes = document.querySelectorAll(".pin-box");
        pinBoxes[0].focus();

        pinBoxes.forEach((box, index) => {
            box.addEventListener("input", (e) => {
                // Only allow digits
                e.target.value = e.target.value.replace(/[^0-9]/g, "");

                // Auto move to next input
                if (
                    e.target.value.length === 1 &&
                    index < pinBoxes.length - 1
                ) {
                    pinBoxes[index + 1].focus();
                }
            });

            // Allow backspace to move back
            box.addEventListener("keydown", (e) => {
                if (
                    e.key === "Backspace" &&
                    e.target.value === "" &&
                    index > 0
                ) {
                    pinBoxes[index - 1].focus();
                }
            });
        });

        const PinForm = overlay.querySelector("#pinForm");
        PinForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const pin = Array.from(pinBoxes)
                .map((box) => box.value)
                .join("");

            toast("Checking PIN...");
            chrome.runtime.sendMessage(
                { action: "checkPin", pin: pin },
                (response) => {
                    if (response.status === "success") {
                        toast("PIN successfully verified.");
                        overlay.remove();

                        registerCredential()
                            .then(() => {
                                toast("Passkey Successfully Created");
                                showMessage(
                                    "Passkey Authentication Enabled",
                                    container
                                );
                                chrome.runtime.sendMessage(
                                    { action: "passkeyEnabled" },
                                    (response) => {
                                        if (response.error) {
                                            console.error(
                                                "Error notifying background about passkey:",
                                                response.error
                                            );
                                        }
                                        if (redirectUrl) {
                                            window.location.href = redirectUrl;
                                        } else {
                                            window.location.reload();
                                        }
                                    }
                                );
                            })
                            .catch((error) => {
                                toast(
                                    `Error during passkey creation: ${error.message}`,
                                    "error"
                                );
                            });
                    } else {
                        toast(response.msg, "error");
                    }
                }
            );
        });
        return;
    });
};

// Main initialization
const initApp = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get("redirect");

    try {
        const passkeyContainer = createPasskeyContainer();
        const domainsList = createDomainsList();

        const Check_FIRST_ATTEMPT = localStorage.getItem(FIRST_ATTEMPT);

        if (Check_FIRST_ATTEMPT !== "false") {
            chrome.runtime.sendMessage(
                { action: "checkFirstInstall" },
                (response) => {
                    if (response.error) {
                        toast(response.error, "error");
                        return;
                    }

                    const isFirstInstall = response.isFirstInstall;
                    if (isFirstInstall) {
                        const pinContainer = createPinContainer();
                        pinContainer.innerHTML = /*html*/ `
                        <p>Set a PIN to securely authenticate yourself, even if you forget other passwords. This PIN will also be needed before adding new passkeys.</p>
                        <form id="createPinForm">
                            <h4 class="pintitle">Set a PIN</h4>
                            <div class="pin-input-container">
                                <div class="pin-inputs">
                                    <input type="text"
                                        maxlength="1"
                                        pattern="[0-9]" 
                                        class="pin-box" 
                                        inputmode="numeric" 
                                        required>
                                    <input type="text"
                                        maxlength="1" 
                                        pattern="[0-9]" 
                                        class="pin-box" 
                                        inputmode="numeric" 
                                        required>
                                    <input type="text"
                                        maxlength="1" 
                                        pattern="[0-9]" 
                                        class="pin-box" 
                                        inputmode="numeric" 
                                        required>
                                    <input type="text" 
                                        maxlength="1" 
                                        pattern="[0-9]" 
                                        class="pin-box" 
                                        inputmode="numeric" 
                                        required>
                                </div>
                            </div>
                            <div class="button-container">
                                <button type="button" id="PINclearBtn" class="button button-cancel button-clear">Clear</button>
                                <button type="submit" id="createPinBtn" class="button button-submit">Next</button>
                            </div>
                        </form>`;

                        container.appendChild(pinContainer);
                        let firstPin = "";

                        const pinBoxes = document.querySelectorAll(".pin-box");
                        const title = pinContainer.querySelector("h4");
                        const createPinBtn =
                            document.getElementById("createPinBtn");

                        const clearBtn = document.getElementById("PINclearBtn");
                        clearBtn.addEventListener("click", () => {
                            Array.from(pinBoxes).forEach(
                                (box) => (box.value = "")
                            );
                            pinBoxes[0].focus();
                        });

                        pinBoxes.forEach((box, index) => {
                            box.addEventListener("input", (e) => {
                                // Only allow digits
                                e.target.value = e.target.value.replace(
                                    /[^0-9]/g,
                                    ""
                                );

                                // Auto move to next input
                                if (
                                    e.target.value.length === 1 &&
                                    index < pinBoxes.length - 1
                                ) {
                                    pinBoxes[index + 1].focus();
                                }

                                if (
                                    e.target.value.length === 1 &&
                                    index === pinBoxes.length - 1
                                ) {
                                    createPinBtn.classList.add("active");
                                } else {
                                    createPinBtn.classList.remove("active");
                                }
                            });

                            // Allow backspace to move back
                            box.addEventListener("keydown", (e) => {
                                if (
                                    e.key === "Backspace" &&
                                    e.target.value === "" &&
                                    index > 0
                                ) {
                                    pinBoxes[index - 1].focus();
                                }

                                if (
                                    e.target.value.length === 1 &&
                                    index === pinBoxes.length - 1
                                ) {
                                    createPinBtn.classList.add("active");
                                } else {
                                    createPinBtn.classList.remove("active");
                                }
                            });
                        });

                        const createPinForm =
                            pinContainer.querySelector("#createPinForm");
                        createPinForm.addEventListener(
                            "submit",
                            async (event) => {
                                event.preventDefault();

                                const pin = Array.from(pinBoxes)
                                    .map((box) => box.value)
                                    .join("");

                                if (pin.length < 4) {
                                    toast(
                                        "PIN must be exactly 4 digits.",
                                        "error"
                                    );
                                    return;
                                }

                                if (!/^\d{4}$/.test(pin)) {
                                    toast(
                                        "PIN must be exactly 4 digits.",
                                        "error"
                                    );
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
                                    Array.from(pinBoxes).forEach(
                                        (box) => (box.value = "")
                                    );
                                    pinBoxes[0].focus();
                                    return;
                                }

                                chrome.runtime.sendMessage(
                                    { action: "createPin", pin: pin },
                                    (response) => {
                                        if (response.status === "success") {
                                            toast("PIN successfully created.");
                                            pinContainer.remove();

                                            localStorage.setItem(
                                                FIRST_ATTEMPT,
                                                "false"
                                            );
                                        } else {
                                            toast(response.msg, "error");
                                        }
                                    }
                                );
                            }
                        );
                    } else {
                        localStorage.setItem(FIRST_ATTEMPT, "false");
                    }
                }
            );
            setTimeout(() => {
                container.appendChild(passkeyContainer);
                container.appendChild(domainsList);
            }, 100);
        } else {
            container.appendChild(passkeyContainer);
            container.appendChild(domainsList);
        }

        const isSupported = await isPasskeySupported();
        if (isSupported) {
            const credentials = getCredentials();
            if (credentials.length === 0) {
                await setupPasskeyRegistration(passkeyContainer, redirectUrl);
            } else {
                if (redirectUrl) {
                    window.location.href = redirectUrl;
                    return;
                }
                const isAutoLogin =
                    localStorage.getItem("passkeyAutoLogin") === "true";
                showMessage(updatePasskeyStatus(isAutoLogin), passkeyContainer);
                // Add auto-login toggle
                const { toggleContainer, toggle } = createToggleSwitch(
                    "autoLoginToggle",
                    "Enable automatic passkey login"
                );
                // Set initial state from localStorage
                toggle.checked = isAutoLogin;
                // Add change event listener
                toggle.addEventListener("change", (e) => {
                    localStorage.setItem("passkeyAutoLogin", e.target.checked);
                    updatePasskeyStatus(e.target.checked, false);
                });
                passkeyContainer.appendChild(toggleContainer);
            }
        } else {
            showMessage(
                "This device does not support passkeys.",
                passkeyContainer
            );
        }

        // Load and display domains
        try {
            const domains = await loadDomains();
            const newButtonContainer = document.createElement("div");
            newButtonContainer.className = "newButtonContainer";
            domainsList.appendChild(newButtonContainer);

            const newButton = document.createElement("button");
            newButton.type = "button";
            newButton.className = "newButton ripple_effect";
            newButton.innerHTML = /*html*/ `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--text-primary)"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>
            <span>New</span>`;
            newButtonContainer.appendChild(newButton);

            newButton.addEventListener("click", async () => {
                try {
                    await addDomain();
                    toast("Site successfully added");
                    if (!chrome?.runtime?.id) {
                        window.location.reload();
                    }
                } catch (error) {
                    toast(error.message, "error");
                }
            });

            // Create list container
            const ul = document.createElement("ul");
            ul.className = "site-list";
            domainsList.appendChild(ul);

            // If no domains, return early
            if (domains.length === 0) {
                return;
            }

            // Render each domain
            domains.forEach((site) => {
                const li = SiteItemUI(site);
                ul.appendChild(li);
            });
        } catch (error) {
            toast("Failed to load protected domains.", "error");
        }
    } catch (error) {
        toast("Failed to initialize application.", "error");
    }
};

// Start the application
(async () => {
    await initApp();
    // Theme management
    const themeOptions = {
        light: "light",
        dark: "dark",
        system: "system",
    };

    // Initialize system theme detection
    const systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");

    function getCurrentTheme() {
        return localStorage.getItem("theme") || themeOptions.system;
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
    }

    function setTheme(theme) {
        localStorage.setItem("theme", theme);

        if (theme === themeOptions.system) {
            applyTheme(
                systemThemeMedia.matches
                    ? themeOptions.dark
                    : themeOptions.light
            );
        } else {
            applyTheme(theme);
        }
    }

    // Get stored theme or default to system
    const storedTheme = getCurrentTheme();

    // Initialize theme
    setTheme(storedTheme);

    // Handle system theme changes
    systemThemeMedia.addEventListener("change", (e) => {
        if (getCurrentTheme() === themeOptions.system) {
            applyTheme(e.matches ? themeOptions.dark : themeOptions.light);
        }
    });

    // Set up button handlers
    const buttons = document.querySelectorAll(".theme-option");
    buttons.forEach((button) => {
        // Set initial active state
        if (button.dataset.theme === storedTheme) {
            button.classList.add("active");
        }

        // Add click handler
        button.addEventListener("click", () => {
            setTheme(button.dataset.theme);

            // Update active state
            buttons.forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");
        });
    });
})();
