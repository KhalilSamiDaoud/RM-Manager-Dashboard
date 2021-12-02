import { createGeneralStats, createVehicleStats, clearGeneralStats, clearVehicleStats } from './statisticsList.js';
import { INIT_COORDS, INIT_MODE, INIT_EVENT_TYPE, LIVE_NOTIF, SIM_NOTIF} from './constants.js';
import { createTripTabs, createTripLists, clearTripTabs, clearTripLists } from './tripQueue.js';
import { initClock, startSYSClock, startSIMClock, stopClock } from './clock.js';
import { initMap, createVehicleIcon, drawStaticIcons } from './map.js';
import { liveVehicles, populateRandVehicles, vehicles } from './vehicleList.js';
import { initCalendar, updateLiveButton } from './calendar.js';
import { drawMaterial } from './barChart.js';
import { initLive } from './APIinput.js';
import { initEvent } from './log.js';

import './zoneList.js';
import './liveQueue.js';
import { initLiveQueue } from './liveQueue.js';

let currMode = INIT_MODE.none;
let prevInitalized = false;

function initSimulation(mode = INIT_MODE.none, startTime = 0, coords = INIT_COORDS[0]) {
    currMode = mode;
    updateLiveButton(mode);
    initCalendar(mode);
    initClock(startTime);
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
            initEvent(INIT_EVENT_TYPE.test);
            break;
        case INIT_MODE.file:
            initEvent(INIT_EVENT_TYPE.file);
            break;
        case INIT_MODE.API:
            initEvent(INIT_EVENT_TYPE.API);
            break;
        case INIT_MODE.live:
            initEvent(INIT_EVENT_TYPE.live);
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
        });
    }

    initLiveQueue();

    drawStaticIcons();

    if (prevInitalized)
        materializeReload();
    else
        materializeInit();

    drawMaterial();

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
        initEvent(INIT_EVENT_TYPE.APIError);
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
        $('.dropdown-trigger').dropdown();
        $('select').formSelect();
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

function* IDgenerator(IDprefix=null) {
    let ID = 0;

    while (true) {
        ++ID;

        yield (IDprefix) ? IDprefix + ID : ID;
    }
}

function main() {
    startSequence();
}

main();

export { stopSimulation, initSimulation, materializeInit, IDgenerator, currMode };