from flask_cors import CORS, cross_origin
from flask import Flask, jsonify, request
from flask_restful import Api
import pandas as pd
import pyodbc
import sys
from datetime import datetime
import requests
import geopy 
from geopy.geocoders import GoogleV3 
import math
import time
import threading
import asyncio

import constants


app = Flask(__name__)
cors = CORS(app)
api = Api(app)

older_data = []



class thread2:
    def __init__(self):
        self.response = ""
    class Avl:
        def __init__(self):
            self.old_data = []
            self.compiled_data = []
            self.response = ""
            self.conn = pyodbc.connect(constants.DB_CONNECT_CRED)
            self.init = 0
            

        def get_locations(self, init):
            self.init = init
            print(self.init)
            self.response = ""
            self.old_data = self.compiled_data
            self.compiled_data = []
            self.df = pd.read_sql(constants.DB_SMART_DEVICE, self.conn)
            self.count = 0
            self.breakOuter = False

            for index, row in self.df.iterrows():
                self.flag = True
                if row[constants.LOC_COLS['state']] == 'DISCONNECTED' or row[constants.LOC_COLS['state']] == 'OFFLINE':
                    continue
                if row[constants.LOC_COLS['latitude']] is None:
                    continue
                for item in self.compiled_data:
                    # print(self.compiled_data)
                    # print(item[1], ":", row[constants.LOC_COLS['vehicle']])
                    if  item[1] == row[constants.LOC_COLS['vehicle']]:
                        # print('got into loop')
                        self.breakOuter = True
                        # print(self.breakOuter)
                        break
                if self.breakOuter:
                    self.breakOuter = False
                    continue

                self.new_item = [
                    # self.count,
                    row[constants.LOC_COLS['vehicle']],
                    float(row[constants.LOC_COLS['latitude']]),
                    float(row[constants.LOC_COLS['longitude']]),
                    row[constants.LOC_COLS['state']],
                    float(row[constants.LOC_COLS['direction']]),
                    float(row[constants.LOC_COLS['stop-lat']]),
                    float(row[constants.LOC_COLS['stop-long']]),
                    row[constants.LOC_COLS['avlzone']],
                    row[constants.LOC_COLS['veh-color']],
                    int(row[constants.LOC_COLS['affiliateID']])

                ]
                self.compiled_data.append(self.new_item)
                self.count += 1
                
            self.response += "Data Compiled"
            return jsonify({'response': self.response, 'avl': self.compiled_data})

            
            self.compiled_data = []


    class Trips:
        def __init__(self):
            
            self.compiled_data = []
            self.response = ""
            self.conn = pyodbc.connect(constants.DB_CONNECT_CRED)

        def format_row(self, row):            
            row[constants.DF_COLS['schtime']] = str(row[constants.DF_COLS['schtime']]).split()[1] \
                if row[constants.DF_COLS['schtime']] \
                else ''
            # row[constants.DF_COLS['reqtime']] = str(row[constants.DF_COLS['reqtime']]).split()[1] \
            #     if row[constants.DF_COLS['reqtime']] \
            #     else ''
            # row[constants.DF_COLS['lat']] = float(row[constants.DF_COLS['lat']]) \
            #     if row[constants.DF_COLS['lat']] \
            #     else ''
            # row[constants.DF_COLS['long']] = float(row[constants.DF_COLS['long']]) \
            #     if row[constants.DF_COLS['long']] \
            #     else ''
            # if row[constants.DF_COLS['nodetype']]:
            #     if row[constants.DF_COLS['nodetype']] == 'P':
            #         row[constants.DF_COLS['nodetype']] += 'U'
            #     if row[constants.DF_COLS['nodetype']] == 'D':
            #         row[constants.DF_COLS['nodetype']] += 'O'

            # if math.isnan(row[constants.DF_COLS['idletime']]):
            #     print(row[constants.DF_COLS['idletime']])
            #     row[constants.DF_COLS['idletime']] = 0

        def get_today_trips(self):
            self.df = pd.read_sql(constants.DB_QUERY_TRIPS, self.conn)
            self.df = self.df.fillna(0)
            
            for index, row in self.df.iterrows():
                self.format_row(row)
                 
                self.new_entry = [
                    row[constants.DF_COLS['vehicle']],
                    # row[constants.DF_COLS['nodetype']],
                    # row[constants.DF_COLS['reqtime']],
                    row[constants.DF_COLS['schtime']],
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
                    # row[constants.DF_COLS['idletime']],
                    int(row[constants.DF_COLS['confnum']]),
                    row[constants.DF_COLS['phonenum']]
                ]
                self.compiled_data.append(self.new_entry)

            
            print(self.compiled_data)
            self.response += "Trip List Created"
            return jsonify({'response': self.response, 'triplist': self.compiled_data})

        def get_future_trips(self, date):
            self.compiled_data = []
            self.df = pd.read_sql(constants.FUTURE_DB_QUERY_TRIPS.replace('{{ date }}', date), self.conn)

            for index, row in self.df.iterrows():
                self.format_row(row)

                self.new_entry = [
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
                ]
                self.compiled_data.append(self.new_entry)

            self.response += "Trip List Created"
            return jsonify({'response': self.response, 'triplist': self.compiled_data})


    class Zones:
        def __init__(self):
            self.compiled_data = []
            self.response = ""
            self.conn = pyodbc.connect(constants.DB_CONNECT_CRED)
    

        def get_zones(self):
            self.df = pd.read_sql(constants.DB_ZONES, self.conn)
            # self.df.to_csv('zones.csv')
            for index, row in self.df.iterrows():
                self.new_entry = [
                    row[constants.ZONE_COLS['name']],
                    row[constants.ZONE_COLS['lat']],
                    row[constants.ZONE_COLS['long']],
                    row[constants.ZONE_COLS['ID']],
                    row[constants.ZONE_COLS['color']]
                ]
                self.compiled_data.append(self.new_entry)
            self.response += "Zone List Created"
            return jsonify({'response': self.response, 'zones': self.compiled_data})

    class Alerts:
        def __init__(self):
            self.compiled_data = []
            self.response = ""
            self.conn = pyodbc.connect(constants.DB_CONNECT_CRED)

        def get_alerts(self, date):
            self.df = pd.read_sql(constants.DB_ALERTS.replace('{{ date }}', date), self.conn)
            for index, row in self.df.iterrows():
                self.new_entry = [
                    row[constants.ALERT_COLS['message']],
                    row[constants.ALERT_COLS['details']],
                    row[constants.ALERT_COLS['datetime']],
                    row[constants.ALERT_COLS['affiliateID']]
                ]
                self.compiled_data.append(self.new_entry)
            self.response += "Alert List Created"
            return jsonify({'response': self.response, 'Alerts': self.compiled_data})

@app.route('/api', methods=['GET'])
@cross_origin()
def page():
    response = "<h1>Simulation API</h1><p>This is the Simulation API for ITCurves</p>"
    return jsonify({'response': response})
thr2 = thread2()
avl = thr2.Avl()
@app.route('/get-avl', methods=['GET'])
@cross_origin()
def get_avl_data():
    init = request.args.get('init')
    print(init)
    return avl.get_locations(init)

trips = thr2.Trips()
@app.route('/get-today-trips', methods=['GET'])
@cross_origin()
def get_trip_data():
    return trips.get_today_trips()

@app.route('/get-future-trips', methods=['GET'])
@cross_origin()
def get_future_trip_data():
    date = request.args.get('date')
    return trips.get_future_trips(date)

zones = thr2.Zones()
@app.route('/get-zones', methods=['GET'])
@cross_origin()
def get_zone_data():
    return zones.get_zones()

alerts = thr2.Alerts()
@app.route('/get-alerts', methods=['GET'])
@cross_origin()
def get_alert_data():
    today = datetime.today()
    todaydate = today.date()
    return alerts.get_alerts(str(todaydate))



t2 = threading.Thread(target=thread2)


def __main__():
    api.add_resource(page, '/api')
    api.add_resource(get_avl_data, '/get-avl')
    api.add_resource(get_trip_data, '/get-today-trips')
    api.add_resource(get_future_trip_data, '/get-future-trips')
    api.add_resource(get_zone_data, '/get-zones')
    api.add_resource(get_alert_data, '/get-alerts')
    t2.start()
    
    

if __name__ == "__main__":
    app.run(host='192.168.8.25', port='1235', debug=True, threaded=True)
