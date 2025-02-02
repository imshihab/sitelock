import {
    checkFirstInstall,
    CONSTANT,
    SiteItemUI,
    PINInputsFunction,
    generateRandomChallenge,
} from "./helpers.js";
import Storage from "./esmls.js";
import toast from "./toast.js";

async function checkUrl(url) {
    try {
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
            return {
                valid: false,
                message:
                    "URL could not be reached. Open a new tab and use the popup",
            };
        }
    } catch (error) {
        return {
            valid: false,
            message: "Invalid URL format: URL must use http or https protocol",
        };
    }
}

export const showHidePassword = (dialog, inputSelector) => {
    const showHideButton = document.createElement("button");
    showHideButton.type = "button";
    showHideButton.className = "show-hide-button";
    const SHOW__ICON = `<svg viewBox="0 0 24 24" width="24px" height="24px" xmlns="http://www.w3.org/2000/svg"><path d="M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,4.5C17,4.5 21.27,7.61 23,12C21.27,16.39 17,19.5 12,19.5C7,19.5 2.73,16.39 1,12C2.73,7.61 7,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C15.76,17.5 19.17,15.36 20.82,12C19.17,8.64 15.76,6.5 12,6.5C8.24,6.5 4.83,8.64 3.18,12Z"/></svg>`;
    const HIDE__ICON = `<svg viewBox="0 0 24 24" width="24px" height="24px" xmlns="http://www.w3.org/2000/svg"><path d="M2,5.27L3.28,4L20,20.72L18.73,22L15.65,18.92C14.5,19.3 13.28,19.5 12,19.5C7,19.5 2.73,16.39 1,12C1.69,10.24 2.79,8.69 4.19,7.46L2,5.27M12,9A3,3 0 0,1 15,12C15,12.35 14.94,12.69 14.83,13L11,9.17C11.31,9.06 11.65,9 12,9M12,4.5C17,4.5 21.27,7.61 23,12C22.18,14.08 20.79,15.88 19,17.19L17.58,15.76C18.94,14.82 20.06,13.54 20.82,12C19.17,8.64 15.76,6.5 12,6.5C10.91,6.5 9.84,6.68 8.84,7L7.3,5.47C8.74,4.85 10.33,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C12.69,17.5 13.37,17.43 14,17.29L11.72,15C10.29,14.85 9.15,13.71 9,12.28L5.6,8.87C4.61,9.72 3.78,10.78 3.18,12Z"/></svg>`;
    showHideButton.innerHTML = SHOW__ICON;
    const passInput = dialog.querySelector(inputSelector);
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

    showHidePassword(dialog, "#NewPassword");
    overlay.appendChild(dialog);

    const cancelBtn = overlay.querySelector("#newCancelBtn");
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

    const pinOnlyCheckbox = overlay.querySelector("#pinOnlyCheckbox");
    const showHideButton = overlay.querySelector(".show-hide-button");
    const passwordInput = overlay.querySelector("#NewPassword");
    const requirementDiv = overlay.querySelector(".requirement");

    const IsPinOnly = Storage.get(CONSTANT.IS_PIN_Only, false);
    pinOnlyCheckbox.checked = IsPinOnly;

    if (IsPinOnly) {
        passwordInput.value = "";
        passwordInput.disabled = true;
        passwordInput.removeAttribute("required");
        passwordInput.placeholder = "Disabled (PIN only mode)";
        requirementDiv.textContent = "Using PIN-only authentication";
        showHideButton.disabled = true;
    }

    let passwordvalue = "";
    pinOnlyCheckbox.addEventListener("click", async function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        const [error, isFirstInstall] = await checkFirstInstall();
        if (error) {
            console.error("Error checking first install:", error);
            return;
        }

        if (isFirstInstall) {
            toast("Please set a PIN first to Use PIN Only.", "error");
            this.checked = false;
            return;
        }

        if (this.checked) {
            this.checked = false;
            passwordInput.value = passwordvalue || "";
            passwordInput.disabled = false;
            passwordInput.setAttribute("required", "");
            passwordInput.placeholder = "Set A Password";
            requirementDiv.textContent = "At Least 4 Characters";
            showHideButton.disabled = false;
        } else {
            this.checked = true;
            passwordvalue = passwordInput.value; // Store in window object
            passwordInput.value = "";
            passwordInput.disabled = true;
            passwordInput.removeAttribute("required");
            passwordInput.placeholder = "Disabled (PIN only mode)";
            requirementDiv.textContent = "Using PIN-only authentication";
            showHideButton.disabled = true;
        }
    });

    return overlay;
};

const createDeleteDialog = async (siteData, li) => {
    const { isEnabled } = await chrome.runtime.sendMessage({
        action: "getPasskeyStatus",
    });
    const overlay = document.createElement("div");
    overlay.classList.add("overlay-container");

    const dialog = document.createElement("div");
    dialog.classList.add("dialog-container");

    dialog.innerHTML = /*html*/ `
        <h3 class="auth-title">Authentication Required</h3>
        <form id="authForm">
            <div class="button-container">
                <button type="button" id="cancelBtn" class="button button-cancel">Cancel</button>
                <button type="submit" class="button button-submit">Submit</button>
                ${
                    isEnabled
                        ? `<button type="button" id="passkeyBtn" class="button button-passkey">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M120-160v-112q0-34 17.5-62.5T184-378q62-31 126-46.5T440-440q20 0 40 1.5t40 4.5q-4 58 21 109.5t73 84.5v80H120ZM760-40l-60-60v-186q-44-13-72-49.5T600-420q0-58 41-99t99-41q58 0 99 41t41 99q0 45-25.5 80T790-290l50 50-60 60 60 60-80 80ZM440-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm300 80q17 0 28.5-11.5T780-440q0-17-11.5-28.5T740-480q-17 0-28.5 11.5T700-440q0 17 11.5 28.5T740-400Z"/></svg>
                </button>`
                        : ""
                }
            </div>
        </form>
    `;
    overlay.appendChild(dialog);

    if (siteData.pinOnly) {
        const PINinputContainer = document.createElement("div");
        PINinputContainer.className = "pin-input-container";
        PINinputContainer.appendChild(PINInputsFunction());
        dialog.querySelector(".button-container").before(PINinputContainer);
    } else {
        const PassWordContainer = document.createElement("div");
        PassWordContainer.className = "input-container passIconField";
        PassWordContainer.innerHTML = `
            <input type="password" class="input-field passIcon" id="password" required placeholder=" ">
            <label for="password" class="input-label">Password:</label>
            <div class="active-indicator"></div>`;
        dialog.querySelector(".button-container").before(PassWordContainer);
        showHidePassword(dialog, "#password");
    }

    const cancelBtn = overlay.querySelector("#cancelBtn");
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
    return overlay;
};

// Domain management functions
export const addDomain = async () => {
    const overlay = createNewDialog();
    document.body.appendChild(overlay);
    overlay.querySelector("#NewSite").focus();

    const authForm = overlay.querySelector("#NewAuthForm");

    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = overlay.querySelector("#NewPassword").value;
        const pinOnly = overlay.querySelector("#pinOnlyCheckbox").checked;
        const site = overlay.querySelector("#NewSite").value;

        try {
            if (pinOnly === false && password.length < 4) {
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

            chrome.runtime.sendMessage(
                {
                    type: "addDomain",
                    data: { site: site, password, pinOnly },
                },
                (response) => {
                    if (response.status === "success") {
                        overlay.remove();
                        document
                            .querySelector("#domainsList ul")
                            .appendChild(
                                SiteItemUI({ site: MessageOrUrl, pinOnly })
                            );
                        toast("Site successfully added");
                    } else {
                        overlay.remove();
                        toast(response.msg, "error");
                    }
                }
            );
        } catch (err) {}
    });
};

export const removeDomain = async (siteData, li) => {
    const overlay = await createDeleteDialog(siteData, li);
    document.body.appendChild(overlay);

    const authForm = overlay.querySelector("#authForm");
    const pinBoxes = overlay.querySelectorAll(".pin-box");
    const Password = overlay.querySelector("#password");
    const passkeyBtn = overlay.querySelector("#passkeyBtn");
    pinBoxes[0]?.focus();
    Password?.focus();

    const handleDeleteResponse = (response) => {
        if (response.status === "success") {
            overlay.remove();
            li.remove();
            toast("Site successfully deleted");
        } else {
            toast(response.msg, "error");
        }
    };

    passkeyBtn?.addEventListener("click", async () => {
        try {
            const challenge = generateRandomChallenge();
            const authOptions = {
                challenge,
                rpId: window.location.hostname,
                userVerification: "required",
                timeout: 60000,
            };

            await navigator.credentials.get({ publicKey: authOptions });

            chrome.runtime.sendMessage(
                { type: "deleteDomainPasskey", data: { site: siteData.site } },
                handleDeleteResponse
            );
        } catch (error) {
            toast(error, "error");
        }
    });

    authForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = Password?.value;
        const pin = Array.from(pinBoxes)
            .map((box) => box.value)
            .join("");

        try {
            chrome.runtime.sendMessage(
                {
                    type: "deleteDomain",
                    data: {
                        site: siteData.site,
                        password,
                        pin,
                        IsPinOnly: siteData.pinOnly,
                    },
                },
                handleDeleteResponse
            );
        } catch (error) {
            toast(error, "error");
            overlay.remove();
        }
    });

    Password?.addEventListener("keyup", (event) => {
        if (
            Storage.get(CONSTANT.Auto_Confirm) &&
            Password?.value.length >= siteData.range
        ) {
            const event = new Event("submit");
            authForm.dispatchEvent(event);
        }
    });

    pinBoxes?.forEach((box) => {
        box?.addEventListener("input", () => {
            const pin = Array.from(pinBoxes)
                .map((box) => box.value)
                .join("");
            if (Storage.get(CONSTANT.Auto_Confirm) && pin.length === 4) {
                const event = new Event("submit");
                authForm.dispatchEvent(event);
            }
        });
    });
};
