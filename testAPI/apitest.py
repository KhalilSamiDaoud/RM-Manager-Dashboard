import requests
from PIL import Image 
from numpy import asarray
import numpy as np
from numpy import array
import pandas as pd
import base64

def function():
    api_url = "http://172.20.224.1:1235/get-trips"
    response = requests.get(url= api_url)
    assert response.status_code == 200
    response_data = response.json()
    list = response_data['triplist']
    #list = response_data['response']
    print(list)

def __main__():
    function()


if __name__ == '__main__':
    __main__()
