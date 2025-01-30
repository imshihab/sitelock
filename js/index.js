import * as theme from "./utils/theme.js";
import toast from "./utils/toast.js";
import { checkFirstInstall, SetUpPIN } from "./utils/helpers.js";

/** @type {HTMLHeadElement} */
const HeaderElement = document.querySelector("header.header");

window.addEventListener("scroll", () => {
    if (window.pageYOffset > 0) {
        HeaderElement.setAttribute("scrolled", "");
    } else {
        HeaderElement.removeAttribute("scrolled");
    }
});
const Init = () => {
    checkFirstInstall((err) => {
        if (err) {
            toast(err, "error");
            return;
        }
        document.getElementById("SettingTitle").after(SetUpPIN());
    });
};

Init();
