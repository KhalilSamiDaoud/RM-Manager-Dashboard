import { fullParse, findCenter, trimStreetNames } from './parseInput.js';
import { initSimulation, stopSimulation } from './main.js';
import { initMode, APIColumns } from './constants.js';

let tripListObjTrimed;
let newCenter;

async function APIinit() {
    await fetch('http://172.20.224.1:1235/get-trips')
        .then(response => response.json())
        .then(data => {
            tripListObjTrimed = trimStreetNames(data.triplist, APIColumns);
            newCenter = findCenter(tripListObjTrimed, APIColumns);

            stopSimulation();
            fullParse(tripListObjTrimed, APIColumns);
            initSimulation(initMode.API, newCenter);
        });
}

export { APIinit }