import { fullParse, getMapCenter, trimStreetNames, getClockStartTime } from './parseInput.js';
import { initMode, APIColumns, APIURL, APIFunctions, initEventEntry } from './constants.js';
import { initSimulation, stopSimulation } from './main.js';
import { initEvent } from './log.js';

let tripListObjTrimed;
let startTime;
let newCenter;

async function APIinit(date = '10/1/2021') {
        await fetch(APIURL + APIFunctions.getTrips + date)
            .then(response => response.json())
            .then(data => {
                if(data.triplist.length == 0) {
                    initEvent(initEventEntry.APIempty);
                    return;
                }

                tripListObjTrimed = trimStreetNames(data.triplist, APIColumns);
                startTime         = getClockStartTime(tripListObjTrimed, APIColumns);
                newCenter         = getMapCenter(tripListObjTrimed, APIColumns);

                stopSimulation();
                fullParse(tripListObjTrimed, APIColumns);
                initSimulation(initMode.API, startTime, newCenter); 
            })
            .catch(error => {
                console.error('SIM-API Initialization error: ', error);
            });
}

async function APIupdate() {

}

export { APIinit }