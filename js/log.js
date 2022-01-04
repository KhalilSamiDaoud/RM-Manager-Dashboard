import { TRIP_TYPE, WINDOW_TYPE, EVENT_SEVERITY } from './constants.js';
import { createPopWindow, removePopWindow } from './popWindowList.js';
import { timeToString } from './clock.js';
import { checkMapResize } from './map.js';

document.getElementById('clearlog').addEventListener('click', clearEvents);
document.getElementById('poplog').addEventListener('click', popLog);

var logWin = document;
let logBox = logWin.getElementById('logbox');

function addEvent(innerElems = [], colorClass='white') {
    let entry = logWin.createElement('div');
    entry.setAttribute('class', 'z-depth-1 slide ' + colorClass + ((logWin == document) ? ' logentry' : ' logpanelentry'));

    if (innerElems.length > 0)
        innerElems.forEach(elem => {
            entry.appendChild(elem);
        });

    let entryTime = logWin.createElement('a');
    entryTime.setAttribute('class', 'right cyan-text text-darken-1');
    entryTime.innerHTML = timeToString();

    entry.appendChild(entryTime);
    logBox.appendChild(entry);
    autoScroll();
}

function clearEvents() {
    while (logBox.firstChild) {
        logBox.removeChild(logBox.firstChild);
    }
}

function autoScroll() {
    if (logWin == document)
        logBox.scrollTop = (logBox.scrollTop + 300 >= logBox.scrollHeight) ? logBox.scrollHeight : logBox.scrollTop;
    else {
        logBox.scrollTop = (logBox.scrollTop + logWin.defaultView.outerHeight >= logBox.scrollHeight) ? logBox.scrollHeight : logBox.scrollTop;
    }
}

function initEvent(optMsg = undefined) {
    let innerText = (typeof fileName == undefined || optMsg == null) ? 'Initializing route from file' : optMsg;
    let stpElems = [];

    let entryIcon = logWin.createElement('i');
    entryIcon.setAttribute('class', 'material-icons grey-text left');
    entryIcon.innerHTML = 'info_outline';
    stpElems.push(entryIcon);

    let entryText = logWin.createElement('p');
    entryText.innerHTML = innerText;
    stpElems.push(entryText);

    addEvent(stpElems);
}

function fileEvent(fileName = undefined) {
    let innerText = (typeof fileName == undefined || fileName == null) ? 'Loaded user file' : 'Loaded file <em class="">\'' + fileName + '\'</em>';
    let stpElems = [];

    let entryIcon = logWin.createElement('i');
    entryIcon.setAttribute('class', 'material-icons grey-text left');
    entryIcon.innerHTML = 'feed';
    stpElems.push(entryIcon);

    let entryText = logWin.createElement('p');
    entryText.innerHTML = innerText;
    stpElems.push(entryText);

    addEvent(stpElems);
}

function vehicleEvent(vehicle, pos) {
    let tripRef = vehicle.queue[pos];
    let stpElems = [];
    let innerText;

    switch (tripRef.type) {
        case (TRIP_TYPE.pickup):
            innerText = 'pick-up @ ' + tripRef.DOadr;
            break;
        case (TRIP_TYPE.dropoff):
            innerText = 'drop-off @ ' + tripRef.DOadr;
            break;
        case (TRIP_TYPE.fixedstop):
            innerText = 'Arrived at station \'' + tripRef.name + '\'';
            break;
        case (TRIP_TYPE.depot):
            innerText = vehicle.name + ' is Depoting';
            break;
        default:
            innerText = 'Unexpected event';
            break;
    }

    let entryIcon = logWin.createElement('i');
    entryIcon.setAttribute('class', 'material-icons left ' + vehicle.color.class);
    entryIcon.innerHTML = (tripRef.type == TRIP_TYPE.depot) ? 'departure_board' : 'directions_bus';
    stpElems.push(entryIcon);

    if (tripRef.type == TRIP_TYPE.pickup || tripRef.type == TRIP_TYPE.dropoff) {
        let psngrCount = logWin.createElement('span');
        psngrCount.setAttribute('class', 'badge left grey lighten-2 logpassengers');
        psngrCount.innerHTML = ((tripRef.type == TRIP_TYPE.pickup) ? '+' : '-') + tripRef.passengers;
        stpElems.push(psngrCount);
    }

    let entryText = logWin.createElement('p');
    entryText.innerHTML = innerText;
    stpElems.push(entryText);

    addEvent(stpElems);
}

//stub - needs proper implementation 
function lateEvent(severity = EVENT_SEVERITY.none, mins=5, req='12:00') {
    let colorClass = getColorClass(severity);
    let stpElems = [];

    let entryIcon = logWin.createElement('i');
    entryIcon.setAttribute('class', 'material-icons grey-text left');
    entryIcon.innerText = 'schedule';
    stpElems.push(entryIcon);

    let entryText = logWin.createElement('p');
    entryText.innerHTML = 'XXXX is now <b>' + mins + ' minutes</b> late to pick-up <b>[Khalil D. Requested ' + req +']</b>';
    stpElems.push(entryText);

    addEvent(stpElems, colorClass);
}

//stub - needs proper implementation 
function breakDownEvent() {
    let stpElems = [];

    let entryIcon = logWin.createElement('i');
    entryIcon.setAttribute('class', 'material-icons grey-text left');
    entryIcon.innerText = 'warning_amber';
    stpElems.push(entryIcon);

    let entryText = logWin.createElement('p');
    entryText.innerHTML = 'XXXX is reporting a breakdown @ 17146 Downing Street';
    stpElems.push(entryText);

    addEvent(stpElems, WARNING_COLORS[2].class);
}

//stub - needs proper implementation 
function driverEvent(type=1) {
    let stpElems = [];

    let entryIcon = logWin.createElement('i');
    entryIcon.setAttribute('class', 'material-icons grey-text left');
    if (type == 1)
        entryIcon.innerText = 'content_paste_off';
    else
        entryIcon.innerText = 'pending_actions';
    stpElems.push(entryIcon);

    let entryText = logWin.createElement('p');
    if (type == 1)
        entryText.innerHTML = 'XXXX has rejected a manifest offer';
    else 
        entryText.innerHTML = 'XXXX has not accepted or been assigned a manifest offer';
    stpElems.push(entryText);

    addEvent(stpElems, WARNING_COLORS[0].class);
}

//stub - needs proper implementation
function noShowEvent(req = '12:00') {
    let stpElems = [];

    let entryIcon = logWin.createElement('i');
    entryIcon.setAttribute('class', 'material-icons grey-text left');
    entryIcon.innerText = 'group_remove';
    stpElems.push(entryIcon);

    let entryText = logWin.createElement('p');
    entryText.innerHTML = 'XXXX is reporting a no-show <b>[Khalil D. Requested ' + req +']</b>';
    stpElems.push(entryText);

    addEvent(stpElems, WARNING_COLORS[0].class);
}

function getColorClass(severity) {
    switch (severity) {
        case EVENT_SEVERITY.low:
            return WARNING_COLORS[0].class;
        case EVENT_SEVERITY.med:
            return WARNING_COLORS[1].class;
        case EVENT_SEVERITY.high:
            return WARNING_COLORS[2].class;
        default:
            return WARNING_COLORS[3].class;
    }
}

function popLog() {
    if (!isLogPoped()) {
        logWin = createPopWindow(WINDOW_TYPE.log, 'ERSA - Log');

        document.getElementById('poplog').removeEventListener('click', popLog);
        logWin.body.appendChild(document.getElementById('logpanel'));
        logWin.getElementById('poplog').addEventListener('click', dockLog);
        logWin.getElementById('logpanel').classList.toggle('panelwind');
        logWin.getElementById('logpanel').children[1].classList.toggle('panelcontent');

        logWin.getElementById('poplog').firstChild.innerHTML = 'exit_to_app';
        logWin.getElementById('poplog').removeAttribute('style');
        logWin.getElementById('poplog').setAttribute('data-tooltip', 'Dock');
        document.getElementById('logplaceholder').style.display = 'block';

        let entries = Array.from(logWin.getElementById('logbox').children);
        entries.forEach(entry => {
            entry.classList.replace('logentry', 'logpanelentry');
            if (entry.classList.contains('slide'));
            entry.classList.remove('slide');
        });

        checkMapResize();
    }
}

function dockLog() {
    if (isLogPoped()) {
        logWin.defaultView.removeEventListener('beforeunload', dockLog);
        logWin.getElementById('poplog').removeEventListener('click', dockLog);
        document.getElementById('logplaceholder').before(logWin.getElementById('logpanel'));
        document.getElementById('poplog').addEventListener('click', popLog);
        document.getElementById('logpanel').classList.toggle('panelwind');
        document.getElementById('logpanel').children[1].classList.toggle('panelcontent');

        document.getElementById('poplog').firstChild.innerHTML = 'launch';
        document.getElementById('poplog').setAttribute('style', 'margin-right:10px;');
        document.getElementById('poplog').setAttribute('data-tooltip', 'Pop-out');
        document.getElementById('logplaceholder').style.display = 'none';

        let entries = Array.from(document.getElementById('logbox').children);
        entries.forEach(entry => {
            entry.classList.replace('logpanelentry', 'logentry');
            if (entry.classList.contains('slide'));
            entry.classList.remove('slide');
        });

        logWin = removePopWindow(WINDOW_TYPE.log);
        logBox.scrollTop = logBox.scrollHeight;
        M.Tooltip.init(document.getElementById('poplog'));
        M.Tooltip.init(document.getElementById('clearlog'));
        checkMapResize();
    }
}

function isLogPoped() {
    return logWin != document;
}

export { fileEvent, vehicleEvent, initEvent, lateEvent, breakDownEvent, noShowEvent, driverEvent, isLogPoped, dockLog };