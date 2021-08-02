import { dashedLinePath, stopSVG, depotSVG, dropoffSVG, pickupSVG } from './constants.js';
import { isStatsPoped } from './statisticsList.js';
import { isQueuePoped } from './tripQueue.js';
import { vehicles } from './vehicleList.js';
import { isLogPoped } from './log.js';

const dashedLineSymbol = { path: dashedLinePath, strokeOpacity: 1, scale: 3 };

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
        zoom: 12,
        styles: [
            {
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#ebe3cd"
                    }
                ]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#523735"
                    }
                ]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "color": "#f5f1e6"
                    }
                ]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "color": "#c9b2a6"
                    }
                ]
            },
            {
                "featureType": "administrative.land_parcel",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "administrative.land_parcel",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "color": "#dcd2be"
                    }
                ]
            },
            {
                "featureType": "administrative.land_parcel",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#ae9e90"
                    }
                ]
            },
            {
                "featureType": "administrative.neighborhood",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "landscape.natural",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#dfd2ae"
                    }
                ]
            },
            {
                "featureType": "poi",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#dfd2ae"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#93817c"
                    }
                ]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#a5b076"
                    }
                ]
            },
            {
                "featureType": "poi.park",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#447530"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#f5f1e6"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "labels",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "labels.icon",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road.arterial",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#fdfcf8"
                    }
                ]
            },
            {
                "featureType": "road.arterial",
                "elementType": "labels",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#f8c967"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "color": "#e9bc62"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "labels",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road.highway.controlled_access",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#e98d58"
                    }
                ]
            },
            {
                "featureType": "road.highway.controlled_access",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "color": "#db8555"
                    }
                ]
            },
            {
                "featureType": "road.local",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road.local",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#806b63"
                    }
                ]
            },
            {
                "featureType": "transit",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "transit.line",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#dfd2ae"
                    }
                ]
            },
            {
                "featureType": "transit.line",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#8f7d77"
                    }
                ]
            },
            {
                "featureType": "transit.line",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "color": "#ebe3cd"
                    }
                ]
            },
            {
                "featureType": "transit.station",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#dfd2ae"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#b9d3c2"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "labels.text",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#92998d"
                    }
                ]
            }
        ]
    });
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
                    map,
                    collisionBehavior:
                        google.maps.CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL
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
                        map,
                        collisionBehavior:
                            google.maps.CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL
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
        map,
        collisionBehavior:
            google.maps.CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL
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
                    offset: vehicle.offset,
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
                    offset: vehicle.offset
                }],
        });
    }
}

function checkMapResize() {
    if (isQueuePoped())
        document.getElementById('map').classList.add('mapextendleft');
    else
        document.getElementById('map').classList.remove('mapextendleft');

    if (isLogPoped() && isStatsPoped())
        document.getElementById('map').classList.add('mapextendright');
    else {
        document.getElementById('map').classList.remove('mapextendright');
    }
}

export { initMap, checkMapResize, drawTripPath, drawNextIcon, drawNextNIcons, drawStaticIcons, createVehicleIcon, map, mapCenter };