// Constants
const TOAST_ICONS = {
    error: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="m344-60-76-128-144-32 14-148-98-112 98-112-14-148 144-32 76-128 136 58 136-58 76 128 144 32-14 148 98 112-98 112 14 148-144 32-76 128-136-58-136 58Zm34-102 102-44 104 44 56-96 110-26-10-112 74-84-74-86 10-112-110-24-58-96-102 44-104-44-56 96-110 24 10 112-74 86 74 84-10 114 110 24 58 96Zm102-318Zm0 200q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Z"/></svg>`,
    success: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>`,
};

const TOAST_STYLES = `
.toast-box {
    box-shadow: 0 1px 3px 0 rgba(60, 64, 67, .3), 0 4px 8px 3px rgba(60, 64, 67, .15);
    font-family: "Google Sans", Roboto, RobotoDraft, Helvetica, Arial, sans-serif;
    font-size: .875rem;
    letter-spacing: normal;
    align-items: center;
    background-color: rgb(32, 33, 36);
    border: none;
    border-radius: 4px;
    bottom: 0;
    color: #fff;
    display: flex !important;
    font-weight: 400;
    left: 0;
    margin: 24px;
    max-width: 640px;
    min-height: 52px;
    padding: 8px 12px;
    position: fixed;
    right: auto;
    text-align: left;
    top: auto;
    white-space: normal;
    z-index: 99999;
    transform: translateY(150%);
    transition: transform 0.3s ease-out;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

.toast-box.show { transform: translateY(0); }
.toast-box.success { background-color: #36c450; }
.toast-box.error { background-color: #e5282a; }

.toast-container {
    display: flex;
    align-items: center;
    position: relative;
    min-height: 36px !important;
}

.close-toast,
.toast-icon {
    margin-right: 8px;
    height: 36px !important;
    width: 36px !important;
    min-height: 36px !important;
    min-width: 36px !important;
    max-height: 36px !important;
    max-width: 36px !important;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-toast {
    margin: 0 !important;
    border: none !important;
    background: none !important;
    outline: none !important;
}

.close-toast > svg,
.toast-icon > svg {
    height: 24px !important;
    width: 24px !important;
    min-height: 24px !important;
    min-width: 24px !important;
    max-height: 24px !important;
    max-width: 24px !important;
}

.toast-message {
    margin: 10px 0 !important;
    margin-right: 24px !important;
}`;

const TOAST_HTML = `
<div class="toast-box">
    <div class="toast-container">
        <span class="toast-icon"></span>
        <span class="toast-message"></span>
    </div>
    <button class="close-toast">
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF">
            <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
        </svg>
    </button>
</div>`;

const styleSheet = document.createElement("style");
styleSheet.textContent = TOAST_STYLES;
document.head.appendChild(styleSheet);

document.body.insertAdjacentHTML("beforeend", TOAST_HTML);

let toastTimeout = null;
let showTimeout = null;

const closeBtn = document.querySelector(".close-toast");
if (closeBtn) {
    closeBtn.addEventListener("click", () => {
        const toastBox = document.querySelector(".toast-box");
        clearTimeout(toastTimeout);
        clearTimeout(showTimeout);
        toastBox.classList.remove("show");
    });
}

const toast = (message, status = "success", duration = 3000) => {
    const toastBox = document.querySelector(".toast-box");
    const toastIcon = toastBox.querySelector(".toast-icon");
    const toastMessage = toastBox.querySelector(".toast-message");

    toastBox.classList.remove("show", "success", "error");

    clearTimeout(toastTimeout);
    clearTimeout(showTimeout);

    toastBox.classList.add(status);
    toastIcon.innerHTML = TOAST_ICONS[status] || TOAST_ICONS.success;

    toastMessage.textContent = `${message}`.replace(/See: https:.*/, "").trim();

    showTimeout = setTimeout(() => {
        toastBox.classList.add("show");
        toastTimeout = setTimeout(() => {
            toastBox.classList.remove("show");
        }, duration);
    }, 100);
};
export default toast;
