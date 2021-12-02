import { initSimulation, stopSimulation, currMode } from './main.js';
import { INIT_MODE } from './constants.js';
import { initAPI } from './APIinput.js';

const datePickerElem = document.getElementById('doipicker');
const liveButton = document.getElementById('livebutton');
const doneButton = document.getElementsByClassName('datepicker-done');
const currDate = new Date();

let datePickerInstance = M.Datepicker.init(datePickerElem, { 
    defaultDate: currDate,
    maxDate: currDate, 
    setDefaultDate: true,
    format: 'm/d/yyyy'
});

liveButton.addEventListener('click', liveInit);
doneButton[0].addEventListener('click', handleDateSelect);

function initCalendar(mode = INIT_MODE.none) {
    if (mode == INIT_MODE.live) {
        enableCalendar();
        return;
    }
    else if (mode != INIT_MODE.API) {
        disableCalendar();
        return;
    }
}

function enableCalendar() {
    datePickerInstance.setDate(currDate);
    datePickerElem.value = (currDate.toLocaleDateString());
    datePickerElem.style.opacity = 1;
    datePickerElem.classList.remove('interactable');
}

function disableCalendar() {
    datePickerElem.value = '  Simulated';
    datePickerElem.style.opacity = 0.5;
    datePickerElem.classList.add('interactable');
}

function updateLiveButton(mode) {
    if(mode == INIT_MODE.live) {
        if(!liveButton.classList.contains('interactable')) {
            liveButton.classList.toggle('interactable');
            liveButton.style.opacity = 0.5;
        }
    }
    else {
        if (liveButton.classList.contains('interactable')) {
            liveButton.classList.toggle('interactable');
            liveButton.style.opacity = 1;
        }
    }
}

function handleDateSelect() {
    let pickedDate = datePickerInstance.toString();

    if (pickedDate == currDate.toLocaleDateString() && currMode == INIT_MODE.live)
        return;
    else if (pickedDate == currDate.toLocaleDateString())
        liveInit();
    else
        initAPI(pickedDate);
}

function liveInit() {
    stopSimulation();
    initSimulation(INIT_MODE.live);
}

export { initCalendar, updateLiveButton };