import { defaultZonePath } from './constants.js';
import { map } from './map.js';

class Zone {
    constructor(name = '', color = colors[colors.length - 1], path=defaultZonePath) {
        this.name = name;
        this.color = color;
        this.path = path;

        this.vehicleList = [];
        this.infoContent = '<div class="zone-info"><b>Zone: ' + this.name + '</b>' +
            '<div class="divider"></div>' +
            '<p>Active Vehicles: ' + this.vehicleList.length + '</p>' +
            '<p>Idle Vehicles: ' + this.vehicleList.length + '</p>' +
            '<p>Depot Vehicles: ' + this.vehicleList.length + '</p>' +
            '<div class="divider"></div>' +
            '<p>Total Trips: ' + '0' + '</p>' +
            '<p>Total Load: ' + '0/0' + '</p></div>';

        this.zone;
        this.infoBox;

        this.createZone();
    }

    createZone() {
        this.zone = new google.maps.Polygon({
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

        this.zone.addListener('click', () => {
            this.infoBox.open(map);
        });
    }

    addZone() {
        this.zone.setMap(map);
    }

    removeZone() {
        this.zone.setMap(null);
    }

    addVehicleToZone(vehicle) {
        if (vehicle) {
            this.vehicleList.push(vehicle);
        }
    }

    removeVehicleFromZone(vehicle) {
        if (vehicle) {
            this.vehicleList.splice(this.vehicleList.indexOf(vehicle), 1);
        }
    }

    getVehiclesInZone() {
        return this.vehicleList;
    }
}

export { Zone };