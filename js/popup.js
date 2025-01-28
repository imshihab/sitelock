(() => {
    const FIRST_ATTEMPT = "FIRST_ATTEMPT";
    const BoxContainer = document.querySelector("div#BoxContainer");
    const UrlContainer = document.createElement("div");
    UrlContainer.className = "url-container";

    const input = document.createElement("input");
    input.type = "text";
    input.readOnly = true;
    input.className = "url";

    const statusBadge = document.createElement("span");
    statusBadge.className = "status-badge";
    statusBadge.textContent = "not secured";

    const p = document.createElement("p");
    p.className = "flex ai_center jc_between";

    document.querySelector("#anchor").href = window.location.href.replace(
        "popup.html",
        "index.html"
    );

    UrlContainer.appendChild(statusBadge);
    UrlContainer.appendChild(input);
    BoxContainer.appendChild(UrlContainer);

    chrome.runtime.sendMessage({ action: "checkSite" }, function (response) {
        if (response.status.code === "correct") {
            input.value = response.status.site;
            statusBadge.textContent = "Secured";
            statusBadge.classList.add("secure");

            document.body.appendChild(BoxContainer);
        } else if (response.status.code === "error") {
            input.value = response.status.site;
            statusBadge.textContent = "Not Secured";
            statusBadge.classList.add("insecure");

            const form = document.createElement("form");
            form.className = "password-form";
            form.action = "#";
            form.method = "post";

            // Create the outer container div
            const passwordContainer = document.createElement("div");
            passwordContainer.className = "password-container";

            // Create the input element for the password
            const passInput = document.createElement("input");
            passInput.type = "password";
            passInput.id = "Password";
            passInput.name = "Password";
            passInput.className = "password-input";
            passInput.minLength = 4;
            passInput.required = true;
            passInput.setAttribute("placeholder", "");
            passInput.setAttribute("autofocus", "");

            const passwordLabel = document.createElement("label");
            passwordLabel.className = "password-label";
            passwordLabel.htmlFor = "Password";
            passwordLabel.textContent = "Password";

            // Create the show-hide button
            const showHideButton = document.createElement("button");
            showHideButton.type = "button"; // Prevent it from submitting a form
            showHideButton.className = "show-hide-button";
            showHideButton.textContent = "Show";

            // Toggle password visibility when the button is clicked
            showHideButton.addEventListener("click", () => {
                if (passInput.type === "password") {
                    passInput.type = "text";
                    showHideButton.textContent = "Hide";
                } else {
                    passInput.type = "password";
                    showHideButton.textContent = "Show";
                }
            });

            // Append the password input and show-hide button to the container
            passwordContainer.appendChild(passInput);
            passwordContainer.appendChild(passwordLabel);
            passwordContainer.appendChild(showHideButton);

            // Create the outer container
            const pinOptionContainer = document.createElement("div");
            pinOptionContainer.className = "pin-option";

            // Create the material-checkbox container
            const CheckboxContainer = document.createElement("label");
            CheckboxContainer.className = "material-checkbox";

            // Create the input element for the checkbox
            const checkboxInput = document.createElement("input");
            checkboxInput.type = "checkbox";
            checkboxInput.id = "pinOnlyCheckbox";
            checkboxInput.name = "PINonly";

            // Create the span for the checkmark
            const checkmarkSpan = document.createElement("span");
            checkmarkSpan.className = "checkmark";

            // Create the span for the label text
            const labelTextSpan = document.createElement("span");
            labelTextSpan.className = "label-text";
            labelTextSpan.textContent = "Use PIN Only";

            // Append the checkbox input and spans to the material-checkbox container
            CheckboxContainer.appendChild(checkboxInput);
            CheckboxContainer.appendChild(checkmarkSpan);
            CheckboxContainer.appendChild(labelTextSpan);

            // Create the confirm button
            const confirmButton = document.createElement("button");
            confirmButton.id = "submit";
            confirmButton.type = "submit";
            confirmButton.className = "set-button";
            confirmButton.textContent = "Confirm";

            // Append the material-checkbox container and button to the outer container
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

            const handleResponse = (response) => {
                if (response.status === "success") {
                    BoxContainer.removeChild(form);
                    form.removeChild(requirementDiv);
                    statusBadge.textContent = "Secured";
                    statusBadge.classList.remove("insecure");
                    statusBadge.classList.add("secure");
                    chrome.tabs.reload();
                } else {
                    requirementDiv.innerHTML = response.msg;
                }
            };
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                const password = document.getElementById("Password").value;
                const pinOnly = document.getElementById("pinOnlyCheckbox");
                if (pinOnly.checked) {
                    chrome.runtime.sendMessage(
                        {
                            type: "addDomainPINonly",
                            data: { site: response.status.site, pinOnly: true },
                        },
                        handleResponse
                    );
                    return;
                }

                chrome.runtime.sendMessage(
                    {
                        type: "addDomain",
                        data: { password, site: response.status.site },
                    },
                    handleResponse
                );
            });

            let passwordvalue = "";
            document
                .getElementById("pinOnlyCheckbox")
                .addEventListener("click", function (e) {
                    const Check_FIRST_ATTEMPT =
                        localStorage.getItem(FIRST_ATTEMPT);
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
                        const passwordInput =
                            document.getElementById("Password");
                        const requirementDiv =
                            document.querySelector(".requirement");
                        const showHideButton =
                            document.querySelector(".show-hide-button");

                        if (this.checked) {
                            passwordvalue = passwordInput.value; // Store in window object
                            passwordInput.value = "";
                            passwordInput.disabled = true;
                            passwordInput.removeAttribute("required");
                            passwordInput.placeholder =
                                "Disabled (PIN only mode)";
                            requirementDiv.textContent =
                                "Using PIN-only authentication";
                            showHideButton.disabled = true;
                        } else {
                            passwordInput.value = passwordvalue || "";
                            passwordInput.disabled = false;
                            passwordInput.setAttribute("required", "");
                            passwordInput.placeholder = "Set A Password";
                            requirementDiv.textContent =
                                "At Least 4 Characters";
                            showHideButton.disabled = false;
                        }
                    } else {
                        // Force uncheck if validation failed
                        this.checked = false;
                    }
                });

            document.body.appendChild(BoxContainer);
        } else {
            document.body.removeChild(BoxContainer);
        }
    });
})();
