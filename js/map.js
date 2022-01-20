import { ARROW_LINE_SYMBOL, stopSVG, depotSVG, dropoffSVG, pickupSVG } from './constants.js';
import { globalConfigVars } from './configuration.js';
import { isStatsPoped } from './statisticsList.js';
import { initZoneSelect } from './zoneList.js';
import { isQueuePoped } from './tripQueue.js';
import { vehicles } from './vehicleList.js';
import { isLogPoped } from './log.js';

var map, mapZoom, mapCenter;

let trafficLayer;
let allowZoomModification = false;

function initMap(area) {
    mapCenter = area;
    mapZoom = globalConfigVars.enviorment.mapZoom;

    map = new google.maps.Map(document.getElementById('map'), {
        center: area,
        navigationControl: false,
        disableDefaultUI: true,
        draggableCursor: 'default',
        scrollwheel: true,
        draggable: true,
        focusable: false,
        zoom: mapZoom,
        styles: [
            {
                "featureType": "all",
                "elementType": "all",
                "stylers": [
                    {
                        "hue": "#e7ecf0"
                    }
                ]
            },
            {
                "featureType": "landscape",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "saturation": "-66"
                    }
                ]
            },
            {
                "featureType": "landscape",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "saturation": "-53"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "all",
                "stylers": [
                    {
                        "visibility": "simplified"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text",
                "stylers": [
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi.attraction",
                "elementType": "all",
                "stylers": [
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "poi.business",
                "elementType": "all",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi.medical",
                "elementType": "geometry",
                "stylers": [
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "poi.medical",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "poi.medical",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "poi.medical",
                "elementType": "labels",
                "stylers": [
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "poi.medical",
                "elementType": "labels.text",
                "stylers": [
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "poi.medical",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "poi.medical",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "poi.medical",
                "elementType": "labels.icon",
                "stylers": [
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "poi.park",
                "elementType": "all",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "all",
                "stylers": [
                    {
                        "saturation": -70
                    }
                ]
            },
            {
                "featureType": "transit",
                "elementType": "all",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "all",
                "stylers": [
                    {
                        "visibility": "simplified"
                    },
                    {
                        "saturation": -60
                    }
                ]
            }
        ]
    });

    trafficLayer = new google.maps.TrafficLayer();

    const centerControlDiv = document.createElement('div');
    centerControl(centerControlDiv);
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(centerControlDiv);

    const trafficControlDiv = document.createElement('div');
    trafficControl(trafficControlDiv);
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(trafficControlDiv);

    const zoomLockControlDiv = document.createElement('div');
    zoomControl(zoomLockControlDiv);
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(zoomLockControlDiv);

    const zoneControlDiv = document.createElement('div');
    zoneControl(zoneControlDiv);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(zoneControlDiv);

    //custom event to determine when gmap controls have loaded
    google.maps.event.addListener(map, 'tilesloaded', checkMapLoaded);
}

function checkMapLoaded() {
    let controlInterval = setInterval(() => {
        if ($('.gmap-zone-control').length > 0) {
            google.maps.event.clearListeners(map, 'tilesloaded');
            $('.tooltipped').tooltip();
            initZoneSelect();
            clearInterval(controlInterval);
        }
    }, 250);
}

function resetMapCenter() {
    map.setCenter(mapCenter);
    setMapZoom(mapZoom);
}

function setMapZoom(zoomLevel) {
    if (allowZoomModification)
        map.setZoom(zoomLevel);
}

function createVehicleIcon(vehicle) {
    let busSymbol = {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        strokeColor: vehicle.color.hex,
        fillColor: vehicle.color.hex,
        scale: 3.5,
        strokeWeight: 8,
        strokeOpacity: 1,
        anchor: new google.maps.Point(0, 0)
    };

    vehicle.symbol = busSymbol;
}

function drawStaticIcons() {
    vehicles.forEach(vehicle => {
        let stops = vehicle.getFixedStopCoordList();

        const busPath = new google.maps.Polyline({
            path: stops,
            geodesic: true,
            scale: 1,
            strokeColor: vehicle.color.hex,
            strokeWeight: 2,
        });
        busPath.setMap(map);

        if (stops.length != 0)
            stops.forEach(stop => {
                new google.maps.Marker({
                    position: stop,
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(stopSVG),
                        scaledSize: new google.maps.Size(25, 25),
                        anchor: new google.maps.Point(8, 25)
                    },
                    map
                });
            });

        if (vehicle.queue.length != 0)
            for (var i = 0; i < vehicle.queue.length; i++) {
                if (vehicle.tripIsDepot(i)) {
                    new google.maps.Marker({
                        position: vehicle.queue[i].DOcoords,
                        icon: {
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(depotSVG),
                            scaledSize: new google.maps.Size(50, 50)
                        },
                        map
                    });
                    break;
                }
            }
    });
}

function createIcon(vehicle, index, icon) {
    return new google.maps.Marker({
        position: vehicle.queue[index].DOcoords,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(icon.replace('{{ color }}', vehicle.color.hex)),
            scaledSize: new google.maps.Size(35, 35),
        },
        map
    });
}

function drawNextNIcons(vehicle, n) {
    let marker;
    let index = vehicle.pos;

    while (vehicle.markers.length < n) {
        if (index >= vehicle.queue.length)
            break;
        if (vehicle.tripIsPickup(index)) {
            marker = createIcon(vehicle, index, pickupSVG);
            marker.setMap(map);
            vehicle.drawnTo = index;
            vehicle.markers.push(marker);
        }
        else if (vehicle.tripIsDropoff(index)) {
            marker = createIcon(vehicle, index, dropoffSVG);
            marker.setMap(map);
            vehicle.drawnTo = index;
            vehicle.markers.push(marker);
        }
        index++;
    }
}

function drawNextIcon(vehicle, n) {
    if (!vehicle.tripIsFixedStop(vehicle.pos)) {
        let marker;
        let index = (vehicle.drawnTo + 1);

        removeCurrIcon(vehicle);

        while (vehicle.markers.length < n) {
            if (index >= vehicle.queue.length)
                break;
            if (vehicle.tripIsPickup(index)) {
                marker = createIcon(vehicle, index, pickupSVG);
                marker.setMap(map);
                vehicle.drawnTo = index;
                vehicle.markers.push(marker);
            }
            else if (vehicle.tripIsDropoff(index)) {
                marker = createIcon(vehicle, index, dropoffSVG);
                marker.setMap(map);
                vehicle.drawnTo = index;
                vehicle.markers.push(marker);
            }
            index++;
        }
    }
}

function removeCurrIcon(vehicle) {
    if (vehicle.markers.length != 0) {
        vehicle.markers[0].setMap(null);
        vehicle.markers.shift();
    }
}

function drawTripPath(vehicle) {
    if (vehicle.stops.includes(vehicle.queue[vehicle.pos])) {
        vehicle.path = new google.maps.Polyline({
            path: [vehicle.queue[vehicle.pos].PUcoords, vehicle.queue[vehicle.pos].DOcoords],
            geodesic: true,
            zIndex: 3,
            strokeColor: '#4285F4',
            strokeOpacity: 1.0,
            strokeWeight: 3,
            icons: [
                {
                    //indexholder
                },
                {
                    icon: vehicle.symbol,
                    offset: vehicle.mapOffset + '%'
                },
            ]
        });
    }
    else {
        vehicle.path = new google.maps.Polyline({
            path: [vehicle.queue[vehicle.pos].PUcoords, vehicle.queue[vehicle.pos].DOcoords],
            geodesic: true,
            zIndex: 3,
            strokeOpacity: 0,
            icons: [
                {
                    icon: ARROW_LINE_SYMBOL,
                    offset: '0%',
                    repeat: '20px'
                },
                {
                    icon: vehicle.symbol,
                    offset: vehicle.mapOffset + '%'
                }],
        });
    }
}

function checkMapResize() {
    let mapDiv = document.getElementById('map');

    if (isQueuePoped())
        mapDiv.classList.add('mapextendleft');
    else
        mapDiv.classList.remove('mapextendleft');

    if (isLogPoped() && isStatsPoped())
        mapDiv.classList.add('mapextendright');
    else
        mapDiv.classList.remove('mapextendright');

    if(isQueuePoped() && isLogPoped() && isStatsPoped()) {
        mapDiv.classList.add('mapextendfull');
        document.getElementById('centerbtn').classList.add('gmap-centerdiv-noradius');
        document.getElementById('clockbar').classList.add('clock-bar-full');
    }
    else {
        mapDiv.classList.remove('mapextendfull');
        document.getElementById('centerbtn').classList.remove('gmap-centerdiv-noradius');
        document.getElementById('clockbar').classList.remove('clock-bar-full');
    }
}


function centerControl(controlDiv) {
    const controlUI = document.createElement("div");
    controlUI.classList.add('gmap-centerdiv-corner');
    controlUI.classList.add('tooltipped');
    controlUI.title = "Click to recenter the map";

    controlUI.setAttribute('id', 'centerbtn');
    controlUI.setAttribute('data-position', 'bottom');
    controlUI.setAttribute('data-tooltip', 'Center map');
    controlDiv.appendChild(controlUI);

    const controlText = document.createElement("div");
    controlUI.classList.add('gmap-centericon');
    controlText.innerHTML = '<i class="material-icons white-text" style="font-size:42px;">filter_center_focus</i>';
    controlUI.appendChild(controlText);

    controlUI.addEventListener("click", resetMapCenter);
}

function trafficControl(controlDiv) {
    const controlUI = document.createElement("div");
    controlUI.classList.add('gmap-centerdiv');
    controlUI.classList.add('tooltipped');
    controlUI.title = "Toogle Traffic Layer";

    controlUI.setAttribute('id', 'trafficbtn');
    controlUI.setAttribute('data-position', 'bottom');
    controlUI.setAttribute('data-tooltip', 'Toggle traffic layer');
    controlDiv.appendChild(controlUI);

    const controlText = document.createElement("div");
    controlUI.classList.add('gmap-centericon');
    controlText.innerHTML = '<i class="material-icons white-text" style="font-size:42px;">traffic</i>';
    controlUI.appendChild(controlText);

    controlUI.addEventListener("click", () => {
        if(trafficLayer.getMap())
            trafficLayer.setMap(null);
        else
            trafficLayer.setMap(map);
    });
}

function zoomControl(controlDiv) {
    const controlUI = document.createElement("div");
    controlUI.classList.add('gmap-centerdiv');
    controlUI.classList.add('tooltipped');
    controlUI.title = 'Toogle Automatic Zoom';

    controlUI.setAttribute('id', 'zoombtn');
    controlUI.setAttribute('data-position', 'bottom');
    controlUI.setAttribute('data-tooltip', 'Toogle Automatic Zoom');
    controlDiv.appendChild(controlUI);

    const controlText = document.createElement("div");
    controlUI.classList.add('gmap-centericon', 'border-off');
    controlText.innerHTML = '<i class="material-icons white-text" style="font-size:40px;">lock_outline</i>';
    controlUI.appendChild(controlText);

    controlUI.addEventListener("click", () => {
        if (!allowZoomModification) {
            allowZoomModification = true;
            controlUI.classList.toggle('border-off');
            controlUI.classList.toggle('border-on');
            controlText.innerHTML = '<i class="material-icons white-text" style="font-size:40px;">zoom_in</i>';
        }
        else {
            allowZoomModification = false;
            controlUI.classList.toggle('border-off');
            controlUI.classList.toggle('border-on');
            controlText.innerHTML = '<i class="material-icons white-text" style="font-size:40px;">lock_outline</i>';
        }
    });
}

function zoneControl(controlDiv) {
    const controlUI = document.createElement('div');
    controlUI.classList.add('gmap-zone-control');

    const selectDiv = document.createElement('div');
    selectDiv.classList.add('input-field');
    selectDiv.setAttribute('id', 'zone_picker');

    const selectElem = document.createElement('select');
    selectElem.setAttribute('id', 'zone_select');
    selectElem.setAttribute('multiple', '');

    const defaultOption = document.createElement('option');
    defaultOption.classList.add('zone-control');
    defaultOption.setAttribute('value', '0');
    defaultOption.setAttribute('selected', '');
    defaultOption.innerText = 'SHOW ALL ZONES';

    const selectLabel = document.createElement('p');
    selectLabel.classList.add('white-text', 'gmap-zone-label');
    selectLabel.innerText = 'Show vehicles by zone:';

    controlUI.appendChild(selectLabel);
    selectDiv.appendChild(selectElem);
    selectElem.appendChild(defaultOption);
    controlUI.appendChild(selectElem);
    controlDiv.appendChild(controlUI);
}

export { initMap, checkMapResize, drawTripPath, drawNextIcon, drawNextNIcons, drawStaticIcons, 
    createVehicleIcon, resetMapCenter, setMapZoom, map, mapCenter, allowZoomModification };