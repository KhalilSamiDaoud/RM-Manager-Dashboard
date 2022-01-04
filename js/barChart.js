import { isStatsPoped, statsWin } from './statisticsList.js';
import { vehicles, liveVehicles} from './vehicleList.js';
import { INIT_MODE } from './constants.js';
import { currMode } from './main.js';

window.drawMaterial = drawMaterial;
window.onresize = drawMaterial;

let barChart = null;
let options;
let data;

function drawMaterial() {
    let vehicleMax = 0;
    let vehicleInfo;

    if(currMode == INIT_MODE.live) {
        vehicleInfo = [['Vehicle ID', 'Passengers', { type: 'string', role: 'style' }, { role: 'annotation' }]];

        [...liveVehicles.values()].every(vehicle => {
            if (!vehicle.assignedTrips.size) return true;

            vehicleInfo.push([vehicle.name, vehicle.currCapacity, 'color: ' + vehicle.color, vehicle.type.name]);
            
            vehicleMax = (vehicleMax < vehicle.maxCapacity) ? vehicle.maxCapacity : vehicleMax;
        });
    }
    else {
        vehicleInfo = [['Vehicle ID', 'Fixed-stop Passengers', { type: 'string', role: 'style' }, { role: 'annotation' },
            'Micro-transit Passengers', { type: 'string', role: 'style' }, { role: 'annotation' }]];

        vehicles.forEach(vehicle => {
            vehicleInfo.push([vehicle.name, vehicle.FSpassengers, 'color: ' + vehicle.color.hex, (vehicle.FSpassengers > 0) ? 'FS' : '',
            vehicle.MTpassengers, 'color: ' + vehicle.color.hex, (vehicle.MTpassengers > 0) ? 'MT' : '']);

            vehicleMax = (vehicleMax < vehicle.maxCapacity) ? vehicle.maxCapacity : vehicleMax;
        });
    }

    data = google.visualization.arrayToDataTable(vehicleInfo);

    options = {
        chartArea: {
            height: '100%',
            width: '100%',
            top: (isStatsPoped()) ? 25 : 20,
            left: 45,
            right: 8,
            bottom: (isStatsPoped()) ? 20 : 15
        },
        titleTextStyle: {
            color: 'grey',
            bold: false,
            fontSize: (isStatsPoped()) ? 20 : 15
        },
        hAxis: {
            viewWindowMode: 'explicit',
            viewWindow: {
                max: vehicleMax,
                min: 0
            }
        },
        height: '100%',
        width: '100%',
        title: "Passenger Load per Vehicle",
        bar: { groupWidth: "85%" },
        legend: { position: "none" },
        isStacked: true
    };

    if (barChart == null)
        barChart = new google.visualization.BarChart(statsWin.getElementById('chart_div'));

    barChart.draw(data, options);
}

google.charts.setOnLoadCallback(drawMaterial);

export { drawMaterial };