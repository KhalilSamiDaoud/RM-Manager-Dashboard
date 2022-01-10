import { handleVehicleSelect, liveQueueEntries, activeVehicle } from './liveQueue.js';
import { VEHICLE_TYPE, DLINE_SYMBOL } from './constants.js';
import { liveVehicles } from './vehicleList.js';
import { LiveMarker } from './liveMarker.js';
import { zones } from './zoneList.js';
import { isColor } from './utils.js';
import { map } from './map.js';

class LiveVehicle {
    constructor(name = 'N/A', type = VEHICLE_TYPE.sedan, maxCapacity = 0, currCapacity = 0, currPos = null, zoneID = null, heading = 0, color = 'black') {
        this.maxCapacity = maxCapacity;
        this.currCapacity = currCapacity;
        this.currPos = currPos;
        this.heading = heading;
        this.type = type;
        this.name = name;

        this.tripsCompleted = 0;
        
        this.zone = (zones.has(zoneID)) ? zones.get(zoneID) : zones.get('none');
        this.zone.addVehicle(this);

        //ID by confirmation num
        this.assignedTrips = new Map();
        //ID by confirmation num
        this.tripMarkers = new Map();

        this.color = (isColor(color?.toLowerCase())) ? color?.toLowerCase() : 'black';

        this.path = new google.maps.Polyline({
            path: [this.currPos],
            strokeOpacity: 0,
            icons: [
                {

                    icon: DLINE_SYMBOL,
                    offset: '0%',
                    repeat: '15px'
                }]
        });

        this.infoContent =
            '<div class="zone-info"><b>Vehicle: ' + this.name + '</b>' +
            '<div class="divider"></div>' +
            '<p>Servicing: N/A</p>' +
            '<p>On time: N/A</p>' +
            '<div class="divider"></div>' +
            '<p>Load: ' + this.currCapacity + '/' + this.maxCapacity + '</p>' +
            '<p>Trips Remaining: ' + this.assignedTrips.size + '</p></div>';
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
                anchor: new google.maps.Point(50, 50),
                fixedRotation: false,
                rotation: this.heading,
                optimized: true,
            },
            title: 'Vehicle #' + this.name,
            easing: "linear",
            duration: 30000,
            map: map,
        });

        this.infoBox = new google.maps.InfoWindow({
            content: this.infoContent,
            position: this.symbol.getPosition()
        });

        this.symbol.addListener('click', this.handleClick.bind(this));
        this.symbol.addListener('mouseover', this.handleMouseOver.bind(this));
        this.symbol.addListener('mouseout', this.handleMouseOut.bind(this));
    }

    //make sure object can get GC'ed
    destroy() {
        this.symbol.removeListener('click', this.handleClick.bind(this));
        this.symbol.removeListener('mouseover', this.handleMouseOver.bind(this));
        this.symbol.removeListener('mouseout', this.handleMouseOut.bind(this));

        if (this.animationInterval)
            this.animationInterval = clearInterval(this.animationInterval);

        this.symbol = null;

        this?.zone.removeVehicle(this);
        this?.path.setMap(null);

        liveVehicles.delete(this.name);
    }

    handleClick() {
        handleVehicleSelect(liveQueueEntries.get(this.name));
        this.infoBox.open(map);
    }

    handleMouseOver() {
        if (activeVehicle.vehicle == this) return;

        this.showTripMarkers();
        this.showPath();
    }

    handleMouseOut() {
        if (activeVehicle.vehicle == this) return;

        this.hideTripMarkers();
        this.hidePath();
    }

    updateLoad(load) {
        if (typeof(load) !== 'number') return;

        this.currCapacity = load;
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

    updateInfoBox() {
        if (!this.infoBox) {
            console.warn(this.name + ' Info Box is not defined'); 
            return;
        }

        let tempTrip = [...this.assignedTrips.values()].find(trip => { 
            if (trip.status === 'PICKEDUP' || trip.status === 'IRTPU')
                return true;
        });

        this.infoContent =
            '<div class="zone-info"><b>Vehicle: ' + this.name + '</b>' +
            '<div class="divider"></div>' +
            '<p class="truncate">Servicing: ' + ((tempTrip) ? tempTrip.name : 'N/A') + '</p>' +
            '<p>Status: ' + ((tempTrip) ? this.#determineIsOnTime(tempTrip) : 'N/A') + '</p>' +
            '<div class="divider"></div>' +
            '<p>Load: ' + this.currCapacity + '/' + this.maxCapacity + '</p>' +
            '<p>Trips Remaining: ' + this.assignedTrips.size + '</p></div>';

        this.infoBox.setContent(this.infoContent);
    }

    createMarkers() {
        this.assignedTrips.forEach( trip => {
            if (trip.active)
                this.tripMarkers.set(trip.confirmation, new LiveMarker(trip));
        });
    }

    updateMarkers() {
        this.assignedTrips.forEach(trip => {
            if (this.tripMarkers.has(trip.confirmation) && !trip.active) {
                this.tripMarkers.get(trip.confirmation).destroy();
                this.tripMarkers.delete(trip.confirmation);
            }
            else if (this.tripMarkers.has(trip.confirmation) && trip.active) {
                if (trip.status == 'PICKEDUP')
                    this.tripMarkers.get(trip.confirmation).updateToPickedUp();
            }
            else if (!this.tripMarkers.has(trip.confirmation) && trip.active)
                this.tripMarkers.set(trip.confirmation, new LiveMarker(trip));
        });

        this.tripMarkers.forEach(marker => {
            if (!this.assignedTrips.has(marker.id)) {
                this.tripMarkers.delete(marker.id);
                marker.destroy();
            }
        });
    }

    updateVehiclePath() {
        if (!this.assignedTrips) return;

        let tempPath = [];

        tempPath.push(this.currPos);

        this.assignedTrips.forEach( trip => {
            if(trip.active) {
                if (trip.status != 'PICKEDUP')
                    tempPath.push(trip.PUcoords);
                tempPath.push(trip.DOcoords);
            }                
        });

        this.path.setPath(tempPath);
    }

    rotateMarker(heading=0) {
        if (!this.symbol)
            this.createLiveVehicle();

        let icon = this.symbol.getIcon();
        icon.rotation = heading;

        this.symbol.setIcon(icon);
    }

    showMarker() {
        this.symbol.setMap(map);
    }

    showTripMarkers() {
        this.tripMarkers.forEach(trip => {
            trip.showMarkers();
        });
    }

    showPath() {
        this.path.setMap(map);
    }

    hideMarker() {
        this.symbol.setMap(null);
    }

    hideTripMarkers() {
        this.tripMarkers.forEach(trip => {
            trip.hideMarkers();
        });
    }

    hidePath() {
        this.path.setMap(null);
    }

    addTrip(trip) {
        if(!trip) return;

        this.assignedTrips.set(trip.confirmation, trip);
    }

    removeTrip(trip) {
        if(!trip) return;

        this.assignedTrips.delete(trip.confirmation);
    }

    getActiveTripCount() {
        let count = 0;

        this.assignedTrips.forEach(trip => {
            if(trip.active)
                count++;
        });

        return count;
    }

    clearTrips() {
        this.assignedTrips.clear();
    }

    focusSelf() {
        map.setCenter(this.currPos);
        map.setZoom(15);
    }

    calcRotation(startPos, endPos) {
        if (startPos && endPos)
            return google.maps.geometry.spherical.computeHeading(startPos, endPos);
    }

    #determineIsOnTime(trip) {
        if (!trip) return 'N/A';

        let tempDate = new Date();

        if (trip.status == 'PICKEDUP') {
            if (tempDate.getTime() > trip.schDODateTime.getTime()) {
                let diffMin = Math.round((((tempDate - trip.schDODateTime) % 86400000) % 3600000) / 60000);

                return '<span class="red-text">LATE (+' + diffMin + ' min)</span>';
            }
            else
                return '<span class="green-text">ON TIME</span>';
        }
        else
            return '<span class="amber-text">TBD</span>';
    }
}

export { LiveVehicle }