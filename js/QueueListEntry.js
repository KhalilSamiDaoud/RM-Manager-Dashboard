import { VEHICLE_LIST, QUEUE_LISTS, PU_STATUS, handleVehicleSelect, queueWin } from './liveQueue.js';
import { TripListEntry } from './TripListEntry.js';
import { LiveMarker } from './liveMarker.js';
import { resetMapCenter } from './map.js';

const Q_ENTRY_TYPE = {
    vehicle: 0,
    zone: 1,
    divider: 2,
    search: 3,
    active: 4,
    none: 5,
}

class VehicleQListEntry {
    constructor(refObj, refZoneEntry) {
        this.vehicle = (refObj) ? refObj : this.#_throw('No Vehicle Specified.');
        this.refZoneEntry = refZoneEntry;

        this.type = Q_ENTRY_TYPE.vehicle;
        this.fullyInit = false;
        this.name = refObj.name;
        this.tripList = new Map();
        this.passengerCache = 0;

        this.constructElement();
    }

    //make sure object gets GCed
    destroy() {
        this.vehicle = null;

        this.clearTripList();
        this?.elem.remove();
        this?.tripsElem.remove();
    }

    constructElement() {
        this.elem = queueWin.createElement('li');

        let vehicleElem = queueWin.createElement('a');
        vehicleElem.setAttribute('href', '#!');
        vehicleElem.style.background = this.vehicle.zone.color + '10';
        vehicleElem.innerHTML = '#' + this.vehicle.name +
            '&nbsp <b style="float:right"><i class="material-icons" style="font-size: 18px;">pin_drop</i>:&nbsp' +
            this.vehicle.getActiveTripCount() + '</b>';

        let vehicleIcon = queueWin.createElement('i');
        vehicleIcon.setAttribute('class', 'material-icons left');
        vehicleIcon.style.color = this.vehicle.color;
        vehicleIcon.innerText = this.vehicle.type.icon;

        if (this.vehicle.color === 'white' || this.vehicle.color === 'grey' || this.vehicle.color === 'gray')
            vehicleIcon.style.webkitTextStroke = '1px black';

        this.passengerCache = this.vehicle.getActiveTripCount();

        vehicleElem.appendChild(vehicleIcon);
        this.elem.appendChild(vehicleElem);
        this.elem.addEventListener('click', () => { handleVehicleSelect(this); });

        this.fullyInit = true;

        if (this.refZoneEntry)
            this.refZoneEntry.elem.after(this.elem);
        else
            VEHICLE_LIST.appendChild(this.elem);
    }

    updateTripCount() {
        let tempPsngrs = this.vehicle.getActiveTripCount();
        if (this.passengerCache == tempPsngrs) return;

        this.passengerCache = tempPsngrs;

        let vehicleElem = queueWin.createElement('a');
        vehicleElem.setAttribute('href', '#!');
        vehicleElem.style.background = this.vehicle.zone.color + '10';
        vehicleElem.innerHTML = '#' + this.vehicle.name +
            '&nbsp <b style="float:right"><i class="material-icons" style="font-size: 18px;">pin_drop</i>:&nbsp' +
            tempPsngrs + '</b>';

        let vehicleIcon = queueWin.createElement('i');
        vehicleIcon.setAttribute('class', 'material-icons left');
        vehicleIcon.style.color = this.vehicle.color;
        vehicleIcon.innerText = this.vehicle.type.icon;

        if (!this.vehicle.color.localeCompare('white', undefined, { sensitivity: 'base' })) {
            vehicleIcon.style.webkitTextStroke = '1px black';
        }

        vehicleElem.appendChild(vehicleIcon);

        while (this.elem.firstChild)
            this.elem.removeChild(this.elem.firstChild);

        this.elem.appendChild(vehicleElem);
    }

    createTripList() {
        if (!this.tripsElem) {
            this.tripsElem = queueWin.createElement('ul');
            this.tripsElem.setAttribute('class', 'collection white scrollbar-primary triplist showable');
        }

        this.clearTripList();
    }

    populateTripList() {
        if (!this.tripsElem) {
            this.tripsElem = queueWin.createElement('ul');
            this.tripsElem.setAttribute('class', 'collection white scrollbar-primary triplist showable');
        }

        this.clearTripList();

        if (this.vehicle.assignedTrips.size != 0) {
            this.vehicle.assignedTrips.forEach(trip => {
                this.tripList.set(trip.confirmation, new TripListEntry(this, trip));
            });

            const tempTripsElements = [...this.tripList.values()];
            tempTripsElements.forEach(element => { element.reStyle(); });
            tempTripsElements.find(element => element.active)?.setActive();
        }
        else
            this.createEmptyList();

        QUEUE_LISTS.appendChild(this.tripsElem);
    }

    clearTripList() {
        while (this.tripsElem.firstChild) {
            this.tripsElem.removeChild(this.tripsElem.firstChild);
        }

        this.tripList?.forEach(trip => {
            trip.destroy();
        });

        this.tripList.clear();
    }

    toggleTripListVisibility() {
        this.tripsElem.classList.toggle('showable');
    }

    createEmptyList() {
        if (!this.tripsElem) return;

        let emptyElem;
        let i = 0;

        while (i < 3) {
            emptyElem = queueWin.createElement('li');
            emptyElem.setAttribute('class', 'live-triplist-empty valign-wrapper');

            if (i == 0) {
                emptyElem.textNode = queueWin.createElement('span');
                emptyElem.textNode.setAttribute('style', 'margin:auto;');
                emptyElem.textNode.innerText = 'No assigned trips.';

                emptyElem.appendChild(emptyElem.textNode);
            }
            else
                emptyElem.style.opacity = (1 / (i * 3));

            this.tripsElem.appendChild(emptyElem);
            i++;
        }
    }

    #_throw(msg) { throw new Error(msg); }
}

class ZoneQListEntry {
    constructor(refObj) {
        this.type = Q_ENTRY_TYPE.zone;
        this.fullyInit = false;

        this.zone = (refObj) ? refObj : this.#_throw('No Zone Specified.');
        this.name = refObj.name;

        this.constructElement();
    }

    destroy() {
        this.zone = null;

        this?.elem.remove();
    }

    constructElement() {
        this.elem = queueWin.createElement('li');
        this.elem.classList.add('interactable');

        let zoneElem = queueWin.createElement('a');
        //adding alpha transparency to hex
        zoneElem.style.background = this.zone.color + '10';
        zoneElem.innerHTML = 'Zone: ' + this.zone.name;

        this.fullyInit = true;

        this.elem.appendChild(zoneElem);
        VEHICLE_LIST.appendChild(this.elem);
    }

    #_throw(msg) { throw new Error(msg); }
}

class DividerQListEntry {
    constructor() {
        this.type = Q_ENTRY_TYPE.divider;
        this.fullyInit = false;

        this.constructElement();
    }

    destroy() {
        this?.elem.remove();
    }

    constructElement() {
        if (!VEHICLE_LIST) return;

        this.elem = queueWin.createElement('li');
        this.elem.classList.add('divider');
        this.elem.setAttribute('tabindex', '-1');

        this.fullyInit = true;

        VEHICLE_LIST.appendChild(this.elem);
    }
}

class ActiveQListEntry {
    constructor(liveQueueRef) {
        this.type = Q_ENTRY_TYPE.active;
        this.fullyInit = false;

        this.liveQueueRef = liveQueueRef;
        this.tripList = new Map();
        //id by trip confirmation
        this.specialMarkers = new Map();
        this.focusedTrip;

        this.constructElement();
    }

    destroy() {
        this.clearTripList();
        this?.elem.remove();
        this?.tripsElem.remove();
    }

    constructElement() {
        this.elem = queueWin.createElement('li');
        this.elem.addEventListener(
            'click',
            () => {
                handleVehicleSelect(this); resetMapCenter();
            });

        let listElem = queueWin.createElement('a');
        listElem.innerText = 'Active Trips';

        let listIcon = queueWin.createElement('i');
        listIcon.setAttribute('class', 'material-icons left');
        listIcon.innerText = 'format_list_bulleted';
        listIcon.style.color = '';

        this.createTripList();
        QUEUE_LISTS.appendChild(this.tripsElem);

        this.fullyInit = true;

        listElem.appendChild(listIcon);
        this.elem.appendChild(listElem);
        VEHICLE_LIST.appendChild(this.elem);
    }

    createTripList() {
        if (!this.tripsElem) {
            this.tripsElem = queueWin.createElement('ul');
            this.tripsElem.setAttribute('class', 'collection white scrollbar-primary triplist showable');
        }

        this.clearTripList();
    }

    clearTripList() {
        while (this.tripsElem.firstChild) {
            this.tripsElem.removeChild(this.tripsElem.firstChild);
        }

        if (this.type != Q_ENTRY_TYPE.search)
            this.tripList?.forEach(trip => {
                trip.destroy();
            });

        this.tripList.clear();
    }

    toggleTripListVisibility() {
        this.tripsElem.classList.toggle('showable');
    }

    createEmptyList() {
        if (!this.tripsElem) return;

        let emptyElem;
        let i = 0;

        while (i < 3) {
            emptyElem = queueWin.createElement('li');
            emptyElem.setAttribute('class', 'live-triplist-empty valign-wrapper');

            if (i == 0) {
                emptyElem.textNode = queueWin.createElement('span');
                emptyElem.textNode.setAttribute('style', 'margin:auto;');
                emptyElem.textNode.innerText = 'No active trips.';

                emptyElem.appendChild(emptyElem.textNode);
            }
            else
                emptyElem.style.opacity = (1 / (i * 3));

            this.tripsElem.appendChild(emptyElem);
            i++;
        }
    }

    updateActiveTripsList() {
        let tempElem;
        this.clearTripList();
        this.clearSpecialMarkers();

        this.liveQueueRef.forEach(entry => {
            if (entry.type === Q_ENTRY_TYPE.vehicle) {
                entry.tripList.forEach(tripEntry => {
                    if (tripEntry.pickedUpStatus !== PU_STATUS.none) {
                        tempElem = tripEntry.elem.cloneNode(true);
                        tempElem.setAttribute('id', tripEntry.trip.confirmation);
                        tempElem.classList.add('pointer-cursor');
                        tempElem.addEventListener(
                            'click', 
                            this.#handleTripSelect.bind(this)
                        );
                        tempElem.getElementsByTagName('span')[0].addEventListener(
                            'click', 
                            tripEntry.handlePersonSelect.bind(tripEntry)
                        );

                        this.createSpecialMarker(tripEntry.trip, entry.vehicle);

                        this.tripList.set(tripEntry.trip.confirmation, tripEntry);
                        this.tripsElem.appendChild(tempElem);
                    }
                });
            }
        });

        this.showSpecialMarkers();

        if (this.tripsElem.childNodes.length === 0)
            this.createEmptyList();
    }

    createSpecialMarker(trip, vehicle) {
        let tempMarker = new LiveMarker(trip, vehicle, this);

        this.specialMarkers.set(trip.confirmation, tempMarker);
    }

    clearSpecialMarkers() {
        this.specialMarkers.forEach( marker => {
            marker.destroy();
        });

        this.specialMarkers.clear();
    }

    showSpecialMarkers() {
        this.specialMarkers.forEach( marker => {
            marker.showMarkers();
        });
    }

    hideSpecialMarkers() {
        this.specialMarkers.forEach( marker => {
            marker.hideMarkers();
            marker.hidePath();
        });

        this.focusedTrip = null;
    }

    focusTripMarker(id) {
        if (this.focusedTrip) {
            this.focusedTrip.hidePath();
            this.focusedTrip.hideInfoBox()
        }

        let tempMarker = this.specialMarkers.get(id);
        tempMarker.showMarkers();
        tempMarker.showPath();

        this.focusedTrip = tempMarker;
    }

    #handleTripSelect(e) {
        this.focusTripMarker(Number(e.currentTarget.id));
    }
}

class SearchQListEntry {
    constructor() {
        this.type = Q_ENTRY_TYPE.search;
        this.fullyInit = false;

        this.tripList = new Map();

        //id by trip confirmation
        this.specialMarkers = new Map();
        this.focusedTrip;

        this.constructElement();
    }

    //make sure object gets GCed
    destroy() {
        this.clearTripList();
        this?.elem.remove();
        this?.tripsElem.remove();
    }

    constructElement() {
        this.elem = queueWin.createElement('li');

        let listElem = queueWin.createElement('a');
        listElem.innerText = 'Search Results';

        let listIcon = queueWin.createElement('i');
        listIcon.setAttribute('class', 'material-icons left');
        listIcon.style.color = 'white';
        listIcon.innerText = 'format_list_bulleted';

        this.createTripList();
        QUEUE_LISTS.appendChild(this.tripsElem);

        this.fullyInit = true;

        listElem.appendChild(listIcon);
        this.elem.appendChild(listElem);
    }

    createTripList() {
        if (!this.tripsElem) {
            this.tripsElem = queueWin.createElement('ul');
            this.tripsElem.setAttribute('class', 'collection white scrollbar-primary triplist showable');
        }

        this.clearTripList();
    }

    clearTripList() {
        while (this.tripsElem.firstChild) {
            this.tripsElem.removeChild(this.tripsElem.firstChild);
        }

        this.tripList.clear();
    }

    toggleTripListVisibility() {
        this.tripsElem.classList.toggle('showable');
    }

    createEmptyList() {
        if (!this.tripsElem) return;

        let emptyElem;
        let i = 0;

        while (i < 3) {
            emptyElem = queueWin.createElement('li');
            emptyElem.setAttribute('class', 'live-triplist-empty valign-wrapper');

            if (i == 0) {
                emptyElem.textNode = queueWin.createElement('span');
                emptyElem.textNode.setAttribute('style', 'margin:auto;');
                emptyElem.textNode.innerText = 'No trips found.';

                emptyElem.appendChild(emptyElem.textNode);
            }
            else
                emptyElem.style.opacity = (1 / (i * 3));

            this.tripsElem.appendChild(emptyElem);
            i++;
        }
    }

    updateSearchList() {
        let tempElem;

        this.tripList.forEach(tripEntry => {
            tempElem = tripEntry.elem.cloneNode(true);
            tempElem.setAttribute('id', tripEntry.trip.confirmation);
            tempElem.classList.add('pointer-cursor');
            tempElem.addEventListener(
                'click',
                this.#handleTripSelect.bind(this)
            );
            tempElem.getElementsByTagName('span')[0].addEventListener(
                'click',
                tripEntry.handlePersonSelect.bind(tripEntry)
            );

            this.createSpecialMarker(tripEntry.trip, tripEntry.parent.vehicle);

            this.tripsElem.appendChild(tempElem);
        });

        this.showSpecialMarkers();

        if (this.tripsElem.childNodes.length == 0)
            this.createEmptyList();
    }

    createSpecialMarker(trip, vehicle) {
        let tempMarker = new LiveMarker(trip, vehicle, this);

        this.specialMarkers.set(trip.confirmation, tempMarker);
    }

    clearSpecialMarkers() {
        this.specialMarkers.forEach(marker => {
            marker.destroy();
        });

        this.specialMarkers.clear();
    }

    showSpecialMarkers() {
        this.specialMarkers.forEach(marker => {
            marker.showMarkers();
        });
    }

    hideSpecialMarkers() {
        this.specialMarkers.forEach(marker => {
            marker.hideMarkers();
            marker.hidePath();
        });

        this.focusedTrip = null;
    }

    focusTripMarker(id) {
        if (this.focusedTrip) {
            this.focusedTrip.hidePath();
            this.focusedTrip.hideInfoBox()
        }

        let tempMarker = this.specialMarkers.get(id);
        tempMarker.showMarkers();
        tempMarker.showPath();

        this.focusedTrip = tempMarker;
    }

    #handleTripSelect(e) {
        this.focusTripMarker(Number(e.currentTarget.id));
    }
}

export { VehicleQListEntry, ZoneQListEntry, DividerQListEntry, ActiveQListEntry, SearchQListEntry, Q_ENTRY_TYPE };