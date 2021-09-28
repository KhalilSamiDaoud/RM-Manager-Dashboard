import * as simConst from './constants.js';

let tripListObjTrimed;
let newCenter;

var vehicles = [];

async function APIinit() {
  await fetch(simConst.APIURL + simConst.APIFunctions.getTrips)
    .then(response => response.json())
    .then(data => {
      tripListObjTrimed = trimStreetNames(data.triplist, simConst.APIColumns);
      newCenter = findCenter(tripListObjTrimed, simConst.APIColumns);
      getVehiclesFromJSON(tripListObjTrimed, simConst.APIColumns);
      getQueueFromJSON(tripListObjTrimed, simConst.APIColumns);
      getClockTimes(tripListObjTrimed, simConst.APIColumns);
      initMap();

      vehicles.forEach(vehicle => {
        vehicle.updateQueue();
        createVehicleIcon(vehicle);
        vehicle.autoDispatch();
      });
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

function drawTripPath(vehicle) {
    vehicle.path = new google.maps.Polyline({
      path: [vehicle.queue[vehicle.pos].PUcoords, vehicle.queue[vehicle.pos].DOcoords],
      geodesic: true,
      zIndex: 3,
      strokeOpacity: 0,
      icons: [
        {
          //PH
        },
        {
          icon: vehicle.symbol,
          offset: vehicle.mapOffset + '%'
        }],
    });
}

function getClockTimes(records, fileColumns) {
  let startTime = Number.MAX_VALUE;

  records.forEach(record => {
    if (record[fileColumns.scheduleTimeIndex] != undefined) {
      let requestTime = parseTime(record[fileColumns.scheduleTimeIndex]);
      startTime = (requestTime < startTime) ? requestTime : startTime;
    }
  });

  initClock(Math.floor(startTime));
}

function createVehicle(VehID, VehCap, startTime) {
  let veh = new Vehicle(VehID, startTime);
  vehicles.push(veh);
}

function clearVehicles() {
  vehicles.forEach(vehicle => {
    vehicle.clearIntervals();
  });
  vehicles = [];
}

function trimStreetNames(tripListObj, fileColumns) {
  tripListObj.forEach(record => {
    if (record[fileColumns.adrIndex] != null && record[fileColumns.adrIndex] != undefined && record[fileColumns.adrIndex].includes(','))
      record[fileColumns.adrIndex] = record[fileColumns.adrIndex].substr(0, record[fileColumns.adrIndex].indexOf(','));
  });

  return tripListObj;
}

function parseTime(timeString, mode = 1) {
  let UDTfix = (timeString.length > 11) ? 300 : 0;
  let hms, minutes;

  if (UDTfix) {
    hms = timeString.substring(timeString.indexOf('T') + 1, timeString.indexOf('T') + 9).split(':');
    hms[0] = (+hms[0] - 5 < 0) ? (24 + (+hms[0] - 5)) : +hms[0] - 5;
  }
  else
    hms = timeString.substring(0, 11).split(/:| /);

  switch (mode) {
    case 0:
      return hms;
    case 1:
    case 2:
      minutes = (+hms[0]) * 60 + (+hms[1]) + (+hms[2] / 60);
      minutes = (minutes < 0 || hms[hms.length - 1] == 'PM') ? 1440 + minutes : minutes;

      if (mode == 1)
        return minutes;
      else
        return [minutes, [+hms[0], +hms[1], +hms[2]]];
    default:
      throw new Error('invalid mode (' + mode + ')');
  }
}

function findCenter(records, fileColumns) {
  if (records[0][fileColumns.typeIndex] == 'StartDepot')
    return { lat: records[0][fileColumns.latIndex], lng: records[0][fileColumns.longIndex] };
  else if (records[records.length - 1][fileColumns.typeIndex] == 'EndDepot')
    return { lat: records[records.length - 1][fileColumns.latIndex], lng: records[records.length - 1][fileColumns.longIndex] };
  else
    return { lat: records[0][fileColumns.latIndex], lng: records[0][fileColumns.longIndex] };
}

function getTripType(record, fileColumns) {
  switch (record[fileColumns.typeIndex]) {
    case 'PU':
      return simConst.tripType.pickup;
    case 'DO':
      return simConst.tripType.dropoff;
    case 'StartDepot':
    case 'EndDepot':
      return simConst.tripType.depot;
    default:
      return simConst.tripType.unknown;
  }
}

var map;

let coordsList = [
  { lat: 39.051242, lng: -77.0402315 },
  { lat: 39.0974287, lng: -77.114166 },
];

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 39.051242, lng: -77.0402315 },
    navigationControl: false,
    disableDefaultUI: true,
    draggableCursor: "default",
    scrollwheel: true,
    draggable: true,
    focusable: false,
    zoom: 12,
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

  const chipDiv = document.createElement("div");
  chipControl(chipDiv, map);
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(chipDiv);

  new MarkerWithLabel({
    position: coordsList[0],
    clickable: false,
    draggable: false,
    icon: {
      url:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(simConst.pickupSVG.replace("{{ color }}", "#ff5722")),
      scaledSize: new google.maps.Size(35, 35),
      anchor: new google.maps.Point(20, 20),
    },
    map: map,
    labelContent: "Khalil Daoud's Pick-up: 12:35 PM", // can also be HTMLElement
    labelAnchor: new google.maps.Point(-130, 15),
    labelClass: "test-pick", // the CSS class for the label
    labelStyle: { opacity: 1.0 },
    zIndex: 0
  });

  new MarkerWithLabel({
    position: coordsList[1],
    clickable: false,
    draggable: false,
    icon: {
      url:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(simConst.dropoffSVG.replace("{{ color }}", "#ff5722")),
      scaledSize: new google.maps.Size(35, 35),
      anchor: new google.maps.Point(20, 20),
    },
    map: map,
    labelContent: "Khalil Daoud's Drop-off: 1:15 PM", // can also be HTMLElement
    labelAnchor: new google.maps.Point(-130, 15),
    labelClass: "test-drop", // the CSS class for the label
    labelStyle: { opacity: 1.0 },
    zIndex: 0
  });
}

function chipControl(controlDiv, map) {
  const controlUI = document.createElement("div");
  controlUI.title = "hello, world!";

  controlDiv.appendChild(controlUI);

  const controlText = document.createElement("div");
  controlText.style.margin = "50px";
  controlText.style.marginRight = "140px";
  controlText.innerHTML =
    '<div class="chip white" style="position: absolute;"><i class="material-icons deep-orange-text" style="line-height:14px;">emoji_people</i>=  You</div>';
  controlUI.appendChild(controlText);
}

function createIcon(icon, coords) {
  new google.maps.Marker({
    position: coords,
    icon: {
      url:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(icon.replace("{{ color }}", "#03a9f4")),
      scaledSize: new google.maps.Size(35, 35),
      anchor: new google.maps.Point(20, 20),
    },
    map,
  });
}

function getIsMobile() {
  isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;
}

function main() {
  APIinit();

  $("select").formSelect();
  //manually implement a slide animation for tab switching bcause materialize is kinda lame 
  $("#tabs").tabs();
  $(".modal").modal();
  $(".preloader").fadeOut("slow");
}

main();

class Vehicle {
  constructor(name = 'N/A', startTime = 0, queue = []) {
    this.name = name;
    this.startTime = startTime;
    this.color = { hex: '#424242', class: 'grey-text text-darken-3' };
    this.queue = queue;

    this.status = simConst.vehStatus.starting;
    this.idling = false;
    this.pos = 0;
    this.mapOffset = 0;
    this.idleOffset = 0;

    this.mapInterval = undefined;
    this.dispatcher = undefined;

    this.path;
  }

  updateStatus() {
    if (this.queue.length == 0)
      this.status = simConst.vehStatus.depot;
    else
      this.status = simConst.vehStatus.route;
  }

  updateQueue(newQueue = this.queue) {
    this.queue = newQueue;

    if (this.queue.length == 0) {
      this.clearIntervals;
      this.updateStatus;
    }
  }

  clearPath() {
    if (typeof this.path !== 'undefined')
      this.path.setMap(null);
  }

  async animate() {
    drawTripPath(this);
    this.path.setMap(map);

    let count = (this.mapOffset * this.queue[this.pos].speed) * simSpeedFactor;
    let icons = this.path.get("icons");

    this.mapInterval = window.setInterval(() => {
      if (!this.idling) {
        count = ++count;
        this.mapOffset = count / (this.queue[this.pos].speed * simSpeedFactor);
        icons[1].offset = (this.mapOffset > 99) ? '100%' : this.mapOffset + '%';
        this.path.set("icons", icons);

        if (this.mapOffset > 99) {
          this.mapInterval = window.clearInterval(this.mapInterval);

          if (this.queue[this.pos].idleTime != 0) {
            setCurrTripIdle(this);
            this.idling = true;
          }
        }
      }
      else {
        this.mapInterval = window.clearInterval(this.mapInterval);
      }
      if (typeof this.mapInterval === 'undefined') {
        count = (this.idling) ? (this.idleOffset * this.queue[this.pos].idleTime) * simSpeedFactor : 100;

        this.mapInterval = setInterval(() => {
          if (this.idleOffset < 100) {
            count = ++count;
            this.idleOffset = count / (this.queue[this.pos].idleTime * simSpeedFactor);
          }
          else {
            this.mapInterval = window.clearInterval(this.mapInterval);
            this.progInterval = window.clearInterval(this.progInterval);
            this.idling = false;
            this.mapOffset = 0;
            this.idleOffset = 0;
            this.clearPath();

            if (this.pos == (this.queue.length - 1) && this.stops.length != 0) {
              this.updateQueue([]);
              this.pos = 0;

              this.animate();
            }
            else if (this.pos == (this.queue.length - 1) && this.stops.length == 0) {
              this.updateQueue([]);
              this.progInterval = window.clearInterval(this.progInterval);
            }
            else {
              ++this.pos;
              this.animate();
            }
          }
        }, 10);
      }
    }, 10);
  }

  autoDispatch() {
    if (typeof this.dispatcher === 'undefined') {
      this.dispatcher = window.setInterval(() => {
        if (this.queue.length != 0 && this.startTime <= (clockCurrTime + 1) && this.status == simConst.vehStatus.starting) {
          this.dispatcher = window.clearInterval(this.dispatcher);
          this.updateStatus();
          this.animate();
        }
      }, (1000 * simSpeedFactor));
    }
  }

  forceDispatch() {
    if (this.status == simConst.vehStatus.route || this.status == simConst.vehStatus.loop) {
      this.animate();
    }
  }

  stopDispatch() {
    this.dispatcher = window.clearInterval(this.dispatcher);
  }

  clearIntervals() {
    this.mapInterval = window.clearInterval(this.mapInterval);
    this.dispatcher = window.clearInterval(this.dispatcher);
  }

  hasFinished() {
    return this.status == simConst.vehStatus.depot || this.status == simConst.vehStatus.loop;
  }
}

function getVehiclesFromJSON(records, fileColumns) {
  let uniqueVeh = [];
  clearVehicles();

  records.forEach(record => {
    if (!uniqueVeh.includes(record[fileColumns.vehNumIndex]) && record[fileColumns.vehNumIndex] != undefined) {
      let count = 0;

      for (var i = records.indexOf(record); i < records.length; i++) {
        if (records[i][fileColumns.vehNumIndex] == record[fileColumns.vehNumIndex]) {
          count++;
        }
        else { break; }
      }
      uniqueVeh.push(record[fileColumns.vehNumIndex]);
      createVehicle(record[fileColumns.vehNumIndex], parseTime(record[fileColumns.scheduleTimeIndex]));
    }
  });
}

function getQueueFromJSON(records, fileColumns) {
  vehicles.forEach(vehicle => {
    let vehFound = false;
    let lastStop;

    for (var i = 0; i < records.length - 1; i++) {
      let next = i + 1;

      if (records[i][fileColumns.vehNumIndex] == vehicle.name && records[next][fileColumns.vehNumIndex] == vehicle.name) {
        vehFound = true;

        if (records[next][fileColumns.typeIndex] == 'IdleTime') {
          vehicle.queue[vehicle.queue.length - 1].idleTime = records[next][fileColumns.estTimeIndex];
          next++;
        }

        if (records[i][fileColumns.typeIndex] == 'IdleTime')
          continue;
        else if (records[next][fileColumns.splTrpIndex] == 1) {
          if (records[next][fileColumns.nameIndex] != lastStop) {
            lastStop = records[next][fileColumns.nameIndex];

            vehicle.queue.push(new Trip(records[next][fileColumns.nameIndex], tripType.fixedstop, { lat: records[i][fileColumns.latIndex], lng: records[i][fileColumns.longIndex] },
              { lat: records[next][fileColumns.latIndex], lng: records[next][fileColumns.longIndex] }, records[i][fileColumns.adrIndex], records[next][fileColumns.adrIndex],
              records[next][fileColumns.estTimeIndex], 0, 0, records[next][fileColumns.passengerIndex], records[next][fileColumns.estDistanceIndex]));
          }
          else {
            lastStop = undefined;
            continue;
          }
        }
        else {
          let tName = (getTripType(records[next], fileColumns) == simConst.tripType.depot) ? 'End Depot' : records[next][fileColumns.nameIndex];

          vehicle.queue.push(new Trip(tName, getTripType(records[next], fileColumns), { lat: records[i][fileColumns.latIndex], lng: records[i][fileColumns.longIndex] },
            { lat: records[next][fileColumns.latIndex], lng: records[next][fileColumns.longIndex] }, records[i][fileColumns.adrIndex], records[next][fileColumns.adrIndex],
            records[next][fileColumns.estTimeIndex], 0, 0, records[next][fileColumns.passengerIndex], records[next][fileColumns.estDistanceIndex]));
        }
      }
      else if (records[next][fileColumns.vehNumIndex] != vehicle.name && vehFound)
        break;
    }
  });
}

class Trip {
  constructor(name = 'N/A', type = simConst.tripType.unknown, PUcoords = { lat: 0.0, lng: 0.0 }, DOcoords = { lat: 0.0, lng: 0.0 },
    PUadr = 'N/A', DOadr = 'N/A', speed = 0, idleTime = 0, waitTime = 0, passengers = 0, distance = 0) {

    this.name = name;
    this.type = type;
    this.PUcoords = PUcoords;
    this.DOcoords = DOcoords;
    this.PUadr = PUadr;
    this.DOadr = DOadr;
    this.speed = speed;
    this.idleTime = idleTime;
    this.waitTime = waitTime;
    this.passengers = passengers;
    this.distance = distance;
  }
}

var clockStartTime, clockCurrTime;
var simSpeedFactor = 1; // 1 second = 1 minute  @ factor = 1
let clockInterval;

clockStartTime = clockCurrTime = 0;

function initClock(startTime = 0) {
  clockCurrTime = clockStartTime = startTime;
}

function startClock() {
  clockInterval = window.setInterval(() => {
    tickClock();
    console.lof(clockCurrTime);
  }, (1000 * simSpeedFactor));
}

function tickClock() {
  if (clockCurrTime == 1440)
    clockCurrTime = 1;
  else
    ++clockCurrTime;
}
