(() => {
    const div = document.createElement("div");
    div.className = "box flex ai_center jc_evenly vertical";

    // Create an anchor tag
    const anchor = document.createElement("a");
    anchor.href = window.location.href.replace("popup.html", "index.html");
    anchor.target = "_blank";
    anchor.textContent = "Prefrences";

    const h2 = document.createElement("h2");
    h2.textContent = "SiteLock";

    const input = document.createElement("input");
    input.type = "text";
    input.readOnly = true;
    input.className = "HostUrl";
    input.id = "URL_Show";

    const p = document.createElement("p");
    p.className = "flex ai_center jc_between";

    div.appendChild(h2);
    // Append the anchor tag to the div
    div.appendChild(anchor);

    div.appendChild(input);
    div.appendChild(p);

    chrome.runtime.sendMessage({ action: "checkSite" }, function (response) {
        if (response.status.code === "correct") {
            input.value = response.status.site;
            p.textContent = response.status.msg;
            p.classList.remove("error");
            p.classList.add("correct");

            document.body.appendChild(div);
        } else if (response.status.code === "error") {
            input.value = response.status.site;
            p.textContent = response.status.msg;
            p.classList.remove("correct");
            p.classList.add("error");

            const h3 = document.createElement("h3");
            h3.textContent = "Set a Password";

            const form = document.createElement("form");
            form.id = "PIN_Form";
            form.action = "#";
            form.method = "post";

            const pinInput = document.createElement("input");
            pinInput.type = "password";
            pinInput.id = "pin";
            pinInput.name = "pin";
            pinInput.minLength = 4;
            pinInput.maxLength = 6;
            pinInput.required = true;

            const button = document.createElement("button");
            button.id = "submit";
            button.type = "submit";
            button.textContent = "Confirm";

            form.appendChild(pinInput);
            form.appendChild(button);

            div.appendChild(h3);
            div.appendChild(form);

            form.addEventListener("submit", function (event) {
                event.preventDefault();
                const PIN = document.getElementById("pin").value;
                chrome.runtime.sendMessage(
                    {
                        action: "setPin",
                        data: { PIN: PIN, site: response.status.site },
                    },
                    function ({ status }) {
                        if (status.code === "correct") {
                            div.removeChild(h3);
                            div.removeChild(form);
                            p.textContent = status.msg;
                            p.classList.remove("error");
                            p.classList.add("correct");

                            chrome.tabs.reload();
                        } else if (status.code === "error") {
                        }
                    }
                );
            });

            document.body.appendChild(div);
        } else {
            div.removeChild(input);
            div.removeChild(p);
            div.classList.add("flex");
            div.classList.add("ai_center");
            div.classList.add("jc_center");
            document.body.appendChild(div);
        }
    });
})();
