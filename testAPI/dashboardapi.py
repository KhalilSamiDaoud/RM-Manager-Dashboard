from flask_cors import CORS, cross_origin
from flask import Flask, jsonify
from flask_restful import Api
from datetime import datetime, timedelta
import pandas as pd
import pyodbc
import constants

app = Flask(__name__)
cors = CORS(app)
api = Api(app)

# global connection obj used in each sql query
dbConn = pyodbc.connect(constants.DB_CONNECT_CRED)


# default route to check if API is online
@app.route('/api', methods=['GET'])
@cross_origin()
def page():
    response = "<h1>Simulation API</h1><p>This is the Simulation API for ITCurves</p>"
    return jsonify({'response': response})


# get vehicle location, next stop information,
@app.route('/get-avl', methods=['GET'])
@cross_origin()
def get_locations():
    compiled_data = []

    df = pd.read_sql(constants.DB_SMART_DEVICE, dbConn)
    df = df.fillna(0)

    for index, row in df.iterrows():
        if row[df.columns.get_loc('STATE')] == 'DISCONNECTED' or row[df.columns.get_loc('STATE')] == 'OFFLINE' or row[df.columns.get_loc('STATE')] == '':
            continue
        if row[df.columns.get_loc('LATITUDE')] is None:
            continue

        compiled_data.append([
            row[df.columns.get_loc('iVehicleID')],
            float(row[df.columns.get_loc('LATITUDE')]),
            float(row[df.columns.get_loc('LONGITUDE')]),
            row[df.columns.get_loc('STATE')],
            float(row[df.columns.get_loc('DIRECTION')]),
            float(row[df.columns.get_loc('NEXTSERVICELATITUDE')]),
            float(row[df.columns.get_loc('NEXTSERVICELONGITUDE')]),
            row[df.columns.get_loc('AVLZONE')],
            row[df.columns.get_loc('vColor')],
            int(row[df.columns.get_loc('iAffiliateID')]),
            int(row[df.columns.get_loc('vSeating')]),
            row[df.columns.get_loc('TRIPSIRTDO')],
            row[df.columns.get_loc('vVehicleNo')]
        ])

    # add duplicate filter ???
    return jsonify({'response': "Data Compiled", 'avl': compiled_data})


# get all trip data between today's date and tomorrows date.
@app.route('/get-today-trips', methods=['GET'])
@cross_origin()
def get_today_trips():
    compiled_data = []    
    startDate = (datetime.today()).strftime("%m/%d/%y")
    endDate = (datetime.today() + timedelta(days = 1)).strftime("%m/%d/%y")

    # replace query parameters with today's date {{ date_today }}, and tomorrow date {{ date_tomorrow }}
    query = constants.DB_QUERY_TRIPS.replace('{{ date_today }}', str(startDate))
    query = query.replace('{{ date_tomorrow }}', str(endDate))

    df = pd.read_sql(query, dbConn)
    df = df.fillna(0)

    for index, row in df.iterrows():
        compiled_data.append([
            0,
            row[constants.DF_COLS['vehicle']],
            row[constants.DF_COLS['schtime']],
            row[constants.DF_COLS['schdotime']],
            int(row[constants.DF_COLS['passcount']]),
            row[constants.DF_COLS['name']],
            float(row[constants.DF_COLS['PUlat']]),
            float(row[constants.DF_COLS['PUlong']]),
            float(row[constants.DF_COLS['DOlat']]),
            float(row[constants.DF_COLS['DOlong']]),
            row[constants.DF_COLS['PUaddr']],
            row[constants.DF_COLS['DOaddr']],
            float(row[constants.DF_COLS['trvtime']]),
            float(row[constants.DF_COLS['trvdist']]),
            int(row[constants.DF_COLS['confnum']]),
            row[constants.DF_COLS['phonenum']],
            row[constants.DF_COLS['status']]
        ])

    return jsonify({'response': "Trip List Created", 'triplist': compiled_data})


# get trip information for a future date
@app.route('/get-future-trips', methods=['GET'])
@cross_origin()
def get_future_trips(date):
    compiled_data = []

    # replace query parameters target date with today's date {{ date }}
    df = pd.read_sql(constants.FUTURE_DB_QUERY_TRIPS.replace('{{ date }}', date), dbConn)
    df = df.fillna(0)

    for index, row in df.iterrows():
        compiled_data.append([
            0,
            row[constants.DF_FUTURE_COLS['vehicle']],
            row[constants.DF_FUTURE_COLS['nodetype']],
            row[constants.DF_FUTURE_COLS['reqtime']],
            row[constants.DF_FUTURE_COLS['schtime']],
            row[constants.DF_FUTURE_COLS['passcount']],
            row[constants.DF_FUTURE_COLS['name']],
            float(row[constants.DF_FUTURE_COLS['lat']]),
            float(row[constants.DF_FUTURE_COLS['long']]),
            row[constants.DF_FUTURE_COLS['addr']],
            row[constants.DF_FUTURE_COLS['trvtime']],
            row[constants.DF_FUTURE_COLS['trvdist']],
            row[constants.DF_FUTURE_COLS['idletime']],
            row[constants.DF_FUTURE_COLS['confnum']]
        ])

    return jsonify({'response': "Trip List Created", 'triplist': compiled_data})


# get zone information
@app.route('/get-zones', methods=['GET'])
@cross_origin()
def get_zones():
    compiled_data = []

    df = pd.read_sql(constants.DB_ZONES, dbConn)
    df = df.fillna(0)

    for index, row in df.iterrows():
        compiled_data.append([
            row[constants.ZONE_COLS['name']],
            row[constants.ZONE_COLS['lat']],
            row[constants.ZONE_COLS['long']],
            row[constants.ZONE_COLS['ID']],
            row[constants.ZONE_COLS['color']]
        ])

    return jsonify({'response': "Zone List Created", 'zones': compiled_data})


# get any new alerts from the past minute (polled every minute)
@app.route('/get-alerts', methods=['GET'])
@cross_origin()
def get_alerts():
    # create a time window to filter alerts with
    date = datetime.today()
    compiled_data = []

    date = (date - timedelta(minutes=1))
    dtime = date.strftime('%m/%d/%Y %H:%M:%S')

    # replace query parameters target dateTime with calculated dateTime {{ date }}
    df = pd.read_sql(constants.DB_ALERTS.replace('{{ date }}', str(dtime)), dbConn)
    df = df.fillna(0)

    for index, row in df.iterrows():
        # only allow certain alerts through?
        words = row[constants.ALERT_COLS['message']].split(" ")
        first_two = str(words[0]) + " " + str(words[1])

        if first_two == "NO SHOW":
            pass
        elif words[0] == "Emergency":
            pass
        elif words[0] == "Speeding":
            pass
        else:
            continue

        compiled_data.append([
            row[constants.ALERT_COLS['message']],
            row[constants.ALERT_COLS['details']],
            row[constants.ALERT_COLS['datetime']],
            row[constants.ALERT_COLS['affiliateID']]
        ])

    return jsonify({'response': "Alert List Created", 'Alerts': compiled_data})


#define main and add the API endpoints
def __main__():
    api.add_resource(page, '/api')
    api.add_resource(get_locations, '/get-avl')
    api.add_resource(get_today_trips, '/get-today-trips')
    api.add_resource(get_future_trips, '/get-future-trips')
    api.add_resource(get_zones, '/get-zones')
    api.add_resource(get_alerts, '/get-alerts')


if __name__ == "__main__":
    app.run(host='192.168.13.91', port='1222', debug=True, threaded=True)
