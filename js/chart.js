import { isStatsPoped } from './statisticsList.js';
import { vehicles } from './vehicleList.js';

let materialChart = null;
let options;
let data;

function drawMaterial() {
    let vehicleMax = 0;
    let vehicleInfo = [['Vehicle ID', 'Fixed-stop Passengers', { type: 'string', role: 'style' }, { role: 'annotation' },
        'Micro-transit Passengers', { type: 'string', role: 'style' }, { role: 'annotation' }]];

    vehicles.forEach(vehicle => {
        vehicleInfo.push([vehicle.name, vehicle.FSpassengers, 'color: ' + vehicle.color.hex, (vehicle.FSpassengers > 0) ? 'FS' : '',
        vehicle.MTpassengers, 'color: ' + vehicle.color.hex, (vehicle.MTpassengers > 0) ? 'MT' : '']);

        vehicleMax = (vehicleMax < vehicle.maxCapacity) ? vehicle.maxCapacity : vehicleMax;
    });

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

    if (materialChart == null)
        materialChart = new google.visualization.BarChart(document.getElementById('chart_div'));

    materialChart.draw(data, options);
}

google.charts.setOnLoadCallback(drawMaterial);

export { drawMaterial };