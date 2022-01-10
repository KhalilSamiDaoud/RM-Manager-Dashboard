const ROOT = document.documentElement;
const SETTINGS_primaryColor = document.getElementById('settings_primary_color');
const SETTINGS_secondaryColor = document.getElementById('settings_secondary_color');
const SETTINGS_reset = document.getElementById('settings_reset');
const SETTINGS_close = document.getElementById('settings_close');
const SETTINGS_save = document.getElementById('settings_save');

SETTINGS_reset.addEventListener('click', handleSettingsReset);
SETTINGS_close.addEventListener('click', handleSettingsClose);
SETTINGS_save.addEventListener('click', handleSettingsSave);

const SETTINGS = {
    primaryTheme: '#fbc02d',
    secondaryTheme: '#757575'
}

//never modify this
//add default values to any new settings
const DEFAULT_SETTINGS = {
    primaryTheme: '#fbc02d',
    secondaryTheme: '#757575'
}

let localCache = window.localStorage;
let isStorageAvaliable = checkStorageAvaliability();

function checkStorageAvaliability() {
    let token = 'test';

    try {
        localCache.setItem(token, token);
        localCache.removeItem(token);

        return true;
    } 
    catch (err) {
        console.warn('Local storage is not enabled.');

        return false;
    }
}

function initSettings() {
    if(isStorageAvaliable) {
        for (const property in SETTINGS) {
            SETTINGS[property] = localCache.getItem(property) ?? SETTINGS[property];
        }

        applyCachedSettings();
    }
}

function applyCachedSettings() {
    SETTINGS_primaryColor.value = SETTINGS.primaryTheme;
    ROOT.style.setProperty('--primary-theme', SETTINGS.primaryTheme);

    SETTINGS_secondaryColor.value = SETTINGS.secondaryTheme;
    ROOT.style.setProperty('--secondary-theme', SETTINGS.secondaryTheme);
}

function handleSettingsReset() {
    for (const property in SETTINGS) {
        SETTINGS[property] = DEFAULT_SETTINGS[property];
    }

    storeSettingsLocally();
    applyCachedSettings();
}

function handleSettingsClose() {
    SETTINGS_primaryColor.value = SETTINGS.primaryTheme;
    SETTINGS_secondaryColor.value = SETTINGS.secondaryTheme;
}

function handleSettingsSave() {
    if (SETTINGS_primaryColor.value) {
        SETTINGS.primaryTheme = SETTINGS_primaryColor.value;
        ROOT.style.setProperty('--primary-theme', SETTINGS.primaryTheme);
    }

    if (SETTINGS_secondaryColor.value) {
        SETTINGS.secondaryTheme = SETTINGS_secondaryColor.value;
        ROOT.style.setProperty('--secondary-theme', SETTINGS.secondaryTheme);
    }

    if (isStorageAvaliable) storeSettingsLocally();
}

function storeSettingsLocally() {
    for (const property in SETTINGS) {
        localCache.setItem(property, SETTINGS[property]);
    }
}

export { initSettings };