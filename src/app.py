from flask import Flask
from flask_socketio import SocketIO
from mongo import MongoDBController

app = Flask(__name__)


app.config['SECRET_KEY'] = 'asdfasdf'


socketio = SocketIO(app)

# Importing API and WebSocket routes
from apis.routes import *
from sockets.events import *


if __name__ == "__main__":
    pass
