import { createTripTabs, createTripLists, clearTripTabs, clearTripLists } from './tripQueue.js';
import { initCoords, initMode, initEventEntry, simArea } from './constants.js';
import { initMap, createVehicleIcon, drawStaticIcons } from './map.js';
import { createStatsList, clearStatsList } from './statisticsList.js';
import { populateRandVehicles, vehicles } from './vehicleList.js';
import { startClock, stopClock } from './clock.js';
import { drawMaterial } from './chart.js';
import { APIinit } from './APIinput.js';
import { initEvent } from './log.js';

let prevInitalized = false;

function initSimulation(mode, coords = initCoords[0]) {
    initMap(coords);

    if (prevInitalized) {
        clearTripTabs();
        clearTripLists();
        clearStatsList();
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
    createStatsList();

    vehicles.forEach(vehicle => {
        vehicle.updateQueue();
        createVehicleIcon(vehicle);
        vehicle.autoDispatch();
    });

    drawStaticIcons();

    if (prevInitalized) {
        M.AutoInit();
        $('#tabs').tabs().tabs('select', vehicles[0].name);
        drawMaterial();
    }

    startClock();

    if (!prevInitalized)
        prevInitalized = true;
}

function startSequence() {
    APIinit()
        .then(_ => {
            $('.preloader').fadeOut('slow');
            $('.showable').show();
            $('.tooltipped').tooltip();
            $('.modal').modal();
            $('.tabs').tabs();
            $('.sidenav').sidenav();
        })
        .then(drawMaterial);
}

function stopSimulation() {
    vehicles.forEach(vehicle => {
        vehicle.clearIntervals();
        vehicle.clearPath();
    });
}

function setHeaderTitle(area) {
    document.title = area;
    document.getElementById('headertitle').innerHTML = area;
}

function main() {
    startSequence();
}

main();

export { stopSimulation, initSimulation };