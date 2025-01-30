import Storage from "./esmls.js";
import toast from "./toast.js";

const CONSTANT = {
    FIRST_ATTEMPT: "FIRST_ATTEMPT",
    STORAGE_KEY: "passkey_credentials",
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

const generateRandomChallenge = (length = 32) => {
    const challenge = new Uint8Array(length);
    crypto.getRandomValues(challenge);
    return challenge;
};

const getCredentials = () => Storage.get(CONSTANT.STORAGE_KEY, {});
const saveCredential = (credentialData) => {
    if (Storage.get(CONSTANT.STORAGE_KEY)) {
        throw new Error("Passkey already exists.");
    }
    Storage.set(CONSTANT.STORAGE_KEY, credentialData);
};

const redirectUrl = () =>
    new URLSearchParams(window.location.search).get("redirect");

const PINInputsFunction = () => {
    const container = document.createElement("div");
    container.className = "pin-inputs";
    container.innerHTML = /*html*/ `
            <input type="text" maxlength="1" pattern="[0-9]" class="pin-box" inputmode="numeric" required="">
            <input type="text" maxlength="1" pattern="[0-9]" class="pin-box" inputmode="numeric" required="">
            <input type="text" maxlength="1" pattern="[0-9]" class="pin-box" inputmode="numeric" required="">
            <input type="text" maxlength="1" pattern="[0-9]" class="pin-box" inputmode="numeric" required="">`;

    const pinBoxes = container.querySelectorAll(".pin-box");
    pinBoxes.forEach((box, index) => {
        box.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, "");
            if (e.target.value.length === 1 && index < pinBoxes.length - 1) {
                pinBoxes[index + 1].focus();
            }
        });

        box.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && e.target.value === "" && index > 0) {
                pinBoxes[index - 1].focus();
            }
        });
    });
    return container;
};

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

const createPinDialog = (submitForm) => {
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

    const PinForm = overlay.querySelector("#pinForm");
    PinForm.addEventListener("submit", (e) => {
        const pin = Array.from(pinBoxes)
            .map((box) => box.value)
            .join("");
        submitForm(e, pin, overlay);
    });

    document.body.appendChild(overlay);

    const pinBoxes = overlay.querySelectorAll(".pin-box");
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

const authenticateUserPIN = () => {
    return new Promise((resolve) => {
        createPinDialog(async (event, pin, overlay) => {
            event.preventDefault();
            try {
                chrome.runtime.sendMessage(
                    { action: "checkPin", pin: pin },
                    (response) => {
                        if (response.status === "success") {
                            overlay.remove();
                            resolve([null, pin]);
                        } else {
                            resolve([response.msg, false]);
                        }
                    }
                );
            } catch (error) {
                resolve([error.message, false]);
            }
        });
    });
};

export const SetUpPasskeyLogin = async () => {
    const isSupported = await isPasskeySupported();
    if (!isSupported) {
        const SettingItemPasskeyLogin =
            document.querySelector("#PASSKEY__LOGIN");
        SettingItemPasskeyLogin.innerHTML = `This device does not support passkeys.`;
        return;
    }

    const credentials = getCredentials();

    if (Object.keys(credentials).length > 0 && redirectUrl()) {
        window.location.href = redirectUrl();
        return;
    }

    const checkBox = document.querySelector("#Passkey_Login > input");
    try {
        const response = await chrome.runtime.sendMessage({
            action: "getPasskeyStatus",
        });
        const hasPasskey = response.hasPasskey;
        const isEnabled = response.isEnabled;
        Storage.set("passkeyStatus", hasPasskey && isEnabled);
        checkBox.checked = hasPasskey && isEnabled;
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
                const [err, pin] = await authenticateUserPIN();
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
                                toast("Passkey created successfully");
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
            }

            const [err, pin] = await authenticateUserPIN();
            if (err) {
                toast(err, "error");
                return;
            }
            const newState = !isEnabled;
            checkBox.checked = newState;
            Storage.set("passkeyStatus", newState);

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
        } catch (error) {
            toast("Operation failed. Please try again.", "error");
            const { hasPasskey, isEnabled } = await chrome.runtime.sendMessage({
                action: "getPasskeyStatus",
            });
            Storage.set("passkeyStatus", hasPasskey && isEnabled);
            checkBox.checked = hasPasskey && isEnabled;
        }
    });
    Storage.onChange("passkeyStatus", (val) => {
        checkBox.checked = val;
    });
};
