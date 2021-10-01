import { createGeneralStats, createVehicleStats, clearGeneralStats, clearVehicleStats } from './statisticsList.js';
import { initCoords, initMode, initEventEntry, liveNotification, SimulationNotification, colors } from './constants.js';
import { createTripTabs, createTripLists, clearTripTabs, clearTripLists } from './tripQueue.js';
import { initClock, startSYSClock, startSIMClock, stopClock } from './clock.js';
import { initMap, createVehicleIcon, drawStaticIcons } from './map.js';
import { populateRandVehicles, vehicles } from './vehicleList.js';
import { initEvent, lateEvent, breakDownEvent, noShowEvent, driverEvent } from './log.js';
import { initCalendar, updateLiveButton } from './calendar.js';
import { drawMaterial } from './barChart.js';
import { Zone } from './zone.js';
import { LiveVehicle } from './liveVehicle.js';

let curMode = initMode.none;
let prevInitalized = false;

function initSimulation(mode = initMode.none, startTime = 0, coords = initCoords[0]) {
    curMode = mode;
    updateLiveButton(mode);
    initCalendar(mode);
    initClock(startTime);
    initMap(coords);

    if (prevInitalized) {
        clearTripTabs();
        clearTripLists();
        clearGeneralStats();
        clearVehicleStats();
        stopClock();
    }

    // !event
    switch (mode) {
        case initMode.test:
            populateRandVehicles(3);
            initEvent(initEventEntry.test);
            break;
        case initMode.file:
            initEvent(initEventEntry.file);
            break;
        case initMode.API:
            initEvent(initEventEntry.API);
            break;
        case initMode.live:
            populateRandVehicles(3);
            //remove me also
            let x = new Zone('Test Zone 1', colors[0]);
            x.addZone();
            new LiveVehicle('#001-01', 0, colors[0]);
            new LiveVehicle('#001-02', 0, colors[0]);
            initEvent(initEventEntry.live);
            break;
        default:
            return;
    }

    createTripTabs();
    createTripLists();
    createGeneralStats();
    createVehicleStats();

    vehicles.forEach(vehicle => {
        vehicle.updateQueue();
        createVehicleIcon(vehicle);
        vehicle.autoDispatch();
    });

    drawStaticIcons();

    if (prevInitalized)
        materializeReload();
    else
        materializeInit();

    drawMaterial();

    if (!prevInitalized)
        prevInitalized = true;

    if (mode == initMode.live) {
        //temp REMOVE ME
        lateEvent(1, 5, '11:55');
        lateEvent(2, 12, '11:48');
        lateEvent(3, 20, '11:40');
        breakDownEvent();
        noShowEvent('11:55');
        driverEvent(1);
        driverEvent(2);

        setHeaderTitle('Dashboard', liveNotification);
        startSYSClock();
    }
    else {
        setHeaderTitle('Dashboard', SimulationNotification);
        startSIMClock()
    }
}

async function startSequence() {
    initSimulation(initMode.live);
    // try {
    //     await APIinit();
    // }
    // catch (err) {
    //     console.log(err);
    //     initEvent(initEventEntry.APIError);
    //     initSimulation(initMode.test);
    // }
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

function setHeaderTitle(area, specialMsg = '') {
    document.title = area;
    document.getElementById('headertitle').firstChild.innerHTML = area + specialMsg;
}

function main() {
    startSequence();
}

main();

export { stopSimulation, initSimulation, materializeInit, curMode };