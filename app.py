import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
from flask import Flask, render_template, request
import app_manager

# APP 
class CustomFlask(Flask):
    jinja_options = Flask.jinja_options.copy()
    jinja_options.update(dict(
        block_start_string='{%',
        block_end_string='%}',
        variable_start_string='{[{',
        variable_end_string='}]}',
    ))
	
app = CustomFlask(__name__)
app.config['DEBUG'] = True
	
# DATA
    
@app.route('/api/upload_images', methods=['POST'])
def upload_images():
	if 'file' not in request.files:
		return 'No images uploaded', 400
		
	uploaded_files = request.files.getlist('file')
	
	return app_manager.upload_images(uploaded_files)
	
@app.route('/api/recognize_img', methods=['POST'])
def recognize_img():
	img_name = request.json['name']
	detections = None
	
	if 'detections' in request.json:
		detections = request.json['detections']
	
	return app_manager.recognize_img(img_name, detections)
	
	
@app.route('/api/crop_image', methods=['POST'])
def crop_uploaded_image():
	img_name = request.json['name']
	position = request.json['position']
	ui_height = request.json['height']
	
	return app_manager.crop_image(img_name, position, ui_height)
	
@app.route('/api/detect_lines', methods=['POST'])
def detect_lines():
	images_names = request.json['images_names']

	return app_manager.detect_lines(images_names)
	
	

# VIEWS
@app.route('/', methods=['GET'])
def index_page():
	app_manager.clear_folder('uploads')
	return render_template('index.html')
	
@app.route('/template/<name>', methods=['GET'])
def get_template(name):
	return render_template(f'directivesTemplates/{name}.html')
	
	
	
if __name__ == '__main__':
	app.run(debug=True, port=5000)
	
	
