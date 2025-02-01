import { checkFirstInstall, CONSTANT, SiteItemUI } from "./helpers.js";
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
        toast("Cancelled by user");
    });

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            overlay.remove();
            toast("Cancelled by user");
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

// Domain management functions
const addDomain = async () => {
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

export default addDomain;
