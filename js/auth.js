import * as theme from "./utils/theme.js";
import toast from "./utils/toast.js";
import Storage from "./utils/esmls.js";
import { CONSTANT } from "./utils/helpers.js";
import { PINInputsFunction, showHidePassword } from "./utils/UI_Helper.js";

(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get("redirect");
    if (!redirectUrl) {
        window.location.href = chrome.runtime.getURL("/index.html");
        return;
    }
    const pinOnly = urlParams.get("pinOnly");

    const site = new URL(redirectUrl).origin + "/";
    document.getElementById("authTargetUrl").value = redirectUrl;
    function wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    const authForm = document.querySelector("#authenticationForm");
    const { isEnabled } = await chrome.runtime.sendMessage({
        action: "getPasskeyStatus",
    });

    const AuthDesc = document.querySelector(".auth-description");
    if (pinOnly) {
        const PINinputContainer = document.createElement("div");
        PINinputContainer.className = "pin-input-container";
        PINinputContainer.appendChild(PINInputsFunction());
        AuthDesc.after(PINinputContainer);
        const pinBoxes = document.querySelectorAll(".pin-box");
        pinBoxes[0].focus();

        pinBoxes.forEach((box) => {
            box.addEventListener("input", () => {
                const pin = Array.from(pinBoxes)
                    .map((box) => box.value)
                    .join("");
                if (Storage.get(CONSTANT.Auto_Confirm) && pin.length === 4) {
                    const event = new Event("submit");
                    authForm.dispatchEvent(event);
                }
            });
        });
    } else {
        const passIconField = document.createElement("div");
        passIconField.className = "passIconField";
        const inputElement = document.createElement("input");
        inputElement.type = "password";
        inputElement.id = "authSecurityCode";
        inputElement.className = "auth-input";
        inputElement.placeholder = "Enter security code";
        inputElement.required = true;

        passIconField.appendChild(inputElement);
        AuthDesc.after(passIconField);
        showHidePassword(document.body, "#authSecurityCode");
        inputElement.focus();

        inputElement.addEventListener("keyup", (event) => {
            if (
                Storage.get(CONSTANT.Auto_Confirm) &&
                event.target.value.length >= 4
            ) {
                const event = new Event("submit");
                authForm.dispatchEvent(event);
            }
        });
    }

    if (isEnabled) {
        const passkeyBtn = document.createElement("button");
        passkeyBtn.type = "button";
        passkeyBtn.id = "passkeyBtn";
        passkeyBtn.className = "auth-passkey-button";
        passkeyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M120-160v-112q0-34 17.5-62.5T184-378q62-31 126-46.5T440-440q20 0 40 1.5t40 4.5q-4 58 21 109.5t73 84.5v80H120ZM760-40l-60-60v-186q-44-13-72-49.5T600-420q0-58 41-99t99-41q58 0 99 41t41 99q0 45-25.5 80T790-290l50 50-60 60 60 60-80 80ZM440-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm300 80q17 0 28.5-11.5T780-440q0-17-11.5-28.5T740-480q-17 0-28.5 11.5T700-440q0 17 11.5 28.5T740-400Z"/></svg>`;
        document
            .querySelector(".auth-submit-container")
            .appendChild(passkeyBtn);

        const PasskeyAuthenticate = async (time = 0) => {
            try {
                const challenge = new Uint8Array(32);
                crypto.getRandomValues(challenge);

                const authOptions = {
                    challenge: challenge,
                    rpId: window.location.hostname,
                    userVerification: "required",
                    timeout: 60000,
                };

                await wait(time);
                await navigator.credentials.get({
                    publicKey: authOptions,
                });

                chrome.runtime.sendMessage(
                    {
                        type: "PasskeyAuthenticate",
                        site,
                        redirectUrl,
                    },
                    (response) => {
                        toast("Authentication successful!");
                    }
                );
                return;
            } catch (error) {
                toast(error, "error");
            }
        };
        passkeyBtn.addEventListener("click", async () => {
            await PasskeyAuthenticate();
        });

        if (Storage.get(CONSTANT.AUTO_LOGIN_KEY, false)) {
            await PasskeyAuthenticate(500);
        }
    }

    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = document.querySelector("#authSecurityCode")?.value;
        const pinBoxes = document.querySelectorAll(".pin-box");
        const pin = Array.from(pinBoxes)
            .map((box) => box.value)
            .join("");

        const result = await chrome.runtime.sendMessage({
            type: "authenticate",
            site,
            redirectUrl,
            data: { password, pin, pinOnly },
        });
        if (result.status === "fail") {
            toast(`Authentication failed: ${result.msg}`, "error");
            return;
        }
    });
})();
