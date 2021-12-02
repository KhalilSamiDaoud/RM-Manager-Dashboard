import { liveVehicles } from './vehicleList.js';
import { VEHICLE_TYPE } from './constants.js';
import { zones } from './zoneList.js';
import { map } from './map.js';

class LiveVehicle {
    constructor(name = 'N/A', type = VEHICLE_TYPE.sedan, maxCapacity = 0, startTime = 0, currPos = null, zoneID = null, heading = 0, color = 'black') {
        this.maxCapacity = maxCapacity;
        this.startTime = startTime;
        this.currPos = currPos;
        this.heading = heading;
        this.type = type;
        this.name = name;
        
        this.zone = (zones.has(zoneID)) ? zones.get(zoneID) : zones.get('none');
        this.zone.addVehicle(this);

        this.assignedTrips = new Map();

        this.color = (color) ? color : 'black';

        this.infoContent =
            '<div class="zone-info"><b>Vehicle: ' + this.name + '</b>' +
            '<div class="divider"></div>' +
            '<p>Performing Trip: ' + 'N/A' + '</p>' +
            '<p>On time: ' + '<span class="green-text">Yes (+0min)</span>' + '</p>' +
            '<div class="divider"></div>' +
            '<p>Load: ' + '0/0' + '</p>' +
            '<p>Trips Completed: ' + '0' + '</p>' +
            '<p>Trips Remaining: ' + '0' + '</p></div>';
    }

    createLiveVehicle() {
        this.symbol = new SlidingMarker({
            position: (this.currPos) ? this.currPos : map.getCenter(),
            icon: {
                path: this.type.path,
                strokeColor: '#000',
                strokeWeight: 1,
                strokeOpacity: 1,
                fillColor: this.color,
                fillOpacity: 1,
                scale: .23,
                anchor: new google.maps.Point(50, 0),
                fixedRotation: false,
                rotation: this.heading,
                optimized: true,
            },
            title: 'Vehicle #' + this.name,
            easing: "easeOutQuad",
            duration: 30000,
            map: map,
        });

        this.infoBox = new google.maps.InfoWindow({
            content: this.infoContent,
            position: this.symbol.getPosition(),
        });

        this.symbol.addListener('click', () => { this.infoBox.open(map); });
    }

    //make sure object can get GC'ed
    destroy() {
        if (this.animationInterval)
            this.animationInterval = clearInterval(this.animationInterval);

        this.symbol = null;

        this?.zone.removeVehicle(this);
        this?.animPath.setMap(null);

        liveVehicles.delete(this.name);
    }

    handleClick() {
        this.infoBoxRef.open(map);
    }

    updateMarker(coords = map.getCenter()) {
        if (JSON.stringify(coords) === JSON.stringify(this.currPos))
            return;
        if (!this.symbol)
            this.createLiveVehicle();

        let icon = this.symbol.getIcon();
        icon.rotation = this.calcRotation(this.currPos, coords);
        this.currPos = coords;

        this.symbol.setIcon(icon);
        this.symbol.setPosition(coords);
        this.infoBox.setPosition(coords)
    }

    rotateMarker(heading=0) {
        if (!this.symbol)
            this.createLiveVehicle();

        let icon = this.symbol.getIcon();
        icon.rotation = heading;

        this.symbol.setIcon(icon);
    }

    removeMarker() {
        this.symbol.setMap(null);
    }

    addTrip(trip) {
        if(!trip) return;

        this.assignedTrips.set(trip.confirmation, trip);
    }

    removeTrip(trip) {
        if(!trip) return;

        this.assignedTrips.delete(trip.confirmation);
    }

    clearTrips() {
        this.assignedTrips.clear();
    }

    calcRotation(startPos, endPos) {
        if (startPos && endPos)
            return google.maps.geometry.spherical.computeHeading(startPos, endPos);
    }
}

export { LiveVehicle }