import { handleVehicleSelect, liveQueueEntries, activeVehicle } from './liveQueue.js';
import { isColor, timeToString } from './utils.js';
import { map, setMapZoom } from './map.js';
import { ARROW_LINE_SYMBOL } from './constants.js';
import { liveVehicles } from './vehicleList.js';
import { LiveMarker } from './liveMarker.js';
import { zones } from './zoneList.js';

class LiveVehicle {
    constructor(params = nulls) {
        if (!params) throw new Error('Null / undefined parameters used in liveVehicle');

        this.maxCapacity = params.maxCapacity;
        this.currCapacity = params.currCapacity;
        this.currPos = params.currPos;
        this.heading = params.heading;
        this.type = params.type;
        this.name = params.name;
        this.id = params.id;

        this.tripsCompleted = 0;

        this.zone = (zones.has(params.zoneID)) ? zones.get(params.zoneID) : zones.get('NONE');
        this.zone.addVehicle(this);

        //ID by confirmation num
        this.assignedTrips = new Map();
        //ID by confirmation num
        this.tripMarkers = new Map();
        this.isFocusingMarker = false;
        this.focusedMarker;

        this.tripDisplayWindow = {
            lower: { 
                timeString: '12:00 AM', 
                timeVal: 0 
            },
            upper: { 
                timeString: '11:59 PM', 
                timeVal: 1439 
            },
            getTimeVals: function() { 
                return [this.lower.timeVal, this.upper.timeVal];
            },
            setTimeVals: function(values) {
                this.lower.timeVal = values[0];
                this.lower.timeString = timeToString(values[0]);
                this.upper.timeVal = values[1];
                this.upper.timeString = timeToString(values[1]);
            },
            isDefaultVals: function() {
                return (this.lower.timeVal == 0 && this.upper.timeVal == 1439);
            }
        };

        this.color = (isColor(params.color?.toLowerCase())) ? params.color?.toLowerCase() : 'black';

        this.path = new google.maps.Polyline({
            path: [this.currPos],
            strokeOpacity: 0,
            icons: [
                {
                    icon: ARROW_LINE_SYMBOL,
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
        this.symbol.setZIndex(google.maps.Marker.MAX_ZINDEX + 5);

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

        liveVehicles.delete(this.id);
    }

    handleClick() {
        this.unfocusTripMarker();
        this.updateVehiclePath();
        this.infoBox.open(map);

        handleVehicleSelect(liveQueueEntries.get(this.id));
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
                this.tripMarkers.set(trip.confirmation, new LiveMarker(trip, this));
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
                this.tripMarkers.set(trip.confirmation, new LiveMarker(trip, this));
        });

        this.tripMarkers.forEach(marker => {
            if (!this.assignedTrips.has(marker.id)) {
                this.tripMarkers.delete(marker.id);
                marker.destroy();
            }
        });

        if (!this.tripDisplayWindow.isDefaultVals())
            this.updateTimedMarkers(true)
    }

    updateTimedMarkers(autoUpdate=false) {
        if(autoUpdate && this.isFocusingMarker) return;

        this.unfocusTripMarker();

        this.hidePath();
        this.hideTripMarkers();
        this.tripMarkers.clear();

        let testStart, testEnd;

        testStart = new Date('01/01/1970 ' + this.tripDisplayWindow.lower.timeString);
        testEnd = new Date('01/01/1970 ' + this.tripDisplayWindow.upper.timeString);

        this.assignedTrips.forEach(trip => {
            if (trip.active)
                if (new Date('01/01/1970 ' + trip.schPUTime) >= testStart &&
                    new Date('01/01/1970 ' + trip.schDOTime) <= testEnd)
                    this.tripMarkers.set(trip.confirmation, new LiveMarker(trip, this));
        });

        this.updateVehiclePath();
        this.showPath();
        this.showTripMarkers();
    }

    updateVehiclePath() {
        if (!this.assignedTrips || this.isFocusingMarker) return;

        let tempPath = [];
        let firstTrip = [...this.assignedTrips.values()].find(trip => {
            if (trip.active)
                return true;
        });

        this.assignedTrips.forEach( trip => {
            if (this.tripMarkers.has(trip.confirmation)) {
                if(trip.active) {
                    if (firstTrip?.confirmation === trip.confirmation)
                        tempPath.push(this.currPos);
                    if (trip.status != 'PICKEDUP')
                        tempPath.push(trip.PUcoords);
                    tempPath.push(trip.DOcoords);
                }  
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
        this.tripMarkers.forEach(marker => {
            marker.showMarkers();
        });
    }

    showPath() {
        this.path.setMap(map);
    }

    hideMarker() {
        this.symbol.setMap(null);

        this.unfocusTripMarker();
    }

    hideTripMarkers() {
        this.tripMarkers.forEach(marker => {
            marker.hideMarkers();
        });
    }

    hidePath() {
        this.path.setMap(null);
    }

    addTrip(trip) {
        if(!trip) return;

        this.assignedTrips.set(trip.confirmation, trip);
    }

    sortTrips() {
        if(!this.assignedTrips.size) return;

        this.assignedTrips = new Map([...this.assignedTrips].sort((a,b) => {
            if (a[1].schPUDateTime.getTime() < b[1].schPUDateTime.getTime())
                return -1;
            else if (a[1].schPUDateTime.getTime() > b[1].schPUDateTime.getTime())
                return 1;
            else
                return 0;
        }));
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
        setMapZoom(15);
    }

    calcRotation(startPos, endPos) {
        if (startPos && endPos)
            return google.maps.geometry.spherical.computeHeading(startPos, endPos);
    }

    focusTripMarker(markerID) {
        if (this.isFocusingMarker)
            this.unfocusTripMarker();

        this.isFocusingMarker = true;
        this.setPathOpaque();

        this.tripMarkers.forEach(marker => {
            if(marker.id != markerID)
                marker.setOpaque();
            else {
                this.focusedMarker = marker;

                marker.setSolid();
                marker.showPath();

                if(this.assignedTrips.get(markerID).status !== 'PICKEDUP') {
                    this.#resizeMapToFitMarkers(marker);
                }
                else {
                    map.setCenter(marker.DOcoords);
                    setMapZoom(17);
                }
            }
        });
    }

    unfocusTripMarker() {
        if (!this.isFocusingMarker) return;

        this.focusedMarker.hidePath();
        this.focusedMarker = null;
        this.isFocusingMarker = false;

        this.tripMarkers.forEach( marker => {
            marker.setSolid();
        });

        this.setPathSolid();
    }

    setPathOpaque() {
        const icons = this.path.get("icons");

        icons[0].icon.strokeOpacity = 0.33;
        icons[0].icon.fillOpacity = 0.33;
        this.path.setOptions({ icons: icons });
    }

    setPathSolid() {
        const icons = this.path.get("icons");

        icons[0].icon.strokeOpacity = 1;
        icons[0].icon.fillOpacity = 1;
        this.path.setOptions({ icons: icons });
    }

    hide() {
        if (this.isFocusingMarker)
            this.unfocusTripMarker();

        this.hidePath();
        this.hideTripMarkers();
    }

    show() {
        if (this.isFocusingMarker)
            this.unfocusTripMarker();

        this.showPath();
        this.showTripMarkers();
    }

    #resizeMapToFitMarkers(marker) {
        let bounds = new google.maps.LatLngBounds();
        let prevZoom = map.getZoom();

        bounds.extend(marker.PUcoords);
        bounds.extend(marker.DOcoords);

        map.fitBounds(bounds);
        map.setZoom(prevZoom);
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