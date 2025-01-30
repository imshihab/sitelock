import * as theme from "./utils/theme.js";
/** @type {HTMLHeadElement} */
const HeaderElement = document.querySelector("header.header");

window.addEventListener("scroll", () => {
    if (window.pageYOffset > 0) {
        HeaderElement.setAttribute("scrolled", "");
    } else {
        HeaderElement.removeAttribute("scrolled");
    }
});
