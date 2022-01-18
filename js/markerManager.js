import { map } from './map.js';

let mapMarkers = [];
let mapPaths = [];

//params: markers<array> | clear<boolean> | callback<function>
function addMapMarkers(params) {
    if(params.clear) clearMapMarkers();

    params.markers.forEach( marker => {
        marker.setMap(map);
    });

    if(typeof params.callback === 'function') params.callback();
}

//params: paths<array> | clear<boolean> | callback<function>
function addMapPaths(params) {
    if (params.clear) clearMapPaths();

    params.paths.forEach(path => {
        path.setMap(map);
    });

    if (typeof params.callback === 'function') params.callback();
}

function clearMapMarkers() {
    mapMarkers.forEach(marker => {
        marker.setMap(null);

        if (marker.infoBox.getMap())
            marker.infoBox.close();
    });

    mapMarkers = [];
}

function clearMapPaths() {
    mapPaths.forEach(path => {
        path.setMap(null);
    });

    mapPaths = [];
}

function clearAllMapMarkers() {
    clearMapMarkers();
    clearMapPaths();
}

function MapHasMarkers() {
    return (mapMarkers.length);
}

function MapHasPaths() {
    return (mapPaths.length);
}

export { addMapMarkers, addMapPaths, clearMapMarkers, clearMapPaths, clearAllMapMarkers, MapHasMarkers, MapHasPaths }