
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

from routes.sentiment.sent_analyse import sentiment_bp 
from routes.market_demand.market import market_bp 
from routes.marketing_campaign.campaign import campaign_bp
from routes.production_yield.production import production_bp

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

app.register_blueprint(sentiment_bp, url_prefix='/sentiment') 
app.register_blueprint(market_bp, url_prefix='/market_demand')
app.register_blueprint(campaign_bp, url_prefix='/campaign')
app.register_blueprint(production_bp, url_prefix='/production_yield')

# Print the URL map to verify the routes
print(app.url_map)  

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

