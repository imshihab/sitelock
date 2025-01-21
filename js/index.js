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

const getCredentials = () =>
    JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const saveCredential = (credentialData) => {
    if (localStorage.getItem(STORAGE_KEY)) {
        throw new Error("Passkey already exists.");
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentialData));
};

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

const createNewDialog = () => {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay-container");

    const dialog = document.createElement("div");
    dialog.classList.add("dialog-container");

    dialog.innerHTML = `
        <h3 class="auth-title">Add New Domain</h3>
        <form id="NewAuthForm">
            <div class="input-container">
                <input type="text" class="input-field" id="NewSite" required placeholder=" ">
                <label for="NewSite" class="input-label">Domain:</label>
            </div>
            <div class="input-container">
                <input type="password" class="input-field" id="NewPassword" required placeholder=" ">
                <label for="NewPassword" class="input-label">Password:</label>
            </div>
            <div class="button-container">
                <button type="button" id="newCancelBtn" class="button button-cancel">Cancel</button>
                <button type="submit" class="button button-submit">Submit</button>
            </div>
            <p class="loading-text"></p>
        </form>
    `;

    overlay.appendChild(dialog);
    return overlay;
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
    console.log(url);

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
                message: response.url,
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

// Domain management functions
const addDomain = async (site) => {
    const overlay = createNewDialog();
    document.body.appendChild(overlay);

    return new Promise((resolve, reject) => {
        const authForm = overlay.querySelector("#NewAuthForm");
        const cancelBtn = overlay.querySelector("#newCancelBtn");

        authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const password = document.getElementById("NewPassword").value;
            const site = document.getElementById("NewSite").value;
            try {
                if (password.length < 4) {
                    toast("Password must be at least 4 characters.", "error");
                    return;
                }
                document.querySelector(".loading-text").textContent =
                    "Checking site...";
                const { valid, message } = await checkUrl(site);

                if (valid === false) {
                    toast(message, "error");
                    document.querySelector(".loading-text").textContent = "";
                    return;
                }
                document.querySelector(".loading-text").textContent =
                    "Valid site";

                chrome.runtime.sendMessage(
                    {
                        type: "addDomain",
                        data: { site: message, password },
                    },
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

        passkeyBtn?.addEventListener("click", async () => {
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
            // add newButton inside a new div and put that div inside the domainsList
            const newButtonContainer = document.createElement("div");
            newButtonContainer.className = "newButtonContainer";
            domainsList.appendChild(newButtonContainer);

            const newButton = document.createElement("button");
            newButton.type = "button";
            newButton.className = "newButton ripple_effect";
            newButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--text-primary)"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>
            <span>New</span>`;
            newButtonContainer.appendChild(newButton);

            newButton.addEventListener("click", async () => {
                try {
                    await addDomain();
                    toast("Site successfully added");
                    window.location.reload();
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
                // Create list item
                const li = document.createElement("li");
                li.className = "site-item";

                // Create site text
                const siteAnchor = document.createElement("a");
                siteAnchor.textContent = site;
                siteAnchor.setAttribute("href", site);
                siteAnchor.setAttribute("target", "_blank");

                // Create delete button
                const deleteBtn = document.createElement("button");
                deleteBtn.innerHTML = `<svg height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>`;
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
                li.appendChild(siteAnchor);
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
