(() => {
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

            const pinInput = document.createElement("input");
            pinInput.type = "password";
            pinInput.id = "Password";
            pinInput.name = "Password";
            pinInput.className = "password-input";
            pinInput.minLength = 4;
            pinInput.required = true;
            pinInput.setAttribute("placeholder", "Set A Password");

            const button = document.createElement("button");
            button.id = "submit";
            button.type = "submit";
            button.textContent = "Confirm";
            button.className = "set-button";

            form.appendChild(pinInput);
            form.appendChild(button);

            const requirementDiv = document.createElement("div");
            requirementDiv.className = "requirement";
            requirementDiv.textContent = "At Least 4 Characters";

            BoxContainer.appendChild(form);
            BoxContainer.appendChild(requirementDiv);

            form.addEventListener("submit", function (event) {
                event.preventDefault();
                const password = document.getElementById("Password").value;
                chrome.runtime.sendMessage(
                    {
                        type: "addDomain",
                        data: { password, site: response.status.site },
                    },
                    function (response) {
                        if (response.status === "success") {
                            BoxContainer.removeChild(form);
                            BoxContainer.removeChild(requirementDiv);
                            statusBadge.textContent = "Secured";
                            statusBadge.classList.remove("insecure");
                            statusBadge.classList.add("secure");
                            chrome.tabs.reload();
                        } else {
                            requirementDiv.innerHTML = response.msg;
                        }
                    }
                );
            });

            document.body.appendChild(BoxContainer);
        } else {
            document.body.removeChild(BoxContainer);
        }
    });
})();
