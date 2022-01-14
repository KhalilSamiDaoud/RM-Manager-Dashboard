import { LOG_ENTRY_TYPES } from './constants.js';

const ALERTS_DROPDOWN = document.getElementById('alerts_dropdown');
const ALERTS_LIST = document.getElementById('alerts_list');

const ALERTS_BADGE = {
    string: '<span id="alertsdropdownbadge" class="new badge right alerts-dropdown-badge {{color}}">{{count}}</span>',
    elem: document.getElementById('alertsdropdownbadge'),
    update: function () { this.elem = document.getElementById('alertsdropdownbadge'); }
}

let alertsBuckets = new Map();
let newAlertsCount = 0;

ALERTS_DROPDOWN.addEventListener('click', () => { newAlertsCount = 0; updateAlertsBadge(); });

$('#alerts_dropdown').dropdown();

//Define alert catagories as: 
//[{ name: late, id: l8}, {name: breakdown, id: br3k}, ...]
// name = what is displayed on screen in the HTML element
// id = unique key to ID the alert in the "alertsMap" Map
function initAlerts() {
    for (const type in LOG_ENTRY_TYPES) {
        alertsBuckets.set(LOG_ENTRY_TYPES[type].id, []);
    }

    constructAlertsDropDown();
    updateAlertsBadge();
}

function constructAlertsDropDown() {
    return 1;
}

function updateAlertsBadge() {
    let tempBadge = ALERTS_BADGE.string;
    tempBadge = tempBadge.replace('{{color}}', determineBadgeColor());
    tempBadge = tempBadge.replace('{{count}}', newAlertsCount);
    tempBadge = document.createRange().createContextualFragment(tempBadge);

    ALERTS_DROPDOWN.replaceChild(tempBadge, ALERTS_BADGE.elem);
    ALERTS_BADGE.update();
}

function addAlert() {
    newAlertsCount++;
    updateAlertsBadge();

    return 1;
}

function determineBadgeColor() {
    if (newAlertsCount >= 0 && newAlertsCount <= 2)
        return 'teal lighten-1';
    else if (newAlertsCount > 2 && newAlertsCount <= 4)
        return 'yellow lighten-1';
    else if (newAlertsCount > 4 && newAlertsCount <= 6)
        return 'orange lighten-1';
    else
        return 'red lighten-2';
}

class AlertEntry {
    constructor(props={}) {
        this.goob;
    }
}

export { initAlerts };