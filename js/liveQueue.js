import { VehicleQListEntry, ZoneQListEntry, DividerQListEntry, ActiveQListEntry, SearchQListEntry, Q_ENTRY_TYPE } from './QueueListEntry.js';
import { setSlider, checkQFooterDisabled } from './doubleTimeSlider.js';
import { zones } from './zoneList.js';

//ID by vehicle name
var liveQueueEntries = new Map();
var queueWin = document;

var activeVehicle, activeTripsList;

const QUEUE_LISTS = queueWin.getElementById('lists');
const VEHICLE_LIST = queueWin.getElementById('vehicle_list');
const VEHICLE_SEARCH = queueWin.getElementById('vehicle_search');
const VEHICLE_DROPDOWN = queueWin.getElementById('vehicle_dropdown');

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

    updateVehicleDropdown(activeTripsList);
    activeTripsList.toggleTripListVisibility();
    activeVehicle = activeTripsList;
}

function handleVehicleSelect(vehicleEntry) {
    updateVehicleDropdown(vehicleEntry);
    checkQFooterDisabled(vehicleEntry);

    activeVehicle.toggleTripListVisibility();
    if (activeVehicle.vehicle) {
        activeVehicle.vehicle.unfocusTripMarker();
        activeVehicle.vehicle.hide();
    }
    if (activeVehicle == activeTripsList || activeVehicle == searchList)
        activeVehicle.hideSpecialMarkers();


    vehicleEntry.toggleTripListVisibility();
    if (vehicleEntry.vehicle) {
        vehicleEntry.vehicle.show();
        vehicleEntry.vehicle.focusSelf();
    }
    if (activeVehicle == activeTripsList || activeVehicle == searchList)
        vehicleEntry.showSpecialMarkers();

    activeVehicle = vehicleEntry;

    if (vehicleEntry.vehicle)
        setSlider(vehicleEntry.vehicle.tripDisplayWindow.getTimeVals());
}

function handleVehicleSearch(evt) {
    let filterString = evt.target.value.toUpperCase();
    let entries = [...liveQueueEntries.values()];

    for (let i=0; i < entries.length; i++) {
        if (entries[i].type == Q_ENTRY_TYPE.vehicle || entries[i].type == Q_ENTRY_TYPE.zone) {
            if (!entries[i].name.includes(filterString)) {
                entries[i].elem.classList.add('showable');

                if (entries[i].type == Q_ENTRY_TYPE.zone)
                    liveQueueEntries.get(entries[i].name + '-divider').elem.classList.add('showable');
            }
            else {
                entries[i].elem.classList.remove('showable');

                if (entries[i].type == Q_ENTRY_TYPE.zone) {
                    liveQueueEntries.get(entries[i].name + '-divider').elem.classList.remove('showable');

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
    activeTripsList = new ActiveQListEntry(liveQueueEntries);
    liveQueueEntries.set('general', activeTripsList);

    zones.forEach(zone => {
        if (zone.name != 'NONE' && zone.vehiclesInZone.size) {
            liveQueueEntries.set(zone.name, new ZoneQListEntry(zone));
            liveQueueEntries.set(zone.name + '-divider', new DividerQListEntry());

            zone.vehiclesInZone.forEach(vehicle => {
                liveQueueEntries.set(vehicle.id, new VehicleQListEntry(vehicle));
                liveQueueEntries.get(vehicle.id).populateTripList();
            });
        }
    });

    let noneZone = zones.get('NONE');

    liveQueueEntries.set(noneZone.name, new ZoneQListEntry(noneZone));
    liveQueueEntries.set(noneZone.name + '-divider', new DividerQListEntry());

    noneZone.vehiclesInZone.forEach(vehicle => {
        liveQueueEntries.set(vehicle.id, new VehicleQListEntry(vehicle));
    });

    activeTripsList.updateActiveTripsList();
}

function clearLiveQueueEntries() {
    liveQueueEntries.forEach(entry => {
        entry.destroy();
    });

    liveQueueEntries.clear();
}

function updateVehicleDropdown(vehicleEntry) {
    if (!vehicleEntry?.fullyInit) return;

    if(vehicleEntry.type != Q_ENTRY_TYPE.vehicle) {
        let newIcon = vehicleEntry.elem.firstChild.children[0].cloneNode(true);
        newIcon.style.margin = '10px';

        VEHICLE_DROPDOWN.replaceChild(newIcon, VEHICLE_DROPDOWN.children[0]);
        VEHICLE_DROPDOWN.children[1].innerText = (vehicleEntry.type == Q_ENTRY_TYPE.active) ? 'Active Trips' : 'Search Results';
    }
    else {
        let newIcon = vehicleEntry.elem.firstChild.children[1].cloneNode(true);
        newIcon.style.margin = '10px';

        VEHICLE_DROPDOWN.replaceChild(newIcon, VEHICLE_DROPDOWN.children[0]);
        VEHICLE_DROPDOWN.children[1].innerText = 'Vehicle #' + vehicleEntry.vehicle.name;
    }
}

function updateLiveQueueEntries(vehicle) {
    let zoneElement = liveQueueEntries.get(vehicle.zone.name);

    if(!zoneElement) {
        liveQueueEntries.set(vehicle.zone.name, new ZoneQListEntry(vehicle.zone));
        liveQueueEntries.set(vehicle.zone.name + '-divider', new DividerQListEntry());

        zoneElement = liveQueueEntries.get(vehicle.zone.name);
    }

    liveQueueEntries.set(vehicle.id, new VehicleQListEntry(vehicle, zoneElement));
    liveQueueEntries.get(vehicle.id).populateTripList();
}

function updateVehicleTripLists() {
    liveQueueEntries.forEach( entry => {
        if(entry.type == Q_ENTRY_TYPE.vehicle) {
            entry.populateTripList();
            entry.updateTripCount();
        }
    });

    activeTripsList.updateActiveTripsList();
}

function isQueuePoped() {
    return queueWin != document;
}

function popQueue() {
    return 1;
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

const searchList = new SearchQListEntry();

function handleTripSearchApply() {
    searchList.clearTripList();
    searchList.clearSpecialMarkers();

    handleTextSearch();

    searchList.updateSearchList();

    handleVehicleSelect(searchList);
}

function handleTextSearch() {
    if (!NAME_SEARCH.value && !ADDRESS_SEARCH.value) {
        handleStatusSearch(false);
        return;
    }

    liveQueueEntries.forEach(entry => {
        if (entry.type == Q_ENTRY_TYPE.vehicle)
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
            if (entry.type == Q_ENTRY_TYPE.vehicle)
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
            if (entry.type == Q_ENTRY_TYPE.vehicle)
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

export { initLiveQueue, updateVehicleTripLists, handleVehicleSelect, 
    updateLiveQueueEntries, queueWin, liveQueueEntries, activeVehicle, 
    PU_STATUS, QUEUE_LISTS, VEHICLE_LIST };