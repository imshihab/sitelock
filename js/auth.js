(async () => {
    // Get the redirect URL from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get("redirect");

    const currentUrl = new URL(window.location.href);
    const baseUrl = `${currentUrl.origin}${currentUrl.pathname
        .split("/")
        .slice(0, -1)
        .join("/")}`;

    if (!redirectUrl) {
        window.location.href = `${baseUrl}/index.html`;
    }

    const site = new URL(redirectUrl).origin + "/";

    document.getElementById("authTargetUrl").value = redirectUrl;

    function wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    const authSecurityCode = document.getElementById("authSecurityCode");
    authSecurityCode.focus();

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

            // Here you would verify the assertion with your server
            toast("Authentication successful!");

            chrome.runtime.sendMessage({
                type: "Authentication__Success",
                site,
                redirectUrl,
            });
            return;
        } catch (error) {
            console.log(error);

            toast(error, "error");
        }
    };

    document
        .getElementById("authenticationForm")
        .addEventListener("submit", function (e) {
            const code = authSecurityCode.value;
            e.preventDefault();
            chrome.runtime.sendMessage(
                {
                    type: "authenticate",
                    code,
                    site,
                    redirectUrl,
                },
                function (response) {
                    if (chrome.runtime.lastError) {
                        toast(
                            `"Error: ${chrome.runtime.lastError.message}`,
                            "error"
                        );
                    } else {
                        if (response.fail) {
                            toast(
                                `Authentication failed: ${response.msg}`,
                                "error"
                            );
                        }
                    }
                }
            );
        });

    // Store credentials in localStorage
    const STORAGE_KEY = "passkey_credentials";
    const getCredentials = () => {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    };

    // Check if auto-login is enabled
    const isAutoLogin = localStorage.getItem("passkeyAutoLogin") === "true";

    try {
        const credentials = getCredentials();
        if (credentials.length === 0) {
            const currentUrl = new URL(window.location.href);
            const baseUrl = `${currentUrl.origin}${currentUrl.pathname
                .split("/")
                .slice(0, -1)
                .join("/")}`;

            const passkeyMessage = document.querySelector("#passkeymsg");

            // Create text node
            const messageText = document.createTextNode(
                "Log in securely with a Passkey-no password needed."
            );
            passkeyMessage.appendChild(messageText);

            // Add a line break
            passkeyMessage.appendChild(document.createElement("br"));

            // Create the link element
            const createPasskeyLink = document.createElement("a");
            createPasskeyLink.href = `${baseUrl}/index.html?redirect=${redirectUrl}`;
            createPasskeyLink.textContent = "Create Passkey";

            // Append the link to the message container
            passkeyMessage.appendChild(createPasskeyLink);
            return;
        }

        const AuthSubmitContainer = document.querySelector(
            ".auth-submit-container"
        );

        const passkeyButton = document.createElement("button");
        passkeyButton.type = "button"; // Ensure it's not treated as a submit button
        passkeyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M120-160v-112q0-34 17.5-62.5T184-378q62-31 126-46.5T440-440q20 0 40 1.5t40 4.5q-4 58 21 109.5t73 84.5v80H120ZM760-40l-60-60v-186q-44-13-72-49.5T600-420q0-58 41-99t99-41q58 0 99 41t41 99q0 45-25.5 80T790-290l50 50-60 60 60 60-80 80ZM440-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm300 80q17 0 28.5-11.5T780-440q0-17-11.5-28.5T740-480q-17 0-28.5 11.5T700-440q0 17 11.5 28.5T740-400Z"/></svg>`;
        passkeyButton.className = "auth-passkey-button";
        AuthSubmitContainer.appendChild(passkeyButton);

        passkeyButton.addEventListener("click", async () => {
            await PasskeyAuthenticate();
        });

        if (isAutoLogin) {
            await PasskeyAuthenticate(500);
        }

        return;
    } catch (error) {
        toast(`Authentication error: ${error}`, "error");
    }
})();
