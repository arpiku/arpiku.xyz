from flask import Flask
from flask_socketio import SocketIO

app = Flask(__name__)


app.config['SECRET_KEY'] = 'asdfasdf2312321312qwedqwd3312'


socketio = SocketIO(app)

# Importing API and WebSocket routes
from api.routes import *
from sockets.events import *



