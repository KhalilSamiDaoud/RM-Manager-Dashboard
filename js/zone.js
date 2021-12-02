import { zones } from './zoneList.js';
import { map } from './map.js';

class Zone {
    constructor(name = 'N/A', color = '#000000', path = null) {
        this.color = color;
        this.name = name;
        this.path = path;

        this.elem;
        this.infoBox;

        this.vehiclesInZone = new Map();

        this.infoContent = 
            '<div class="zone-info"><b>Zone: ' + this.name + '</b>' +
            '<div class="divider"></div>' +
            '<p>Active Vehicles: ' + this.vehiclesInZone.size + '</p>' +
            '<p>Idle Vehicles: ' + this.vehiclesInZone.size + '</p>' +
            '<p>Depot Vehicles: ' + this.vehiclesInZone.size + '</p>' +
            '<div class="divider"></div>' +
            '<p>Total Trips: ' + '0' + '</p>' +
            '<p>Total Load: ' + '0/0' + '</p></div>';

        this.createZone();
    }

    createZone() {
        if (!this.path) return;

        this.elem = new google.maps.Polygon({
            paths: this.path,
            strokeColor: this.color.hex,
            strokeOpacity: 0.33,
            strokeWeight: 1,
            fillColor: this.color.hex,
            fillOpacity: 0.1
        });

        this.infoBox = new google.maps.InfoWindow({
            content: this.infoContent,
            position: this.path[0]
        });

        this.elem.addListener('click', this.handleClick);
        this.elem.infoBoxRef = this.infoBox;
    }

    destroy() {
        this?.elem.removeListener('click', this.handleClick);
        this.removeZone();

        this.vehiclesInZone.clear();
        zones.delete(this.name);

        this.infoBox = null;
    }

    handleClick() {
        this.infoBoxRef.open(map);
    }

    addZone() {
        if (this.elem)
            this.elem.setMap(map);
    }

    removeZone() {
        if (this.elem)
            this.elem.setMap(null);
    }

    addVehicle(vehicle) {
        if (vehicle && !this.vehiclesInZone.has(vehicle.name))
            this.vehiclesInZone.set(vehicle.name, vehicle);
    }

    removeVehicle(vehicle) {
        if (vehicle && this.vehiclesInZone.has(vehicle.name))
            this.vehiclesInZone.remove(vehicle.name);
    }

    getVehicles() {
        return [...vehiclesInZone.values()];
    }
}

export { Zone };