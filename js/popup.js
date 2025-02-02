import * as theme from "./utils/theme.js";
import { checkFirstInstall, CONSTANT } from "./utils/helpers.js";
import Storage from "./utils/esmls.js";
import { showHidePassword } from "./utils/Domains.js";

const BoxContainer = document.querySelector("div#BoxContainer");
const UrlContainer = document.createElement("div");
UrlContainer.className = "url-container";

const input = document.createElement("input");
input.type = "text";
input.readOnly = true;
input.className = "url";
input.id = "urlInput";

const statusBadge = document.createElement("span");
statusBadge.className = "status-badge";
statusBadge.textContent = "not secured";

document.querySelector("#anchor").href = window.location.href.replace(
    "popup.html",
    "index.html"
);

UrlContainer.appendChild(statusBadge);
UrlContainer.appendChild(input);
BoxContainer.appendChild(UrlContainer);

(async () => {
    const result = await chrome.runtime.sendMessage({ action: "checkSite" });
    if (result.status.code === "fail") {
        document.body.removeChild(BoxContainer);
        return;
    }

    if (result.status.code === "correct") {
        input.value = result.status.site;
        statusBadge.textContent = "Secured";
        statusBadge.classList.add("secure");
        document.body.appendChild(BoxContainer);
        return;
    }

    if (result.status.code === "error") {
        input.value = result.status.site;
        statusBadge.textContent = "Not Secured";
        statusBadge.classList.add("insecure");

        const form = document.createElement("form");
        form.className = "password-form";

        const passwordContainer = document.createElement("div");
        passwordContainer.className = "password-container passIconField";

        const passInput = document.createElement("input");
        passInput.type = "password";
        passInput.id = "Password";
        passInput.name = "Password";
        passInput.className = "password-input";
        passInput.minLength = 4;
        passInput.required = true;
        passInput.setAttribute("placeholder", "");

        const passwordLabel = document.createElement("label");
        passwordLabel.className = "password-label";
        passwordLabel.htmlFor = "Password";
        passwordLabel.textContent = "Password";

        passwordContainer.appendChild(passInput);
        passwordContainer.appendChild(passwordLabel);

        const pinOptionContainer = document.createElement("div");
        pinOptionContainer.className = "pin-option";

        const CheckboxContainer = document.createElement("label");
        CheckboxContainer.className = "material-checkbox";

        const checkBoxStatus = Storage.get(CONSTANT.IS_PIN_Only) || false;
        const checkboxInput = document.createElement("input");
        checkboxInput.type = "checkbox";
        checkboxInput.id = "pinOnlyCheckbox";
        checkboxInput.name = "PINonly";
        checkboxInput.checked = checkBoxStatus;

        const checkmarkSpan = document.createElement("span");
        checkmarkSpan.className = "checkmark";

        const labelTextSpan = document.createElement("span");
        labelTextSpan.className = "label-text";
        labelTextSpan.textContent = "Use PIN Only";

        CheckboxContainer.appendChild(checkboxInput);
        CheckboxContainer.appendChild(checkmarkSpan);
        CheckboxContainer.appendChild(labelTextSpan);

        const confirmButton = document.createElement("button");
        confirmButton.id = "submit";
        confirmButton.type = "submit";
        confirmButton.className = "set-button";
        confirmButton.textContent = "Confirm";

        pinOptionContainer.appendChild(CheckboxContainer);
        pinOptionContainer.appendChild(confirmButton);

        // Create the requirement div
        const requirementDiv = document.createElement("div");
        requirementDiv.className = "requirement";
        requirementDiv.textContent = "At Least 4 Characters";

        form.appendChild(passwordContainer);
        form.appendChild(requirementDiv);
        form.appendChild(pinOptionContainer);
        BoxContainer.appendChild(form);
        const showHideButton = showHidePassword(form, "#Password");

        const passwordInput = document.getElementById("Password");
        if (checkBoxStatus) {
            passwordInput.disabled = true;
            passwordInput.removeAttribute("required");
            passwordInput.placeholder = "Disabled (PIN only mode)";
            requirementDiv.textContent = "Using PIN-only authentication";
        } else {
            passInput.setAttribute("autofocus", true);
        }

        let passwordvalue = "";
        checkboxInput.addEventListener("click", async function (e) {
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
                passwordInput.focus();
            } else {
                this.checked = true;
                passwordvalue = passwordInput.value;
                passwordInput.value = "";
                passwordInput.disabled = true;
                passwordInput.removeAttribute("required");
                passwordInput.placeholder = "Disabled (PIN only mode)";
                requirementDiv.textContent = "Using PIN-only authentication";
                showHideButton.disabled = true;
            }
        });

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            const password = passwordInput.value;
            const pinOnly = document.getElementById("pinOnlyCheckbox");
            chrome.runtime.sendMessage(
                {
                    type: "addDomain",
                    data: { site: result.status.site, password, pinOnly },
                },
                (response) => {
                    if (response.status === "success") {
                        BoxContainer.removeChild(form);
                        statusBadge.textContent = "Secured";
                        statusBadge.classList.remove("insecure");
                        statusBadge.classList.add("secure");
                        chrome.tabs.reload();
                        window.close();
                    } else {
                        requirementDiv.innerHTML = response.msg;
                    }
                }
            );
        });

        document.body.appendChild(BoxContainer);
    }
})();
