from flask import Flask, request, jsonify, session
from flask_cors import CORS, cross_origin
from flask_restful import Resource, Api, reqparse
import pandas as pd



app = Flask(__name__)
cors = CORS(app)
api = Api(app)

app.config['CORS_HEADERS'] = 'Content-Type'

global df


@app.route('/api', methods=['GET'])
@cross_origin()
def page():
    Response = "<h1>Simulation API</h1><p>This is the Simulation API for ITCurves</p>"
    return jsonify({'response': Response})


@app.route('/get-trips', methods=['GET'])
@cross_origin()
def function():
    col_list= ['SpecialTripTypeID', 'NodeType', 'PassengerCount', 'RequestedTime', 'Name', 'ScheduleTime', 'EstTravelDistance', 'EstTravelTime', 'Address', 'Long', 'Lat', 'Vehicle#', ]
    df = pd.read_csv("DC-Trips.csv", usecols= col_list, na_values=['-'], keep_default_na=False)
    Response = ""
    triptype = []
    nodetype = []
    passcount = []
    reqtime = []
    name = []
    schtime = []
    trvdist = []
    trvtime = []
    addr =[]
    long = []
    lat = []
    veh = []
    triptype_new = []
    reqtime_new = []
    lat_new =[]
    long_new = []
    trvtime_new = []
    trvdist_new = []
    passcount_new = []
    for row in range(0, 84):
        triptype.append(df.iloc[row, 0])
        nodetype.append(df.iloc[row, 1])
        passcount.append(df.iloc[row, 2])
        reqtime.append(df.iloc[row, 3])
        name.append(df.iloc[row, 4])
        schtime.append(df.iloc[row, 5])
        trvdist.append(df.iloc[row, 6])
        trvtime.append(df.iloc[row, 7])
        addr.append(df.iloc[row, 8])
        long.append(df.iloc[row, 9])
        lat.append(df.iloc[row, 10])
        veh.append(df.iloc[row, 11])
    for item in triptype:
        if item == '':
            triptype_new.append(item)
        elif type(item) == str:
            new_item = int(item)
            triptype_new.append(new_item)
    for item in lat:
        if item == '':
            lat_new.append(item)
        elif type(item) == str:
            new_item = float(item)
            lat_new.append(new_item)
    for item in long:
        if item == '':
            long_new.append(item)
        elif type(item) == str:
            new_item = float(item)
            long_new.append(new_item)
    for item in trvtime:
        if item == '':
            trvtime_new.append(item)
        elif type(item) == str:
            new_item = float(item)
            trvtime_new.append(new_item)
    for item in reqtime:
        if item == '':
            reqtime_new.append(None)
        elif type(item) == str:
            reqtime_new.append(item)
    for item in trvdist:
        if item == '':
            trvdist_new.append(item)
        elif type(item) == str:
            new_item = float(item)
            trvdist_new.append(new_item)
    for item in passcount:
        if item == '':
            passcount_new.append(item)
        elif type(item) == str:
            new_item = int(item)
            passcount_new.append(new_item)
    #print(triptype, nodetype, passcount, reqtime, name, schtime, trvdist, trvtime, addr, long, lat, veh)
    #print(reqtime)
    #print(reqtime_new)
    output = []
    for item in zip(triptype_new, nodetype, passcount_new, reqtime_new, name, schtime, trvdist_new, trvtime_new, addr, long_new, lat_new, veh):
        output.append([item[0], item[1], item[2], item[3], item[4], item[5], item[6], item[7], item[8], item[9], item[10], item[11]])
    Response += "Trip List Created"
    return jsonify({'response': Response, 'triplist': output})
# @app.route('/get-vehicles', methods=['GET'])
# def function():


def __main__():
    api.add_resource(function, '/api')
    api.add_resource(function, '/get-trips')

if __name__ == "__main__":
    app.run(host='172.20.224.1', port='1235', debug=True, threaded=True)
