from flask_cors import CORS, cross_origin
from flask import Flask, jsonify
from flask_restful import Api
import pandas as pd
import pyodbc
import sys

import constants

app = Flask(__name__)
cors = CORS(app)
api = Api(app)


@app.route('/api', methods=['GET'])
@cross_origin()
def page():
    response = "<h1>Simulation API</h1><p>This is the Simulation API for ITCurves</p>"
    return jsonify({'response': response})


@app.route('/get-trips', methods=['GET'])
@cross_origin()
def get_trips():
    compiled_data = []
    response = ""

    conn = pyodbc.connect(constants.DB_CONNECT_CRED)

    df = pd.read_sql(constants.DB_QUERY_TRIPS, conn)
    df = df.sort_values(["RouteNo", "StopNumber"], ascending=(True, True))

    for index, row in df.iterrows():
        format_row(row)

        new_entry = [
            0,
            row[constants.DF_COLS['vehicle']],
            row[constants.DF_COLS['nodetype']],
            row[constants.DF_COLS['reqtime']],
            row[constants.DF_COLS['schtime']],
            row[constants.DF_COLS['passcount']],
            row[constants.DF_COLS['name']],
            row[constants.DF_COLS['lat']],
            row[constants.DF_COLS['long']],
            row[constants.DF_COLS['addr']],
            row[constants.DF_COLS['trvtime']],
            row[constants.DF_COLS['trvdist']]
        ]
        compiled_data.append(new_entry)

    response += "Trip List Created"
    return jsonify({'response': response, 'triplist': compiled_data})


def format_row(row):
    row[constants.DF_COLS['schtime']] = str(row[constants.DF_COLS['schtime']]).split()[1] \
        if row[constants.DF_COLS['schtime']] \
        else ''
    row[constants.DF_COLS['reqtime']] = str(row[constants.DF_COLS['reqtime']]).split()[1] \
        if row[constants.DF_COLS['reqtime']] \
        else ''
    row[constants.DF_COLS['lat']] = float(row[constants.DF_COLS['lat']]) \
        if row[constants.DF_COLS['lat']] \
        else ''
    row[constants.DF_COLS['long']] = float(row[constants.DF_COLS['long']]) \
        if row[constants.DF_COLS['long']] \
        else ''
    if row[constants.DF_COLS['nodetype']]:
        if row[constants.DF_COLS['nodetype']] == 'P':
            row[constants.DF_COLS['nodetype']] += 'U'
        if row[constants.DF_COLS['nodetype']] == 'D':
            row[constants.DF_COLS['nodetype']] += 'O'


def __main__():
    api.add_resource(page, '/api')
    api.add_resource(get_trips, '/get-trips')


if __name__ == "__main__":
    app.run(host='192.168.8.25', port='1235', debug=True, threaded=True)
