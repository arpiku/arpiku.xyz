import random
import json

from app import app
from flask import render_template,request,jsonify


@app.route('/')
def home_page():
    return render_template('index.html')


if __name__ == '__main__':
    pass
 
