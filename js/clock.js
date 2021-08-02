import { vehicles } from './vehicleList.js';
import { stopSimulation } from './main.js';

document.getElementById('normalspeed').addEventListener('click', setSpeedNormal);
document.getElementById('fastspeed').addEventListener('click', setSpeedFast);

const btnNormal = document.getElementById('normalspeed');
const btnFast = document.getElementById('fastspeed');
const clock = document.getElementById('clock').firstChild;

var clockStartTime, clockCurrTime;
var simSpeedFactor = 1; // 1 second = 1 minute  @ factor = 1
let clockInterval;

clockStartTime = clockCurrTime = 0;
initClock();

function initClock(startTime = 0) {
    clockCurrTime = clockStartTime = startTime;

    clock.innerHTML = timeToString(clockStartTime);
}

function timeToString(time = clockCurrTime) {
    let hours = Math.floor(time / 60);
    let minutes = time % 60;

    if (hours < 12)
        return (hours == 0) ? ("00" + hours + 12).slice(-2) + ':' + ("00" + minutes).slice(-2) + ' AM' : ("00" + hours).slice(-2) + ':' + ("00" + minutes).slice(-2) + ' AM';
    else
        return (hours == 24) ? ("00" + (hours - 12)).slice(-2) + ':' + ("00" + minutes).slice(-2) + ' AM' : ("00" + (hours - 12)).slice(-2) + ':' + ("00" + minutes).slice(-2) + ' PM';
}

function startClock() {
    clockInterval = window.setInterval(() => {
        tickClock();
    }, (1000 * simSpeedFactor));
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

function clearClock() {
    initClock(1440);
}

function updateSimSpeed() {
    stopClock();
    vehicles.forEach(vehicle => {
        vehicle.stopDispatch();
    });
    stopSimulation();

    startClock();
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

export { initClock, startClock, stopClock, timeToString, simSpeedFactor, clockCurrTime, clearClock };