// Constants
const STORAGE_KEY = "passkey_credentials";
const AUTO_LOGIN_KEY = "passkey_auto_login";

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

const createDomainsList = () => {
    const list = document.createElement("div");
    list.classList.add("domains-container");
    return list;
};

const createPasskeyContainer = () => {
    const container = document.createElement("div");
    container.className = "passkey-container";
    return container;
};

const createDeleteDialog = () => {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay-container");

    const dialog = document.createElement("div");
    dialog.classList.add("dialog-container");

    dialog.innerHTML = `
        <h3 class="auth-title">Authentication Required</h3>
        <form id="authForm">
            <div class="input-container">
                <input type="password" class="input-field" id="password" required placeholder=" ">
                <label for="password" class="input-label">Password:</label>
            </div>
            <div class="button-container">
                <button type="button" id="cancelBtn" class="button button-cancel">Cancel</button>
                <button type="submit" class="button button-submit">Submit</button>
                <button type="button" id="passkeyBtn" class="button button-passkey">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M120-160v-112q0-34 17.5-62.5T184-378q62-31 126-46.5T440-440q20 0 40 1.5t40 4.5q-4 58 21 109.5t73 84.5v80H120ZM760-40l-60-60v-186q-44-13-72-49.5T600-420q0-58 41-99t99-41q58 0 99 41t41 99q0 45-25.5 80T790-290l50 50-60 60 60 60-80 80ZM440-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm300 80q17 0 28.5-11.5T780-440q0-17-11.5-28.5T740-480q-17 0-28.5 11.5T700-440q0 17 11.5 28.5T740-400Z"/></svg>
                </button>
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

const getCredentials = () =>
    JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const saveCredential = (credentialData) => {
    if (localStorage.getItem(STORAGE_KEY)) {
        throw new Error("Passkey already exists.");
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentialData));
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

// Domain management functions
const deleteDomain = async (site) => {
    const overlay = createDeleteDialog();
    document.body.appendChild(overlay);

    return new Promise((resolve, reject) => {
        const authForm = overlay.querySelector("#authForm");
        const cancelBtn = overlay.querySelector("#cancelBtn");
        const passkeyBtn = overlay.querySelector("#passkeyBtn");

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

        passkeyBtn.addEventListener("click", async () => {
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
        try {
            await registerCredential();
            toast("Passkey Successfully Created");
            showMessage("Passkey Authentication Enabled", container);
            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else {
                window.location.reload();
            }
        } catch (error) {
            toast(`Error during passkey creation: ${error.message}`, "error");
        }
    });
};

// Main initialization
const initApp = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get("redirect");

    try {
        const isSupported = await isPasskeySupported();
        if (!isSupported) {
            showMessage("This device does not support passkeys.");
            return;
        }

        const passkeyContainer = createPasskeyContainer();
        const domainsList = createDomainsList();

        container.appendChild(passkeyContainer);
        container.appendChild(domainsList);

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

        // Load and display domains
        try {
            const domains = await loadDomains();

            // Set up header
            domainsList.innerHTML = "<h3>Protected Sites:</h3>";

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
                // Create list item
                const li = document.createElement("li");
                li.className = "site-item";

                // Create site text
                const siteText = document.createElement("span");
                siteText.textContent = site;

                // Create delete button
                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = "Delete";
                deleteBtn.className = "delete-btn";

                // Add delete functionality
                deleteBtn.addEventListener("click", async () => {
                    try {
                        await deleteDomain(site);
                        li.remove();
                        toast("Site successfully deleted");
                    } catch (error) {
                        toast(error.message, "error");
                    }
                });

                // Assemble the list item
                li.appendChild(siteText);
                li.appendChild(deleteBtn);
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
})();
