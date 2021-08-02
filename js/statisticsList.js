import { createPopWindow, removePopWindow } from './popWindowList.js';
import { simArea, windowType } from './constants.js';
import { importFile } from './fileInput.js';
import { checkMapResize } from './map.js';
import { drawMaterial } from './chart.js';

document.getElementById('popstats').addEventListener('click', popStats);

var statsWin = document;
let statsTable = statsWin.getElementById('statslist').getElementsByTagName('tbody');
let sumTime, sumPass, sumTrips, sumRevn;

let fareRate = [
    { base: 3.75, mile: 1.50 },
    { base: 5.50, mile: 2.75 },
    { base: 4.00, mile: 1.75 }
];

sumTime = sumPass = sumTrips = sumRevn = 0;

function createStatsList() {
    let newRow;

    newRow = statsTable[0].insertRow(0);
    newRow.insertCell().appendChild(statsWin.createTextNode('Average requested-to-pickup Time:'));
    newRow.insertCell().appendChild(statsWin.createTextNode('. . .'));

    newRow = statsTable[0].insertRow(1);
    newRow.insertCell().appendChild(statsWin.createTextNode('MT Passengers Served:'));
    newRow.insertCell().appendChild(statsWin.createTextNode('. . .'));

    newRow = statsTable[0].insertRow(2);
    newRow.insertCell().appendChild(statsWin.createTextNode('Revenue Generated:'));
    newRow.insertCell().appendChild(statsWin.createTextNode('. . .'));
}

function clearStatsList() {
    let new_tbody = statsWin.createElement('tbody');
    statsWin.getElementById('statslist').replaceChild(new_tbody, statsTable[0]);

    sumTime = sumPass = sumTrips = sumRevn = 0;
    fareRate.Cust = { base: 2, mile: 0.25 };
}

function updateStatsList(index, value) {
    let editRow = statsTable[0].rows[index];
    editRow.cells[1].replaceChild(statsWin.createTextNode(value), editRow.cells[1].firstChild);
}

function calcAll(trip) {
    calcPassengersServed(trip);
    calcAvgWait(trip);
    calcRevenueGenerated(trip);
}

function calcAvgWait(trip) {
    sumTime += trip.waitTime;
    updateStatsList(0, '~' + (Math.round((sumTime / sumTrips) * 100) / 100) + ' min');
}

function calcPassengersServed(trip) {
    sumPass += trip.passengers;
    sumTrips++;
    updateStatsList(1, sumPass);
}

function calcRevenueGenerated(trip) {
    switch (document.title) {
        case simArea.DC:
            sumRevn += fareRate[0].base + (fareRate[0].mile * trip.distance);
            break;
        case simArea.LA:
            sumRevn += fareRate[1].base + (fareRate[1].mile * trip.distance);
            break;
        case simArea.Cust:
            sumRevn += fareRate[2].base + (fareRate[2].mile * trip.distance);
            break;
    }

    updateStatsList(2, '$' + (Math.round(sumRevn * 100) / 100));
}

function getUserFare(evt) {
    let baseFeeInput = document.getElementById("basefee");
    let mileFeeInput = document.getElementById("feepermile");

    baseFeeInput.value = fareRate[2].base;
    mileFeeInput.value = fareRate[2].mile;
    M.updateTextFields();

    const instance = M.Modal.init(document.getElementById('modalfare'), { dismissible: false });
    instance.open();

    var handler = function () {
        fareRate[2].base = (baseFeeInput.value < 0 || baseFeeInput.value == '') ? fareRate[2].base : parseFloat(baseFeeInput.value);
        fareRate[2].mile = (mileFeeInput.value < 0 || mileFeeInput.value == '') ? fareRate[2].mile : parseFloat(mileFeeInput.value);

        document.getElementById("farebutton").removeEventListener("click", handler);
        importFile(evt);
    };

    document.getElementById("farebutton").addEventListener("click", handler);
}

function popStats() {
    if (!isStatsPoped()) {
        statsWin = createPopWindow(windowType.statistics, 'ERSA - Statistics');

        M.Tooltip.getInstance(document.getElementById('popstats')).destroy();

        document.getElementById('popstats').removeEventListener('click', popStats);
        statsWin.body.appendChild(document.getElementById('statspanel'));
        statsWin.getElementById('popstats').addEventListener('click', dockStats);
        statsWin.getElementById('statspanel').classList.toggle('panelwind');
        statsWin.getElementById('statspanel').children[1].classList.toggle('panelcontent');
        statsWin.getElementById('statspanel').children[1].children[0].classList.toggle('statpanelgraph');
        statsWin.getElementById('statspanel').children[1].children[1].classList.toggle('statpaneltable');

        statsWin.getElementById('popstats').firstChild.innerHTML = 'exit_to_app';
        statsWin.getElementById('popstats').removeAttribute('style');
        statsWin.getElementById('popstats').setAttribute('data-tooltip', 'Dock');
        statsWin.getElementById('helpstats').style.display = 'none';
        document.getElementById('statsplaceholder').style.display = 'block';

        checkMapResize();
    }
}

function dockStats() {
    if (isStatsPoped()) {
        statsWin.defaultView.removeEventListener('beforeunload', dockStats);
        statsWin.getElementById('popstats').removeEventListener('click', dockStats);
        document.getElementById('statsplaceholder').before(statsWin.getElementById('statspanel'));
        document.getElementById('popstats').addEventListener('click', popStats);
        document.getElementById('statspanel').classList.toggle('panelwind');
        document.getElementById('statspanel').children[1].classList.toggle('panelcontent');
        document.getElementById('statspanel').children[1].children[0].classList.toggle('statpanelgraph');
        document.getElementById('statspanel').children[1].children[1].classList.toggle('statpaneltable');

        document.getElementById('popstats').firstChild.innerHTML = 'launch';
        document.getElementById('popstats').setAttribute('style', 'margin-right:10px;');
        document.getElementById('popstats').setAttribute('data-tooltip', 'Pop-out');
        document.getElementById('helpstats').style.display = 'block';
        document.getElementById('statsplaceholder').style.display = 'none';

        drawMaterial();
        statsWin = removePopWindow(windowType.statistics);
        M.Tooltip.init(document.getElementById('popstats'));
        M.Tooltip.init(document.getElementById('helpstats'));

        checkMapResize();
    }
}

function isStatsPoped() {
    return statsWin != document;
}

export { createStatsList, clearStatsList, calcAll, isStatsPoped, getUserFare, dockStats };

