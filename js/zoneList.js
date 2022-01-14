import { activeVehicle, queueWin } from './liveQueue.js';
import { rgbToHex } from './utils.js'
import { Zone } from "./zone.js";

var ZONE_SELECT;
var zones = new Map();

let zoneSelectInstance;

zones.set('NONE', new Zone('NONE'));

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
    ZONE_SELECT = document.getElementById('zone_select');
    let tempElem;

    zones.forEach( zone => {
        if(zone.vehiclesInZone.size != 0) {
            tempElem = queueWin.createElement('option');
            tempElem.innerHTML = '<option value="' + zone.name + '">' + zone.name + '</option>';

            ZONE_SELECT.appendChild(tempElem);
        }
    });

    zoneSelectInstance = M.FormSelect.init(ZONE_SELECT, {});
    ZONE_SELECT.addEventListener('change', handleZoneFilterSelect);
}

function handleZoneFilterSelect() {
    let selectedZones = zoneSelectInstance.getSelectedValues();

    if (activeVehicle.vehicle) {
        activeVehicle.vehicle.hide();
    }

    if (selectedZones.includes('0')) {
        zones.forEach(zone => {
            zone.showAllVehicles();
        });

        if(activeVehicle.vehicle) {
            activeVehicle.vehicle.show();
        }
    }
    else {
        zones.forEach(zone => {
            zone.hideAllVehicles();
        });

        selectedZones.forEach(zone => {
            zones.get(zone).showAllVehicles();

            if (zones.get(zone).vehiclesInZone.has(activeVehicle.name)) {
                activeVehicle.vehicle.show();
            }
        });
    }
}

export { createZone, removeZone, clearZones, initZoneSelect, zones };