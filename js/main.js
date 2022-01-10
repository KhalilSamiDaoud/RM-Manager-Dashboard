//make sure configuration files are the first things to load!
import './configuration.js';
import { INIT_COORDS, INIT_MODE, LIVE_NOTIF, SIM_NOTIF, LOG_ENTRY_TYPES } from './constants.js';
import { initClock, startSYSClock, startSIMClock } from './clock.js';
import { initMap, createVehicleIcon, drawStaticIcons } from './map.js';
import { liveVehicles, populateRandVehicles, vehicles } from './vehicleList.js';
import { initCalendar, updateLiveButton } from './calendar.js';
import { drawMaterial } from './barChart.js';
import { initLive } from './APIinput.js';
import { addEvent } from './liveLog.js';
import { initLiveQueue } from './liveQueue.js';
import { initZoneSelect } from './zoneList.js';
import { initSettings } from './settings.js';

let currMode = INIT_MODE.none;
let prevInitalized = false;

function initSimulation(mode = INIT_MODE.none, startTime = 0, coords = INIT_COORDS) {
    currMode = mode;
    updateLiveButton(mode);
    initCalendar(mode);
    initClock(startTime);
    initSettings();
    initMap(coords);

    // if (prevInitalized) {
    //     clearTripTabs();
    //     clearTripLists();
    //     clearGeneralStats();
    //     clearVehicleStats();
    //     stopClock();
    // }

    // !event
    switch (mode) {
        case INIT_MODE.test:
            populateRandVehicles(3);
            addEvent(LOG_ENTRY_TYPES.test);
            break;
        case INIT_MODE.file:
            addEvent(LOG_ENTRY_TYPES.file);
            break;
        case INIT_MODE.API:
            addEvent(LOG_ENTRY_TYPES.API);
            break;
        case INIT_MODE.live:
            addEvent(LOG_ENTRY_TYPES.live);
            break;
        default:
            return;
    }

    // createTripTabs();
    //createTripLists();
    // createGeneralStats();
    // createVehicleStats();

    if(mode != INIT_MODE.live) {
        vehicles.forEach(vehicle => {
            vehicle.updateQueue();
            createVehicleIcon(vehicle);
            vehicle.autoDispatch();
        });
    }
    else {
        liveVehicles.forEach(vehicle => {
            vehicle.createLiveVehicle();
            vehicle.updateInfoBox();
            vehicle.updateVehiclePath();
            vehicle.createMarkers();
        });
    }

    initLiveQueue();
    initZoneSelect();

    drawStaticIcons();

    if (prevInitalized)
        materializeReload();
    else
        materializeInit();

    if (!prevInitalized)
        prevInitalized = true;

    if (mode == INIT_MODE.live) {
        setHeaderTitle('Dashboard', LIVE_NOTIF);
        startSYSClock();
    }
    else {
        setHeaderTitle('Dashboard', SIM_NOTIF);
        startSIMClock()
    }
}

async function startSequence() {
    try {
        await initLive();
    }
    catch (error) {
        console.error('DASH-API Initialization error: ', error);
        addEvent(LOG_ENTRY_TEXT.APIError);
        initSimulation(INIT_MODE.test);
    }
}

function stopSimulation() {
    vehicles.forEach(vehicle => {
        vehicle.clearIntervals();
        vehicle.clearPath();
    });
}

function materializeInit() {
    if (!prevInitalized) {
        $('.sidenav').sidenav();
        $('.preloader').fadeOut('slow');
        $('.timepicker').timepicker({container: 'body'});
    }
    $('.modal').modal();
    $('.showable').show();
    $('.tooltipped').tooltip();
    $('#tabs').tabs();
}

function materializeReload() {
    materializeInit();
    $('#tabs').tabs().tabs('select', vehicles[0].name);
}

function setHeaderTitle(title, specialMsg = '') {
    document.title = title;
    document.getElementById('headertitle').firstChild.innerHTML = title + specialMsg;
}

function main() {
    startSequence();
}

main();

export { stopSimulation, initSimulation, materializeInit, currMode };