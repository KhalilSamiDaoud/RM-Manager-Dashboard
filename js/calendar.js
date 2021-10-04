import { initSimulation, stopSimulation, curMode } from './main.js';
import { initMode } from './constants.js';
import { APIinit } from './APIinput.js';

const datePickerElem = document.getElementById('doipicker');
const liveButton = document.getElementById('livebutton');
const doneButton = document.getElementsByClassName('datepicker-done');
const currDate = new Date();

let datePickerInstance = M.Datepicker.init(datePickerElem, { 
    defaultDate: currDate,
    maxDate: currDate, 
    setDefaultDate: true,
    format: 'm/dd/yyyy'
});

liveButton.addEventListener('click', liveInit);
doneButton[0].addEventListener('click', handleDateSelect);

function initCalendar(mode = initMode.none) {
    if (mode == initMode.live) {
        enableCalendar();
        return;
    }
    else if (mode != initMode.API) {
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
    if(mode == initMode.live) {
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

    console.log(pickedDate);
    console.log(currDate.toLocaleDateString());

    if (pickedDate == currDate.toLocaleDateString() && curMode == initMode.live)
        return;
    else if (pickedDate == currDate.toLocaleDateString())
        liveInit();
    else
        APIinit(pickedDate);
}

function liveInit() {
    stopSimulation();
    initSimulation(initMode.live);
}

export { initCalendar, updateLiveButton };