import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
from doctr.models import db_resnet50
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import cv2
import base64
import utils


# Models Region
detector_model = db_resnet50(pretrained=True)

basepath = os.path.dirname(__file__)
images_folder = 'uploads'
	
recognition_model_path = os.path.join(basepath, 'models', 'TrOCR_large_handwritten')

processor = TrOCRProcessor.from_pretrained(recognition_model_path)
recognition_model = VisionEncoderDecoderModel.from_pretrained(recognition_model_path)
# End Region


# Public Functions Region
def upload_images(uploaded_files):
	
	for file in uploaded_files:
		if file == None or not allowed_file(file.filename):
			return 'Invalid File Uploaded', 400
	
	for image in uploaded_files:
		image_name = image.filename
		save_path = f'{images_folder}/{image_name}'
		
		if os.path.exists(save_path):
			continue
			
		image.save(save_path)
		
	return 'Images Uploaded'

def recognize_img(img_name, detections):

	if detections is None:
		detected_lines = detect_lines([img_name])[0]
		detections = detected_lines['detections']
		
	for line_coordinates in detections:
		for i in range(len(line_coordinates)):
			line_coordinates[i] = max(0, int(line_coordinates[i]))
		
	img_lines = get_img_lines(img_name, detections)
	
	recognized_texts = recognize_images_lines([img_lines], processor, recognition_model)
	
	return recognized_texts[0]
	
def crop_image(img_name, position, ui_height):
	file_path = os.path.join(basepath, images_folder, img_name)
	original_image = cv2.imread(file_path)
	
	ratio_diff = original_image.shape[0] / ui_height
	
	x1 = int(position[0] * ratio_diff)
	y1 = int(position[1] * ratio_diff)
	x2 = int(x1 + position[2] * ratio_diff)
	y2 = int(y1 + position[3] * ratio_diff)
	
	cropped_image = original_image[y1:y2, x1:x2, :]
	
	cv2.imwrite(file_path, cropped_image)
	
	with open(file_path, 'rb') as image_file:
		image_data = image_file.read()
		encoded_image = base64.b64encode(image_data).decode('utf-8')

	return 'data:image/png;base64,' + encoded_image

def detect_lines(images_names):
	results = []
	
	for image_name in images_names:
		image_path = os.path.join(basepath, images_folder, image_name)
		image = cv2.imread(image_path)

		# detection_result = utils.get_detected_lines_coordinates(image, detector_model, y_offset = 3, filter_boxes = (False, 1000), min_box_line_iou =0)
		detection_result = utils.get_detected_lines_coordinates2(image, detector_model)
		
		results.append({'name':image_name, 'detections':detection_result, 'originalHeight': image.shape[0]})
	
	return results
	
def clear_folder(folder_path):
	if not os.path.exists(folder_path):
		return
		
	for filename in os.listdir(folder_path):
		file_path = os.path.join(folder_path, filename)
		
		if os.path.isfile(file_path):
			os.remove(file_path)


# Private Functions Region
def allowed_file(filename):
	ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
	
	return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_img_lines(image_name, detections):
	img_lines = []
	
	basepath = os.path.dirname(__file__)
	
	image_path = os.path.join(basepath, 'uploads', image_name)
	image = cv2.imread(image_path)
	
	detections = sorted(detections, key=lambda detection: detection[1])
	
	for detection_coordinates in detections:
		img_lines.append(utils.crop_box(image, detection_coordinates))
		
	return img_lines
	
def recognize_images_lines(images_lines, processor, recognition_model):
    images_texts = []
    
    for img_lines in images_lines:
        
        processor_result = processor(img_lines, return_tensors="pt")
        
        pixel_values = processor_result.pixel_values
        
        generated_ids = recognition_model.generate(pixel_values, max_length=128)
        
        generated_text = processor.batch_decode(generated_ids, skip_special_tokens=True)
        
        images_texts.append(generated_text)    
    
    return images_texts
