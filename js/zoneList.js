import { Zone } from "./zone.js";
import { queueWin } from './liveQueue.js';

const ZONE_SELECT = document.getElementById('zone_select');

var zones = new Map();

let zoneSelectInstance;

ZONE_SELECT.addEventListener('change', handleZoneFilterSelect);
zones.set('none', new Zone('NONE'));

function createZone(zoneName, zoneColor, zonePath=null) {
    if (zones.has(zoneName)) return;

    if (zoneColor[0] != '#') zoneColor = rgbToHex(zoneColor);

    zones.set(zoneName, new Zone(zoneName, zoneColor, zonePath));
}

function removeZone(zone) {
    if(zones.has(zone.name)) {
        zones.delete(zone.name);
        zone.destroy();
    }
}

function clearZones() {
    zones.forEach(zone => {
        zone.destroy();
    });

    zones.clear();
}

function initZoneSelect() {
    let tempElem;

    zones.forEach( zone => {
        if(zone.vehiclesInZone.size != 0) {
            tempElem = queueWin.createElement('option');
            tempElem.innerHTML = '<option value="' + zone.name + '">' + zone.name + '</option>';

            ZONE_SELECT.appendChild(tempElem);
        }
    });

    zoneSelectInstance = M.FormSelect.init(ZONE_SELECT, {});
}

function handleZoneFilterSelect() {
    let selectedZones = zoneSelectInstance.getSelectedValues();

    if (selectedZones.includes('0')) {
        zones.forEach(zone => {
            zone.showAllVehicles();
        });
    }
    else {
        zones.forEach(zone => {
            zone.hideAllVehicles();
        });

        selectedZones.forEach(zone => {
            zones.get(zone).showAllVehicles();
        });
    }
}

function rgbToHex(rgbString) {
    try {
        let rbgRegex = /rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/;
        let colors = rbgRegex.exec(rgbString);

        return  (colors) ? 
            '#' + ((1 << 24) + (~colors[0] << 16) + (~colors[1] << 8) + ~colors[2]).toString(16) :
        (() => { throw new Error('ERROR: invalid RBG string'); });
    }
    catch (err) {
        console.error(err);
        return '#000';
    }
}

export { createZone, removeZone, clearZones, initZoneSelect, zones };