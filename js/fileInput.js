import { fullParse, findColIndex, findCenter, trimStreetNames } from './parseInput.js';
import { initSimulation, stopSimulation } from './main.js';
import { getUserFare } from './statisticsList.js';
import { initMode } from './constants.js';
import { fileEvent } from './log.js';

const fileButton = document.getElementById("filebutton");
const filePicker = document.getElementById("filePicker");
filePicker.addEventListener('change', getUserFare);

let firstSheet;
let tripListObjTrimed;
let fileColumns;
let newCenter;

fileButton.addEventListener("click", function (e) {
    if (filePicker) {
        filePicker.click();
    }
}, false);

function importFile(evt) {
    let f = evt.target.files[0];

    if (f) {
        let r = new FileReader();
        r.onload = e => {
            let contents = JSON.parse(processExcel(e.target.result));
            fileColumns = findColIndex(contents[firstSheet]);
            tripListObjTrimed = trimStreetNames(contents[firstSheet].slice(1), fileColumns);
            newCenter = findCenter(tripListObjTrimed, fileColumns);
            //!event
            fileEvent(filePicker.value.split(/(\\|\/)/g).pop());
            filePicker.value = '';

            stopSimulation();
            fullParse(tripListObjTrimed, fileColumns);
            initSimulation(initMode.file, newCenter);
        }
        r.readAsBinaryString(f);
    }
    else {
        console.log("Failed to load file");
    }
}

function processExcel(data) {
    let workbook = XLSX.read(data, { type: 'binary', cellText: false, cellDates: true });

    firstSheet = workbook.SheetNames[0];
    data = to_json(workbook);
    return data
};

function to_json(workbook) {
    let result = {};
    workbook.SheetNames.forEach(function (sheetName) {
        let roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1});
        if (roa.length)
            result[sheetName] = roa;
    });
    return JSON.stringify(result, 2, 2);
}

export { fileButton, importFile };

