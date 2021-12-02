import { parseTime } from './parseInput.js';
import { timeToString } from './clock.js';
import { zones } from './zoneList.js';
import { Trip } from './trip.js';

var liveQueueEntries = new Map();
var queueWin = document;
var activeVehicle;

const QUEUE_BAR = queueWin.getElementById('queue_bar');
const QUEUE_LISTS = queueWin.getElementById('lists');

const VEHICLE_LIST = queueWin.getElementById('vehicle_list');
const VEHICLE_SEARCH = queueWin.getElementById('vehicle_search');
const VEHICLE_DROPDOWN = queueWin.getElementById('vehicle_dropdown')

const VEHICLE_LIST_ENTRY_TYPE = {
    vehicle: 0,
    zone: 1,
    divider: 2,
    none: 4
}

queueWin.getElementById('popqueue').addEventListener('click', popQueue);

//init vehicle drop down element with options
$('#vehicle_dropdown').dropdown({ closeOnClick: false, autoTrigger: false });

function initLiveQueue() {
    if (liveQueueEntries.size != 0) clearLiveQueueEntries();

    createLiveQueueEntries();

    for (const entry of [...liveQueueEntries.values()]) {
        if (entry?.vehicle) {
            updateVehicleDropdown(entry);
            entry.toggleTripListVisibility();
            activeVehicle = entry;
            break;
        }
    }
}

function handleVehicleSelect(vehicleEntry) {
    updateVehicleDropdown(vehicleEntry);
    activeVehicle.toggleTripListVisibility();
    vehicleEntry.toggleTripListVisibility();
    activeVehicle = vehicleEntry
}

function createLiveQueueEntries() {
    zones.forEach(zone => {
        if (zone.name != 'NONE' && zone.vehiclesInZone.size) {
            liveQueueEntries.set(zone.name, new VehicleListEntry(VEHICLE_LIST_ENTRY_TYPE.zone, zone));
            liveQueueEntries.set(zone.name + '-divider', new VehicleListEntry(VEHICLE_LIST_ENTRY_TYPE.divider));

            zone.vehiclesInZone.forEach(vehicle => {
                liveQueueEntries.set(vehicle.name, new VehicleListEntry(VEHICLE_LIST_ENTRY_TYPE.vehicle, vehicle));
                liveQueueEntries.get(vehicle.name).populateTripList();
            });
        }
    });

    let noneZone = zones.get('none');

    if (noneZone.vehiclesInZone.size == 0) return;

    liveQueueEntries.set(noneZone.name, new VehicleListEntry(VEHICLE_LIST_ENTRY_TYPE.zone, noneZone));
    liveQueueEntries.set(noneZone.name + '-divider', new VehicleListEntry(VEHICLE_LIST_ENTRY_TYPE.divider));

    noneZone.vehiclesInZone.forEach(vehicle => {
        liveQueueEntries.set(vehicle.name, new VehicleListEntry(VEHICLE_LIST_ENTRY_TYPE.vehicle, vehicle));
    });
}

function clearLiveQueueEntries() {
    liveQueueEntries.forEach(entry => {
        entry.destroy();
    });

    liveQueueEntries.clear();
}

function updateVehicleDropdown(vehicleEntry) {
    if (!vehicleEntry?.fullyInit) return;

    let newIcon = vehicleEntry.elem.firstChild.children[0].cloneNode(true);
    newIcon.style.margin = '10px';

    VEHICLE_DROPDOWN.replaceChild(newIcon, VEHICLE_DROPDOWN.children[0]);
    VEHICLE_DROPDOWN.children[1].innerText = 'Vehicle #' + vehicleEntry.vehicle.name;
}

function isQueuePoped() {
    return queueWin != document;
}

function popQueue() {
    return 1;
}

//Only accepets Instances of 'Trip' Object! (see trip.js)
class TripListEntry {
    constructor(owner = null, tripObj = null) {
        if (!(tripObj instanceof Trip)) this._throw('No Trip Specified.');

        this.trip = tripObj;
        this.owner = owner;

        this.fullyInit = false;

        this.constructElement();
    }

    constructElement() {
        if (!this.owner.tripsElem) return;

        this.elem = queueWin.createElement('li');
        this.elem.setAttribute('class', 'live-triplist-item card-panel white collection-item avatar');

        this.elem.tripIcon = queueWin.createElement('i');
        this.elem.tripIcon.setAttribute('class', 'trip-icon material-icons circle');
        this.elem.tripIcon.innerText = this.trip.type;

        this.elem.tripTitleBar = queueWin.createElement('div');
        this.elem.tripTitleBar.setAttribute('class', 'trip-title-bar');

        this.elem.tripTitle = queueWin.createElement('span');
        this.elem.tripTitle.setAttribute('class', 'trip-title');
        this.elem.tripTitle.innerText = this.trip.name;

        this.elem.tripAdr = queueWin.createElement('p');
        this.elem.tripAdr.setAttribute('class', 'trip-adr truncate');
        this.elem.tripAdr.innerHTML = this.trip.PUadr + ' <i class="material-icons">arrow_forward</i> ' + this.trip.DOadr;


        this.elem.tripTitleBar.appendChild(this.elem.tripTitle);
        this.elem.appendChild(this.elem.tripIcon);
        this.elem.appendChild(this.elem.tripTitleBar);
        this.elem.appendChild(this.elem.tripAdr);

        this.fullyInit = true;
        this.owner.tripsElem.appendChild(this.elem);
    }

    setActive() {
        if (!this.elem) return;

        this.elem.tripETA = queueWin.createElement('span');
        this.elem.tripETA.setAttribute('class', 'trip-eta cyan-text text-darken-1');
        if (this.trip.schTime && this.trip.speed)
            this.elem.tripETA.innerText = 'Eta. ' + timeToString(parseTime(this.trip.schTime) + this.trip.speed);
        else
            this.elem.tripETA.innerText = 'Unknown Eta.';

        this.elem.tripProg = queueWin.createElement('div');
        this.elem.tripProg.setAttribute('class', 'trip-prog');

        this.elem.tripProgBar = queueWin.createElement('div');
        this.elem.tripProgBar.setAttribute('class', 'trip-prog-bar progress');
        this.elem.tripProgBar.innerHTML = '<div class="determinate" style ="width: 0%"></div>';

        this.elem.tripProgStatus = queueWin.createElement('span');
        this.elem.tripProgStatus.setAttribute('class', 'trip-prog-status amber-text');
        this.elem.tripProgStatus.innerHTML = '<i class="material-icons tiny">help</i> unknown';

        
        this.elem.tripTitleBar.appendChild(this.elem.tripETA);
        this.elem.tripProg.appendChild(this.elem.tripProgBar);
        this.elem.tripProg.appendChild(this.elem.tripProgStatus);
        this.elem.appendChild(this.elem.tripProg);
    }

    destroy() {
        this.trip = null;
        this.owner = null;

        this?.elem.remove();
    }

    _throw(msg) {
        throw new Error(msg);
    }
}

class VehicleListEntry {
    constructor(type = VEHICLE_LIST_ENTRY_TYPE.none, refObj=null) {
        this.type = type;
        this.fullyInit = false;

        switch(this.type) {
            case VEHICLE_LIST_ENTRY_TYPE.vehicle:
                this.vehicle = (refObj) ? refObj : this._throw('No Vehicle Specified.');
                this.ID = refObj.name;
                this.tripList = new Map();
                break;
            case VEHICLE_LIST_ENTRY_TYPE.zone:
                this.zone = (refObj) ? refObj : this._throw('No Zone Specified.');
                this.ID = refObj.name;
                break;
            default:
                break;
        }

        this.constructElement();
    }

    constructElement() {
        if (!VEHICLE_LIST) return;

        this.elem = queueWin.createElement('li');

        switch (this.type) {
            case VEHICLE_LIST_ENTRY_TYPE.vehicle:
                let vehicleElem = queueWin.createElement('a');
                vehicleElem.setAttribute('href', '#!');
                vehicleElem.style.background = this.vehicle.zone.color + '10';
                vehicleElem.innerText = '#' + this.vehicle.name;

                let vehicleIcon = queueWin.createElement('i');
                vehicleIcon.setAttribute('class', 'material-icons left');
                vehicleIcon.style.color = this.vehicle.color;
                vehicleIcon.innerText = this.vehicle.type.icon;

                if (!this.vehicle.color.localeCompare('white', undefined, { sensitivity: 'base' })) {
                    vehicleIcon.style.webkitTextStroke = '1px black';
                }

                vehicleElem.appendChild(vehicleIcon);
                this.elem.appendChild(vehicleElem);
                this.elem.addEventListener('click', () => { handleVehicleSelect(this); });
                break;
            case VEHICLE_LIST_ENTRY_TYPE.zone:
                this.elem.classList.add('interactable');

                let zoneElem = queueWin.createElement('a');
                //adding alpha transparency to hex
                zoneElem.style.background = this.zone.color + '10';
                zoneElem.innerHTML= 'Zone: ' + this.zone.name + ' - <b>' + this.zone.vehiclesInZone.size + '</b>';

                this.elem.appendChild(zoneElem);
                break;
            case VEHICLE_LIST_ENTRY_TYPE.divider:
                this.elem.classList.add('divider');
                this.elem.setAttribute('tabindex', '-1');
                break;
        }

        this.fullyInit = true;
        VEHICLE_LIST.appendChild(this.elem);
    }

    populateTripList() {
        if (!this.vehicle) return;

        this.tripsElem = queueWin.createElement('ul');
        this.tripsElem.setAttribute('class', 'collection white scrollbar-primary triplist showable');

        this.vehicle.assignedTrips.forEach(trip => {
            this.tripList.set( trip.confirmation, new TripListEntry(this, trip));
        });

        if(this.tripList.size != 0)
            [...this.tripList.values()][0].setActive();

        QUEUE_LISTS.appendChild(this.tripsElem);
    }

    clearTripList() {
        if (!this.tripList) return;

        this.tripList.forEach( trip => {
            trip.destroy();
        });

        this.tripList.clear();
    }

    //make sure object gets GCed
    destroy() {
        if(this.vehicle)
            this.vehicle = null;
        if(this.zone)
            this.zone = null;

        this.clearTripList();
        this?.elem.remove();
        this?.tripsElem.remove();
    }

    toggleTripListVisibility() {
        this.tripsElem.classList.toggle('showable');
    }

    _throw(msg) {
        throw new Error(msg); 
    }
}

export { initLiveQueue };