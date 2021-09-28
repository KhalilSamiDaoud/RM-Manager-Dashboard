import { initMode, APIColumns, APIURL, APIFunctions } from './constants.js';
import { fullParse, findCenter, trimStreetNames } from './parseInput.js';
import { initSimulation, stopSimulation } from './main.js';

let tripListObjTrimed;
let newCenter;

async function APIinit() {
        await fetch(APIURL + APIFunctions.getTrips)
            .then(response => response.json())
            .then(data => {
                tripListObjTrimed = trimStreetNames(data.triplist, APIColumns);
                newCenter = findCenter(tripListObjTrimed, APIColumns);

                stopSimulation();
                fullParse(tripListObjTrimed, APIColumns);
                initSimulation(initMode.API, newCenter); 
            });
}

async function APIupdate() {

}

export { APIinit }