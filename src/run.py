from app import app
from app import socketio

print("git test")

if __name__ == '__main__':
    socketio.run(app,host="0.0.0.0",port=80, debug=True)
    


