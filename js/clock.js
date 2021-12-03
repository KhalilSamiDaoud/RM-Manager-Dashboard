import { stopSimulation, currMode } from './main.js';
import { vehicles } from './vehicleList.js';
import { INIT_MODE } from './constants.js';

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
        clockCurrTime = clockStartTime = startTime;

        clock.innerHTML = timeToString(clockStartTime);

        btnNormal.style.display = 'none';
        btnFast.style.display = 'none';
    }
    else {
        setClock();
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

function timeToString(time = clockCurrTime, round = true) {
    if (round)
        time = ((time % 1) > 0.5) ? Math.ceil(time) : Math.floor(time);

    let hours = Math.floor(time / 60);
    let minutes = time % 60;

    if (hours < 12)
        return (hours == 0) ? ('00' + hours + 12).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' AM' :
            ('00' + hours).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' AM';
    else if (hours == 12)
        return ('00' + 12).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' PM';
    else
        return (hours == 24) ? ('00' + (hours - 12)).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' AM' :
            ('00' + (hours - 12)).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' PM';
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