from flask import Flask, render_template, jsonify, send_from_directory
import pandas as pd
import json
import ast
import os
import numpy as np
from squash_analysis import generate_match_report
from functools import lru_cache
import threading
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Global cache for storing data
cache = {
    'match_report': None,
    'positions_data': None,
    'shot_types': None,
    'heatmap_data': None
}

def initialize_data():
    """Initialize all data and visualizations at server startup"""
    logger.info("Initializing data and generating visualizations...")
    
    try:
        # Generate the match report
        cache['match_report'] = generate_match_report("output/final.csv")
        
        # Read and process the CSV data
        df = pd.read_csv("output/final.csv")
        
        # Process player positions for visualization
        player1_positions = []
        player2_positions = []
        ball_positions = []
        
        for _, row in df.iterrows():
            try:
                # Process Player 1 positions
                p1_pos = ast.literal_eval(row['Player 1 RL World Position'])
                if p1_pos and not all(v == 0 for v in p1_pos):
                    player1_positions.append(p1_pos)
                    
                # Process Player 2 positions
                p2_pos = ast.literal_eval(row['Player 2 RL World Position'])
                if p2_pos and not all(v == 0 for v in p2_pos):
                    player2_positions.append(p2_pos)
                    
                # Process Ball positions
                ball_pos = ast.literal_eval(row['Ball RL World Position'])
                if ball_pos and not all(v == 0 for v in ball_pos):
                    ball_positions.append(ball_pos)
            except Exception as e:
                logger.warning(f"Error processing row: {e}")
                continue
        
        # Store processed data in cache
        cache['positions_data'] = {
            'player1': player1_positions,
            'player2': player2_positions,
            'ball': ball_positions
        }
        
        # Get and store shot distribution data
        cache['shot_types'] = df['Shot Type'].value_counts().to_dict()
        
        # Process and store heatmap data
        cache['heatmap_data'] = {
            'player1': player1_positions,
            'player2': player2_positions
        }
        
        logger.info("Data initialization complete!")
        
    except Exception as e:
        logger.error(f"Error during data initialization: {str(e)}")
        raise

# Initialize data in a separate thread to not block server startup
threading.Thread(target=initialize_data).start()

# Routes
@app.route('/')
def home():
    return render_template('projects.html')

@app.route('/projects/squash')
def squash():
    try:
        # Wait for data to be initialized if necessary
        if not all(cache.values()):
            return "Data is still being initialized. Please refresh in a few seconds.", 503
        
        return render_template('squash.html', 
                             positions=json.dumps(cache['positions_data']),
                             shot_types=json.dumps(cache['shot_types']),
                             match_report=cache['match_report'])
    except Exception as e:
        logger.error(f"Error in squash route: {str(e)}")
        return "An error occurred. Please try again later.", 500

@app.route('/get_heatmap_data')
def get_heatmap_data():
    try:
        if not cache['heatmap_data']:
            return jsonify({'error': 'Data not yet initialized'}), 503
        return jsonify(cache['heatmap_data'])
    except Exception as e:
        logger.error(f"Error in heatmap data route: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/video/<path:filename>')
def serve_video(filename):
    try:
        return send_from_directory('static', filename)
    except Exception as e:
        logger.error(f"Error serving video: {str(e)}")
        return "File not found", 404

@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
