import { createGeneralStats, createVehicleStats, clearGeneralStats, clearVehicleStats } from './statisticsList.js';
import { createTripTabs, createTripLists, clearTripTabs, clearTripLists } from './tripQueue.js';
import { initCoords, initMode, initEventEntry, simArea } from './constants.js';
import { initMap, createVehicleIcon, drawStaticIcons } from './map.js';
import { populateRandVehicles, vehicles } from './vehicleList.js';
import { startClock, stopClock } from './clock.js';
import { drawMaterial } from './barChart.js';
import { APIinit } from './APIinput.js';
import { initEvent } from './log.js';

let curMode = initMode.none;
let prevInitalized = false;

function initSimulation(mode, coords = initCoords[0]) {
    initMap(coords);

    if (prevInitalized) {
        clearTripTabs();
        clearTripLists();
        clearGeneralStats();
        clearVehicleStats()
        stopClock();
    }

    // !event
    switch (mode) {
        case initMode.test:
            populateRandVehicles(3);
            setHeaderTitle(simArea.DC);
            initEvent(initEventEntry.test);
            break;
        case initMode.file:
            setHeaderTitle(simArea.Cust);
            initEvent(initEventEntry.file);
            break;
        case initMode.API:
            setHeaderTitle(simArea.DC);
            initEvent(initEventEntry.API);
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
    startClock();

    if (!prevInitalized)
        prevInitalized = true;

    curMode = mode;
}

async function startSequence() {
    try {
        await APIinit();
    }
    catch (err) {
        console.log(err);
        initEvent(initEventEntry.APIError);
        initSimulation(initMode.test);
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
    document.getElementById('headertitle').innerHTML = area + specialMsg;
}

function main() {
    startSequence();
}

main();

export { stopSimulation, initSimulation, materializeInit, curMode };