importScripts('vehicle2.js');
importScripts('constants2.js');

let myVehicle;

function handleMessage(job, payload) {
    switch (job) {
        case workerMsg.init:
            myVehicle = new Vehicle(payload[0], payload[1], payload[2], payload[3], payload[4], payload[5]);
            break;
        case workerMsg.updateQueue:
            postMessage([workerPost.updateVeh, myVehicle]);
            break;
        case workerMsg.autoDispatch:
            myVehicle.autoDispatch();
            break;
        case workerMsg.clearIntervals:
            myVehicle.clearIntervals();
            break;
        case workerMsg.clearPath:
            myVehicle.clearPath();
            break;
        case workerMsg.getStopCoordList:
            postMessage([workerPost.fixedStopList, myVehicle.getFixedStopCoordList()]);
        default:
            break;
    }

    postMessage([workerPost.updateVeh, myVehicle]);
}

onmessage = function (e) {
    handleMessage(e.data);
}


