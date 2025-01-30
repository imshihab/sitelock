/* https://github.com/imshihab/esmls */

/**
 * @type {Storage}
 */
const LOCAL__STORAGE = window.localStorage;
const observers = {};
let isOverridden = false;
let isStorageListenerAdded = false;
/**
 * @param {any} data
 */
function type(data) {
    // @ts-ignore
    return Object.prototype.toString.call(data).match(/\[object (.*)\]/)[1];
}
/**
 * @param {string} error
 */
function throwError(error) {
    throw new Error(error);
}
/**
 * @param {string} key
 */
function isKey(key) {
    if (!key) return throwError("key is required");
    if (typeof key !== "string") return throwError("key must be string");
}
/**
 *  @param {string} key
 *  @param {any} data
 */
function setItem(key, data) {
    isKey(key);
    LOCAL__STORAGE.setItem(
        key,
        JSON.stringify({
            type: type(data),
            data: data,
        })
    );
}
/**
 * @param {string} key - get data from `LocalStorage`
 * @param {any} defitem - pass a default item if there is no item in `LocalStorage`
 */
function getItem(key, defitem) {
    isKey(key);
    if (!hasItem(key)) {
        return defitem ? defitem : null;
    }
    // @ts-ignore
    const ReadStorage = JSON.parse(LOCAL__STORAGE.getItem(key));
    if (ReadStorage.type === "String") {
        return String(ReadStorage.data);
    } else if (ReadStorage.type === "Number") {
        return Number(ReadStorage.data);
    } else if (ReadStorage.type === "BigInt") {
        return BigInt(ReadStorage.data);
    } else if (ReadStorage.type === "Boolean") {
        return Boolean(ReadStorage.data);
    } else if (ReadStorage.type === "Date") {
        return new Date(ReadStorage.data);
    } else {
        return ReadStorage.data ? ReadStorage.data : ReadStorage;
    }
}
/**
 * @param {string} key - delete item from `LocalStorage`
 */
function delItem(key) {
    isKey(key);
    LOCAL__STORAGE.removeItem(key);
}
/**
 * @param {string} key - if `LocalStorage` has the item you're looking for..
 */
function hasItem(key) {
    isKey(key);
    return LOCAL__STORAGE.hasOwnProperty(key);
}
/**
 * Listen for changes to a localStorage key
 * @param {string} key - Key to observe
 * @param {(newValue: any) => void} callback - Callback when value changes
 */
function KeyonChange(key, callback) {
    isKey(key);
    observers[key] = callback;
    if (!isOverridden) {
        const originalSetItem = LOCAL__STORAGE.setItem.bind(LOCAL__STORAGE);
        const originalRemoveItem =
            LOCAL__STORAGE.removeItem.bind(LOCAL__STORAGE);
        LOCAL__STORAGE.setItem = function (k, value) {
            originalSetItem(k, value);
            if (observers[k]) {
                const parsedValue = getItem(k);
                observers[k](parsedValue);
            }
        };
        LOCAL__STORAGE.removeItem = function (k) {
            originalRemoveItem(k);
            if (observers[k]) {
                observers[k](null);
            }
        };
        isOverridden = true;
    }
    if (!isStorageListenerAdded) {
        window.addEventListener("storage", (event) => {
            const changedKey = event.key;
            if (changedKey && observers[changedKey]) {
                const parsedValue = getItem(changedKey);
                observers[changedKey](parsedValue);
            }
        });
        isStorageListenerAdded = true;
    }
}
export const set = setItem;
export const get = getItem;
export const del = delItem;
export const has = hasItem;
export const onChange = KeyonChange;
export default {
    set,
    get,
    del,
    has,
    onChange,
};
