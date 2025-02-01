import * as theme from "./utils/theme.js";
import toast from "./utils/toast.js";
import {
    checkFirstInstall,
    SetUpPIN,
    SetUpPasskeyLogin,
    ToggleUsePinOnly,
    ToggleAutoConfirm,
    ToggleLockSetting,
    isLockedSettings,
    loadDomains,
} from "./utils/helpers.js";

/** @type {HTMLHeadElement} */
const HeaderElement = document.querySelector("header.header");

window.addEventListener("scroll", () => {
    if (window.pageYOffset > 0) {
        HeaderElement.setAttribute("scrolled", "");
    } else {
        HeaderElement.removeAttribute("scrolled");
    }
});
const Init = async () => {
    try {
        const [error, isFirstInstall] = await checkFirstInstall();
        if (error) {
            console.error("Error checking first install:", error);
            return;
        }

        if (isFirstInstall) {
            document.getElementById("SettingTitle").after(SetUpPIN());
        }
        await SetUpPasskeyLogin();
        ToggleLockSetting();
        ToggleUsePinOnly();
        ToggleAutoConfirm();
        loadDomains();
    } catch (error) {
        toast(error, "error");
    }
};

(async () => {
    await isLockedSettings(Init);
})();
