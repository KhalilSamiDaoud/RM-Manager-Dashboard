import { dashedLineSymbol, stopSVG, depotSVG, dropoffSVG, pickupSVG } from './constants.js';
import { isStatsPoped } from './statisticsList.js';
import { isQueuePoped } from './tripQueue.js';
import { vehicles } from './vehicleList.js';
import { isLogPoped } from './log.js';

var map;
var mapCenter;

function initMap(area) {
    mapCenter = area;

    map = new google.maps.Map(document.getElementById('map'), {
        center: area,
        navigationControl: false,
        disableDefaultUI: true,
        draggableCursor: 'default',
        scrollwheel: true,
        draggable: true,
        focusable: false,
        zoom: 13,
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

    const centerControlDiv = document.createElement("div");
    CenterControl(centerControlDiv, map);
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(centerControlDiv);
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
    }

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
                    icon: dashedLineSymbol,
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


function CenterControl(controlDiv, map) {
    const controlUI = document.createElement("div");
    controlUI.classList.add('gmap-centerdiv');
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

    controlUI.addEventListener("click", () => {
        map.setCenter(mapCenter);
        map.setZoom(12);
    });
}

export { initMap, checkMapResize, drawTripPath, drawNextIcon, drawNextNIcons, drawStaticIcons, createVehicleIcon, map, mapCenter };