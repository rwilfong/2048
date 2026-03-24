"""
Script to run the 2048 game web application using Flask
Runs locally, currently not hosted on a server
"""
from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)
