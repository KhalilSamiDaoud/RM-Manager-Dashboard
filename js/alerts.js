const ALERTS_DROPDOWN = document.getElementById('alerts_dropdown');
const ALERTS_LIST = document.getElementById('alerts_list');

const ALERT_TYPE = {
    emergency: 0,
    noShow: 1,
    speeding: 2,
    other: 3
}

let alertsBuckets = new Map();

//Define alert catagories as: 
//[{ name: late, id: l8}, {name: breakdown, id: br3k}, ...]
// name = what is displayed on screen in the HTML element
// id = unique key to ID the alert in the "alertsMap" Map
function initAlerts(...types) {
    types.forEach(type => {
        alertsBuckets.set(type, []);
    });
}

class AlertEntry {
    constructor(props={}) {
        this.goob;
    }
}