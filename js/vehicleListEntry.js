import { VEHICLE_LIST, QUEUE_LISTS, VEHICLE_LIST_ENTRY_TYPE, handleVehicleSelect, queueWin } from './liveQueue.js';
import { TripListEntry } from './TripListEntry.js';
import { resetMapCenter } from './map.js';

class VehicleListEntry {
    constructor(type = VEHICLE_LIST_ENTRY_TYPE.none, refObj = null, refZone = null) {
        this.type = type;
        this.fullyInit = false;

        switch (this.type) {
            case VEHICLE_LIST_ENTRY_TYPE.vehicle:
                this.vehicle = (refObj) ? refObj : this.#_throw('No Vehicle Specified.');
                this.name = refObj.name;
                this.refZone = refZone;
                this.tripList = new Map();
                this.passengerCache = 0;
                break;
            case VEHICLE_LIST_ENTRY_TYPE.zone:
                this.zone = (refObj) ? refObj : this.#_throw('No Zone Specified.');
                this.name = refObj.name;
                break;
            case VEHICLE_LIST_ENTRY_TYPE.search:
            case VEHICLE_LIST_ENTRY_TYPE.general:
                this.tripList = new Map();
                break;
            default:
                break;
        }

        this.constructElement();
    }

    //make sure object gets GCed
    destroy() {
        if (this.vehicle)
            this.vehicle = null;
        if (this.zone)
            this.zone = null;

        this.clearTripList();
        this?.elem.remove();
        this?.tripsElem.remove();
    }

    constructElement() {
        if (!VEHICLE_LIST) return;

        this.elem = queueWin.createElement('li');

        switch (this.type) {
            case VEHICLE_LIST_ENTRY_TYPE.vehicle:
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
                break;
            case VEHICLE_LIST_ENTRY_TYPE.zone:
                this.elem.classList.add('interactable');

                let zoneElem = queueWin.createElement('a');
                //adding alpha transparency to hex
                zoneElem.style.background = this.zone.color + '10';
                zoneElem.innerHTML = 'Zone: ' + this.zone.name;

                this.elem.appendChild(zoneElem);
                break;
            case VEHICLE_LIST_ENTRY_TYPE.search:
            case VEHICLE_LIST_ENTRY_TYPE.general:
                let isGeneral = (this.type == VEHICLE_LIST_ENTRY_TYPE.general);

                let listElem = queueWin.createElement('a');
                listElem.innerText = (isGeneral) ? 'Active Trips' : 'Search Results';

                let listIcon = queueWin.createElement('i');
                listIcon.setAttribute('class', 'material-icons left');
                listIcon.style.color = (isGeneral) ? '' : 'white';
                listIcon.innerText = 'format_list_bulleted';

                listElem.appendChild(listIcon);
                this.elem.appendChild(listElem);

                this.createTripList();
                QUEUE_LISTS.appendChild(this.tripsElem);

                this.fullyInit = true;

                if (isGeneral) {
                    this.elem.addEventListener('click', () => { handleVehicleSelect(this); resetMapCenter(); });
                    VEHICLE_LIST.appendChild(this.elem);
                }

                return;
            case VEHICLE_LIST_ENTRY_TYPE.divider:
                this.elem.classList.add('divider');
                this.elem.setAttribute('tabindex', '-1');
                break;
        }

        this.fullyInit = true;

        if (this.refZone)
            this.refZone.elem.after(this.elem);
        else
            VEHICLE_LIST.appendChild(this.elem);
    }

    updateTripCount() {
        if (!this.type == VEHICLE_LIST_ENTRY_TYPE.vehicle) return;
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
        if (!this.vehicle) return;

        if (!this.tripsElem) {
            this.tripsElem = queueWin.createElement('ul');
            this.tripsElem.setAttribute('class', 'collection white scrollbar-primary triplist showable');
        }

        this.clearTripList();

        if (this.vehicle.assignedTrips.size != 0) {
            this.vehicle.assignedTrips.forEach(trip => {
                this.tripList.set(trip.confirmation, new TripListEntry(this, trip));
            });

            //get all trip obj's
            const tempTripsElements = [...this.tripList.values()];
            //re-style & re-order the trip cards based on status
            tempTripsElements.forEach(element => { element.reStyle(); });
            //find the first active element, then set it active.
            tempTripsElements.find(element => element.active)?.setActive();
        }
        else
            this.createEmptyList();

        QUEUE_LISTS.appendChild(this.tripsElem);
    }

    clearTripList() {
        if (this.type == VEHICLE_LIST_ENTRY_TYPE.zone || this.type == VEHICLE_LIST_ENTRY_TYPE.divider)
            return;

        while (this.tripsElem.firstChild) {
            this.tripsElem.removeChild(this.tripsElem.firstChild);
        }

        if (this.type != VEHICLE_LIST_ENTRY_TYPE.search)
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
                if (this.type == VEHICLE_LIST_ENTRY_TYPE.search)
                    emptyElem.textNode.innerText = 'No trips found.';
                else if (this.type == VEHICLE_LIST_ENTRY_TYPE.general)
                    emptyElem.textNode.innerText = 'No active trips.';
                else
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

export { VehicleListEntry };