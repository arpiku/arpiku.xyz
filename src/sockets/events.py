from app import app,socketio

from flask import Flask, render_template
from flask_socketio import SocketIO, emit


@socketio.on('connect', namespace='/')
def connected():
    print("Client Connected..")


@socketio.on('disconnect', namespace='/')
def disconnected():
    print("Client Disconnected")



