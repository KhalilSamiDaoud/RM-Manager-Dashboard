import { zones } from './zoneList.js';
import { Trip } from './trip.js';

//ID by vehicle name
var liveQueueEntries = new Map();
var queueWin = document;

var activeVehicle;

const QUEUE_LISTS = queueWin.getElementById('lists');
const VEHICLE_LIST = queueWin.getElementById('vehicle_list');
const VEHICLE_SEARCH = queueWin.getElementById('vehicle_search');
const VEHICLE_DROPDOWN = queueWin.getElementById('vehicle_dropdown');

const VEHICLE_LIST_ENTRY_TYPE = {
    vehicle: 0,
    zone: 1,
    divider: 2,
    search: 3,
    none: 4,
}

const PU_STATUS = {
    onTime: 0,
    TBD: 1,
    late: 2,
    none: 3
}

queueWin.getElementById('popqueue').addEventListener('click', popQueue);
VEHICLE_SEARCH.addEventListener('keyup', handleVehicleSearch);

//init vehicle drop down element with options
$('#vehicle_dropdown').dropdown({ autoTrigger: false, onCloseEnd: resetVehicleSearch });

function initLiveQueue() {
    if (liveQueueEntries.size != 0) clearLiveQueueEntries();

    createLiveQueueEntries();

    for (const entry of liveQueueEntries.values()) {
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
    if (activeVehicle.vehicle) {
        activeVehicle.vehicle.hideTripMarkers();
        activeVehicle.vehicle.hidePath();
    }

    vehicleEntry.toggleTripListVisibility();
    if (vehicleEntry.vehicle) {
        vehicleEntry.vehicle.showTripMarkers();
        vehicleEntry.vehicle.showPath();
        vehicleEntry.vehicle.focusSelf();
    }
    
    activeVehicle = vehicleEntry;
}

function handleVehicleSearch(evt) {
    let filterString = evt.target.value.toUpperCase();
    let entries = [...liveQueueEntries.values()];

    for (let i=0; i < entries.length; i++) {
        if (entries[i].type != VEHICLE_LIST_ENTRY_TYPE.divider) {
            if (!entries[i].ID.includes(filterString)) {
                entries[i].elem.classList.add('showable');

                if (entries[i].type == VEHICLE_LIST_ENTRY_TYPE.zone)
                    liveQueueEntries.get(entries[i].ID + '-divider').elem.classList.add('showable');
            }
            else {
                entries[i].elem.classList.remove('showable');

                if (entries[i].type == VEHICLE_LIST_ENTRY_TYPE.zone) {
                    liveQueueEntries.get(entries[i].ID + '-divider').elem.classList.remove('showable');

                    let x = i;
                    while (x <= (i + entries[i].zone.vehiclesInZone.size)) {
                        x++;
                        entries[x].elem.classList.remove('showable');
                    }
                    i = x;
                }
            }
        }
    }
}

function resetVehicleSearch() {
    VEHICLE_SEARCH.value = '';

    for (const entry of [...liveQueueEntries.values()]) {
        entry.elem.classList.remove('showable');
    }
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

    if(vehicleEntry.type == VEHICLE_LIST_ENTRY_TYPE.search) {
        let newIcon = vehicleEntry.elem.firstChild.children[0].cloneNode(true);
        newIcon.style.margin = '10px';

        VEHICLE_DROPDOWN.replaceChild(newIcon, VEHICLE_DROPDOWN.children[0]);
        VEHICLE_DROPDOWN.children[1].innerText = 'Search Results';
    }
    else {
        let newIcon = vehicleEntry.elem.firstChild.children[1].cloneNode(true);
        newIcon.style.margin = '10px';

        VEHICLE_DROPDOWN.replaceChild(newIcon, VEHICLE_DROPDOWN.children[0]);
        VEHICLE_DROPDOWN.children[1].innerText = 'Vehicle #' + vehicleEntry.vehicle.name;
    }
}

function updateVehicleTripLists() {
    liveQueueEntries.forEach( entry => {
        if(entry.type == VEHICLE_LIST_ENTRY_TYPE.vehicle) {
            entry.populateTripList();
            entry.updateTripCount();
        }
    })
}

function isQueuePoped() {
    return queueWin != document;
}

function popQueue() {
    return 1;
}

//Only accepets Instances of 'Trip' Object! (see trip.js)
class TripListEntry {
    constructor(parent = null, tripObj = null) {
        if (!(tripObj instanceof Trip)) this.#_throw('No Trip Specified.');

        this.trip = tripObj;
        this.parent = parent;

        this.fullyInit = false;
        this.active = true;
        this.pickedUpStatus = PU_STATUS.none;

        this.constructElement();
    }

    constructElement() {
        if (!this.parent.tripsElem) return;

        this.elem = queueWin.createElement('li');
        this.elem.setAttribute('class', 'live-triplist-item card-panel collection-item avatar');

        this.elem.tripIcon = queueWin.createElement('i');
        this.elem.tripIcon.setAttribute('class', 'trip-icon material-icons circle');
        this.elem.tripIcon.innerText = this.#determineIcon(this.trip.status);

        this.elem.tripTitleBar = queueWin.createElement('div');
        this.elem.tripTitleBar.setAttribute('class', 'trip-title-bar');

        this.elem.tripTitle = queueWin.createElement('span');
        this.elem.tripTitle.setAttribute('class', 'trip-title truncate');
        this.elem.tripTitle.innerText = this.trip.name;

        this.elem.tripAdr = queueWin.createElement('p');
        this.elem.tripAdr.setAttribute('class', 'trip-adr truncate');
        this.elem.tripAdr.innerHTML = this.trip.PUadr + ' <i class="material-icons">arrow_forward</i> ' + this.trip.DOadr;


        this.elem.tripTitleBar.appendChild(this.elem.tripTitle);
        this.elem.appendChild(this.elem.tripIcon);
        this.elem.appendChild(this.elem.tripTitleBar);
        this.elem.appendChild(this.elem.tripAdr);

        this.fullyInit = true;
        this.parent.tripsElem.appendChild(this.elem);
    }

    setActive() {
        if (!this.elem) return;

        this.elem.tripETA = queueWin.createElement('span');
        this.elem.tripETA.setAttribute('class', 'trip-eta cyan-text text-darken-1');
        if (this.trip.schDOTime)
            this.elem.tripETA.innerText = 'Eta. ' + this.trip.schDOTime;
        else
            this.elem.tripETA.innerText = 'Unknown Eta.';

        this.elem.tripProg = queueWin.createElement('div');
        this.elem.tripProg.setAttribute('class', 'trip-prog');

        this.elem.tripProgBar = queueWin.createElement('div');
        this.elem.tripProgBar.setAttribute('class', 'trip-prog-bar progress');
        this.elem.tripProgBar.innerHTML = ('<div></div>');
        if (this.trip.status === 'PICKEDUP') {
            this.elem.tripProgBar.firstChild.classList.add('determinate');
            this.elem.tripProgBar.firstChild.style.width = this.#calcTripProg() + '%';
        }
        else {
            this.elem.tripProgBar.firstChild.classList.add('determinate', 'amber');
            this.elem.tripProgBar.firstChild.style.width = '100%';
        }

        this.elem.tripProgStatus = queueWin.createElement('span');
        this.elem.tripProgStatus.setAttribute('class', 'trip-prog-status');
        if (this.trip.status === 'PICKEDUP') {
            if (new Date().getTime() > this.trip.schDODateTime.getTime()) {
                this.elem.tripProgStatus.classList.add('red-text');
                this.elem.tripProgStatus.innerHTML = '<i class="material-icons tiny">error</i> late';
                this.pickedUpStatus = PU_STATUS.late;
            }
            else {
                this.elem.tripProgStatus.classList.add('green-text');
                this.elem.tripProgStatus.innerHTML = '<i class="material-icons tiny">task_alt</i> on-time';
                this.pickedUpStatus = PU_STATUS.onTime;
            }
        }
        else {
            this.elem.tripProgStatus.classList.add('amber-text');
            this.elem.tripProgStatus.innerHTML = '<i class="material-icons tiny">pending</i> TBD';
            this.pickedUpStatus = PU_STATUS.TBD;
        }

        
        this.elem.tripTitleBar.appendChild(this.elem.tripETA);
        this.elem.tripProg.appendChild(this.elem.tripProgBar);
        this.elem.tripProg.appendChild(this.elem.tripProgStatus);
        this.elem.appendChild(this.elem.tripProg);
    }

    destroy() {
        this.trip = null;
        this.parent = null;

        this?.elem.remove();
    }

    reStyle() {
        switch(this.trip.status) {
            case ('ATLOCATION'):
                this.elem.classList.add('green', 'lighten-4', 'semi-transparent');
                this.pickedUpStatus = PU_STATUS.none;
                this.active = false;

                this.elem.remove();
                this.parent.tripsElem.appendChild(this.elem);
                return;
            case ('CANCELLED'):
            case ('NOSHOWREQ'):
            case ('NOSHOW'):
                this.elem.classList.add('red', 'lighten-4', 'semi-transparent');
                this.pickedUpStatus = PU_STATUS.none;
                this.active = false;

                this.elem.remove();
                this.parent.tripsElem.appendChild(this.elem);
                return;
            case ('NONE'):
                this.elem.classList.add('semi-transparent');
                this.pickedUpStatus = PU_STATUS.none;
                this.active = false;

                this.elem.remove();
                this.parent.tripsElem.appendChild(this.elem);
                return;
            default:
                return;
        }
    }

    #determineIcon(tripType) {
        switch(tripType) {
            case ('BIDOFFERED'):
            case ('ACCEPTED'):
            case ('ASSIGNED'):
            case ('IRTPU'):
                return 'hail';
            case ('PICKEDUP'):
                return 'follow_the_signs';
            case ('ATLOCATION'):
                return 'check_circle_outline';
            case ('CANCELLED'):
            case ('NOSHOWREQ'):
            case ('NOSHOW'):
                return 'cancel';
            case ('NONE'):
            default:
                return 'help_outline';
        }
    }

    #calcTripProg() {
        const mk1 = this.parent.vehicle.currPos;
        const mk2 = this.trip.DOcoords;
        const radian = (Math.PI / 180);
        const R = 3958.8;

        let rlat1 = mk1.lat * radian;
        let rlat2 = mk2.lat * radian;
        let difflat = rlat2 - rlat1;
        let difflng = (mk2.lng - mk1.lng) * radian;

        let currDist = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat / 2) * Math.sin(difflat / 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflng / 2) * Math.sin(difflng/2)));
        let result = (1 - (currDist / this.trip.distance)) * 100;

        return (result > 0) ? (result > 99) ? 100 : Math.floor(result) : 0;
    }

    #_throw(msg) {
        throw new Error(msg);
    }
}

class VehicleListEntry {
    constructor(type = VEHICLE_LIST_ENTRY_TYPE.none, refObj=null) {
        this.type = type;
        this.fullyInit = false;

        switch(this.type) {
            case VEHICLE_LIST_ENTRY_TYPE.vehicle:
                this.vehicle = (refObj) ? refObj : this.#_throw('No Vehicle Specified.');
                this.ID = String(refObj.name);
                this.tripList = new Map();
                this.passengerCache = 0; 
                break;
            case VEHICLE_LIST_ENTRY_TYPE.zone:
                this.zone = (refObj) ? refObj : this.#_throw('No Zone Specified.');
                this.ID = refObj.name;
                break;
            case VEHICLE_LIST_ENTRY_TYPE.search:
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

                if (!this.vehicle.color.localeCompare('white', undefined, { sensitivity: 'base' }) || 
                    !this.vehicle.color.localeCompare('gray', undefined, { sensitivity: 'base' })) {
                    vehicleIcon.style.webkitTextStroke = '1px black';
                }


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
                zoneElem.innerHTML= 'Zone: ' + this.zone.name;

                this.elem.appendChild(zoneElem);
                break;
            case VEHICLE_LIST_ENTRY_TYPE.search:
                let listElem = queueWin.createElement('a');
                listElem.innerText = 'Search Results';

                let listIcon = queueWin.createElement('i');
                listIcon.setAttribute('class', 'material-icons left');
                listIcon.style.color = 'white';
                listIcon.innerText = 'format_list_bulleted';

                listElem.appendChild(listIcon);
                this.elem.appendChild(listElem);
                
                this.createTripList();
                QUEUE_LISTS.appendChild(this.tripsElem);

                this.fullyInit = true;
                return;
            case VEHICLE_LIST_ENTRY_TYPE.divider:
                this.elem.classList.add('divider');
                this.elem.setAttribute('tabindex', '-1');
                break;
        }

        this.fullyInit = true;
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

    while(this.elem.firstChild)
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
        while (this.tripsElem.firstChild) {
            this.tripsElem.removeChild(this.tripsElem.firstChild);
        }

        if(this.type == VEHICLE_LIST_ENTRY_TYPE.vehicle)
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

// ============================================
// QUEUE LIST SEARCH 
// ============================================

const NAME_SEARCH = document.getElementById('trip_name_search');
const ADDRESS_SEARCH = document.getElementById('trip_adr_search');
const ON_TIME_TOGGLE = document.getElementById('trip_status_on_time_search');
const LATE_TIME_TOGGLE = document.getElementById('trip_status_late_search');
const TBD_TIME_TOGGLE = document.getElementById('trip_status_tbd_search');
const TIME_START_SEARCH = document.getElementById('trip_start_time_search');
const TIME_END_SEARCH = document.getElementById('trip_end_time_search');
const APPLY_SEARCH_BTN = document.getElementById('trip_search_apply');
const CLEAR_SEARCH_BTN = document.getElementById('trip_search_clear');

const SEARCH_FIELDS = [NAME_SEARCH, ADDRESS_SEARCH, ON_TIME_TOGGLE, LATE_TIME_TOGGLE,
    TBD_TIME_TOGGLE, TIME_START_SEARCH, TIME_END_SEARCH];

APPLY_SEARCH_BTN.addEventListener('click', handleTripSearchApply);
CLEAR_SEARCH_BTN.addEventListener('click', handleTripSearchClear);

const searchList = new VehicleListEntry(VEHICLE_LIST_ENTRY_TYPE.search, null);

function handleTripSearchApply() {
    searchList.clearTripList();

    handleTextSearch();
    
    searchList.tripList.forEach(trip => {
        searchList.tripsElem.appendChild(trip.elem.cloneNode(true));
    });

    if(searchList.tripsElem.childNodes.length == 0)
        searchList.createEmptyList();

    handleVehicleSelect(searchList);
}

function handleTextSearch() {
    if (!NAME_SEARCH.value && !ADDRESS_SEARCH.value) {
        handleStatusSearch(false);
        return;
    }

    liveQueueEntries.forEach(entry => {
        if (entry.type == VEHICLE_LIST_ENTRY_TYPE.vehicle)
            testTextMatch(entry.tripList);
    });

    handleStatusSearch(true);
}

function handleStatusSearch(isPrePop) {
    if (!LATE_TIME_TOGGLE.checked && !TBD_TIME_TOGGLE.checked && !ON_TIME_TOGGLE.checked) {
        handleTimeSearch(isPrePop);
        return;
    }

    if (isPrePop) {
        searchList.tripList = testRadioMatch(searchList.tripList);
        handleTimeSearch(true);
    }

    else {
        liveQueueEntries.forEach(entry => {
            if (entry.type == VEHICLE_LIST_ENTRY_TYPE.vehicle)
                searchList.tripList = new Map([...searchList.tripList, ...testRadioMatch(entry.tripList)]);
        });

        handleTimeSearch(true);
    }
}

function handleTimeSearch(isPrePop) {
    if (!TIME_START_SEARCH.value && !TIME_END_SEARCH.value) {
        return;
    }

    let testStart, testEnd;

    if (TIME_START_SEARCH.value)
        testStart = new Date('01/01/1970 ' + TIME_START_SEARCH.value);
    if (TIME_END_SEARCH.value)
        testEnd = new Date('01/01/1970 ' + TIME_END_SEARCH.value);


    if (isPrePop)
        searchList.tripList = testTimeMatch(searchList.tripList, testStart, testEnd);

    else {
        liveQueueEntries.forEach(entry => {
            if (entry.type == VEHICLE_LIST_ENTRY_TYPE.vehicle)
                searchList.tripList = new Map([...searchList.tripList, ...testTimeMatch(entry.tripList, testStart, testEnd)]);
        });
    }
}

function testTextMatch(list) {
    list.forEach(tripEntry => {
        if (NAME_SEARCH.value) {
            if (tripEntry.trip.name.toLowerCase().includes(NAME_SEARCH.value.toLowerCase()))
                searchList.tripList.set(tripEntry.trip.confirmation, tripEntry);
        }
        if (ADDRESS_SEARCH.value) {
            if (tripEntry.trip.PUadr.toLowerCase().includes(ADDRESS_SEARCH.value.toLowerCase()) ||
                tripEntry.trip.DOadr.toLowerCase().includes(ADDRESS_SEARCH.value.toLowerCase()))
                searchList.tripList.set(tripEntry.trip.confirmation, tripEntry);
        }
    });
}

function testRadioMatch(list) {
    let tempList = new Map();

    list.forEach(tripEntry => {
        if (ON_TIME_TOGGLE.checked) {
            if (tripEntry.pickedUpStatus == PU_STATUS.onTime)
                tempList.set(tripEntry.trip.confirmation, tripEntry);
        }
        if (TBD_TIME_TOGGLE.checked) {
            if (tripEntry.pickedUpStatus == PU_STATUS.TBD)
                tempList.set(tripEntry.trip.confirmation, tripEntry);
        }
        if (LATE_TIME_TOGGLE.checked) {
            if (tripEntry.pickedUpStatus == PU_STATUS.late)
                tempList.set(tripEntry.trip.confirmation, tripEntry);
        }
    });

    return tempList;
}

function testTimeMatch(list, testStart, testEnd) {
    let tempList = new Map();

    list.forEach(tripEntry => {
        if (testStart) {
            if (new Date('01/01/1970 ' + tripEntry.trip.schPUTime) > testStart) {
                if (testEnd) {
                    if (new Date('01/01/1970 ' + tripEntry.trip.schDOTime) < testEnd)
                        tempList.set(tripEntry.trip.confirmation, tripEntry);
                }
                else {
                    tempList.set(tripEntry.trip.confirmation, tripEntry);
                }
            }
        }
        else if (testEnd) {
            if (new Date('01/01/1970 ' + tripEntry.trip.schDOTime) < testEnd)
                tempList.set(tripEntry.trip.confirmation, tripEntry);
        }
    });

    return tempList;
}

function handleTripSearchClear() {
    SEARCH_FIELDS.forEach(field => {
        if(field.value)
            field.value = '';
        if(field.checked)
            field.checked = false;
    });
}

export { initLiveQueue, updateVehicleTripLists, handleVehicleSelect, queueWin, liveQueueEntries, activeVehicle, VEHICLE_LIST_ENTRY_TYPE };