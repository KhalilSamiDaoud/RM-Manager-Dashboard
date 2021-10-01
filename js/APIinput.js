import { fullParse, getMapCenter, trimStreetNames, getClockStartTime } from './parseInput.js';
import { initMode, APIColumns, APIURL, APIFunctions } from './constants.js';
import { initSimulation, stopSimulation } from './main.js';

let tripListObjTrimed;
let startTime;
let newCenter;

async function APIinit(date = '10/1/2021') {
        await fetch(APIURL + APIFunctions.getTrips + date)
            .then(response => response.json())
            .then(data => {
                console.log(data.triplist);
                tripListObjTrimed = trimStreetNames(data.triplist, APIColumns);
                startTime         = getClockStartTime(tripListObjTrimed, APIColumns);
                newCenter         = getMapCenter(tripListObjTrimed, APIColumns);

                stopSimulation();
                fullParse(tripListObjTrimed, APIColumns);
                initSimulation(initMode.API, startTime, newCenter); 
            });
}

async function APIupdate() {

}

export { APIinit }