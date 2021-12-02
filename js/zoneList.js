import { Zone } from "./zone.js";

var zones = new Map();

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

export { createZone, removeZone, clearZones, zones };