export const PINInputsFunction = () => {
    const container = document.createElement("div");
    container.className = "pin-inputs";
    container.innerHTML = /*html*/ `
            <input type="password" maxlength="1" pattern="[0-9]" class="pin-box" inputmode="numeric" required="">
            <input type="password" maxlength="1" pattern="[0-9]" class="pin-box" inputmode="numeric" required="">
            <input type="password" maxlength="1" pattern="[0-9]" class="pin-box" inputmode="numeric" required="">
            <input type="password" maxlength="1" pattern="[0-9]" class="pin-box" inputmode="numeric" required="">`;

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
    return showHideButton;
};
