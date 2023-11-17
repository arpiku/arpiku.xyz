import random
import json

from app import app
from flask import render_template,request,jsonify,redirect, send_file


@app.route('/')
def home_page():
    return render_template('index.html')

@app.route('/resume')
def resume_page():
    return send_file('static/Resume.pdf')

@app.route('/main-btn')
def digital_garden_redirect():
    return redirect('https://arpiku-notes-dg.vercel.app/')

@app.route('/blog')
def blog_page():
    return redirect('https://arpiku-notes-dg.vercel.app/')

@app.route('/projects')
def projects_page():
    return render_template('default.html')

@app.route('/tools')
def tools_page():
    return render_template('default.html')

@app.route('/dev')
def dev_page():
    return render_template('default.html')

 
