import { stopSimulation, currMode } from './main.js';
import { vehicles } from './vehicleList.js';
import { INIT_MODE } from './constants.js';
import { timeToString } from './utils.js';

document.getElementById('normalspeed').addEventListener('click', setSpeedNormal);
document.getElementById('fastspeed').addEventListener('click', setSpeedFast);

const btnNormal = document.getElementById('normalspeed');
const btnFast = document.getElementById('fastspeed');
const clock = document.getElementById('clock');

var clockStartTime, clockCurrTime;
var simSpeedFactor = 1; // 1 second = 1 minute  @ factor = 1
let clockInterval;

clockStartTime = clockCurrTime = 0;

function initClock(startTime = 0) {
    if (currMode == INIT_MODE.live) {
        startSYSClock()

        btnNormal.style.display = 'none';
        btnFast.style.display = 'none';
    }
    else {
        clockCurrTime = clockStartTime = startTime;
        clock.innerHTML = timeToString(clockStartTime);

        startSIMClock();

        btnNormal.style.display = 'block';
        btnFast.style.display = 'block';
    }
}

function startSIMClock() {
    clockInterval = window.setInterval(() => {
        tickClock();
    }, (1000 * simSpeedFactor));
}

function startSYSClock() {
    setClock();

    clockInterval = window.setInterval(() => {
        setClock();
    }, (15000));
}

function stopClock() {
    clockInterval = window.clearInterval(clockInterval);
}

function tickClock() {
    if (clockCurrTime == 1440)
        clockCurrTime = 1;
    else
        clock.innerHTML = timeToString(++clockCurrTime);
}

function setClock() {
    let sysTime = new Date();

    clock.innerText = sysTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit'
    });
}

function clearClock() {
    initClock(1440);
}

function updateSimSpeed() {
    stopClock();
    vehicles.forEach(vehicle => {
        vehicle.stopDispatch();
    });
    stopSimulation();

    startSIMClock();
    vehicles.forEach(vehicle => {
        vehicle.autoDispatch();
        vehicle.forceDispatch();
    });
}

function setSpeedFast() {
    btnNormal.classList.replace('light-green', 'grey');
    btnFast.classList.replace('grey', 'light-green');
    btnNormal.classList.toggle('interactable');
    btnFast.classList.toggle('interactable');

    simSpeedFactor = .2;
    updateSimSpeed();
}

function setSpeedNormal() {
    btnNormal.classList.replace('grey', 'light-green');
    btnFast.classList.replace('light-green', 'grey');
    btnNormal.classList.toggle('interactable');
    btnFast.classList.toggle('interactable');

    simSpeedFactor = 1;
    updateSimSpeed();
}

export { initClock, startSIMClock, startSYSClock, stopClock, timeToString, simSpeedFactor, clockCurrTime, clearClock };