import Storage from "./esmls.js";
import toast from "./toast.js";

const CONSTANT = {
    FIRST_ATTEMPT: "FIRST_ATTEMPT",
};

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

const checkFirstAttempt = Storage.get(CONSTANT.FIRST_ATTEMPT);
export const checkFirstInstall = async (callback) => {
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
            callback();
        } else {
            Storage.set(CONSTANT.FIRST_ATTEMPT, "false");
        }
    } catch (error) {
        callback(error);
    }
};
