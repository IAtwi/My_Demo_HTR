import helper


def get_detected_lines_coordinates(img, detector_model, y_offset = 3, filter_boxes = (False, 1000), min_box_line_iou =0):
    
    function_output = helper.get_detection_result(img, detector_model, False)
    
    model_output = function_output['model_output']
    
    # process detection output
    boxes_coordinates = model_output['preds'][0]
    
    img_boxes = []

    # remove small boxes
    for box_coordinates in boxes_coordinates:
        temp_box = list(map(int, box_coordinates[:4] * 1024))
        if filter_boxes[0] and ((temp_box[2]-temp_box[0]) * (temp_box[3]-temp_box[1])) < filter_boxes[1]:
            continue
        img_boxes.append(temp_box)
    
    # get lines coordinates
    lines_coordinates = helper.get_lines_coordinates(img_boxes, y_offset, min_box_line_iou)

    # fix coordinates
    inner_img_shape = function_output['inner_img_shape']
    inner_w = inner_img_shape[1]; inner_h = inner_img_shape[0];
    w_start = function_output['w_start']; h_start = function_output['h_start'];
    
    if w_start == 0:
        top_black_count = h_start
        img_ratio = 1024.0 / img.shape[1]
        
        for line_coordinates in lines_coordinates:
            line_coordinates[0] /= img_ratio
            line_coordinates[1] = (line_coordinates[1] - top_black_count) / img_ratio
            line_coordinates[2] /= img_ratio
            line_coordinates[3] = (line_coordinates[3] - top_black_count) / img_ratio    
    else:
        left_black_count = w_start
        img_ratio = 1024.0 / img.shape[0]
        
        for line_coordinates in lines_coordinates:
            line_coordinates[0] = (line_coordinates[0] - left_black_count) / img_ratio
            line_coordinates[1] /= img_ratio
            line_coordinates[2] = (line_coordinates[2] - left_black_count) / img_ratio
            line_coordinates[3] /= img_ratio 
        
    # convert coordinates to int
    for line_coordinates in lines_coordinates:
        for i in range(len(line_coordinates)):
            line_coordinates[i] = int(line_coordinates[i])
    
    return lines_coordinates
	
def get_detected_lines_coordinates2(img, detector_model, filter_boxes =(True, 500), y_offset = 10, min_box_line_iou =0.2, min_line_area=5000,
	min_line_width=0.05, full_lines=True):
	function_output = helper.get_detection_result(img, detector_model, False)
    
	boxes_coordinates = function_output['model_output']['preds'][0]
	
	img_boxes = []
	
	# remove small boxes
	for box_coordinates in boxes_coordinates:
		temp_box = list(map(int, box_coordinates[:4] * 1024))
		if filter_boxes[0] and ((temp_box[2]-temp_box[0]) * (temp_box[3]-temp_box[1])) < filter_boxes[1]:
			continue
		
		img_boxes.append(temp_box)
    
	# get lines coordinates
	lines_coordinates = helper.get_lines_coordinates(img_boxes, y_offset, min_box_line_iou)

    # fix coordinates
	inner_img_shape = function_output['inner_img_shape']
	inner_w = inner_img_shape[1]; inner_h = inner_img_shape[0];
	w_start = function_output['w_start']; h_start = function_output['h_start'];
    
	if w_start == 0:
		top_black_count = h_start
		img_ratio = 1024.0 / img.shape[1]
        
		for line_coordinates in lines_coordinates:
			line_coordinates[0] /= img_ratio
			line_coordinates[1] = (line_coordinates[1] - top_black_count) / img_ratio
			line_coordinates[2] /= img_ratio
			line_coordinates[3] = (line_coordinates[3] - top_black_count) / img_ratio    
	else:
		left_black_count = w_start
		img_ratio = 1024.0 / img.shape[0]
		
		for line_coordinates in lines_coordinates:
			line_coordinates[0] = (line_coordinates[0] - left_black_count) / img_ratio
			line_coordinates[1] /= img_ratio
			line_coordinates[2] = (line_coordinates[2] - left_black_count) / img_ratio
			line_coordinates[3] /= img_ratio 
        
    # convert coordinates to int
	for line_coordinates in lines_coordinates:
		for i in range(len(line_coordinates)):
			line_coordinates[i] = int(line_coordinates[i])
    
	for i in range(len(lines_coordinates)-1, -1, -1):
		box =  lines_coordinates[i]
		if ((box[2]-box[0]) * (box[3]-box[1])) < min_line_area or ((box[2]-box[0]) < min_line_width):
			del lines_coordinates[i]
	
	if full_lines:
		lines_coordinates = get_full_lines_coordinates(img, lines_coordinates)
	
	return lines_coordinates


def get_boxes_coordinates(img, detector_model):
    
    function_output = helper.get_detection_result(img, detector_model, False)
    
    # get model ouput
    model_output = function_output['model_output']
    
    # process detection output
    boxes_coordinates = model_output['preds'][0]
    
    img_boxes = []

    for box in boxes_coordinates:
        img_boxes.append(list(map(int, box[:4] * 1024)))
    
    # get lines coordinates
    img_lines_coordinates = img_boxes

    # fix coordinates
    inner_img_shape = function_output['inner_img_shape']
    inner_w = inner_img_shape[1]; inner_h = inner_img_shape[0];
    
    if inner_w == 1024:
        top_black_count = (1024 - inner_h) / 2
        img_ratio = 1024.0 / img.shape[1]
        
        for line_coordinates in img_lines_coordinates:
            line_coordinates[0] /= img_ratio
            line_coordinates[1] = (line_coordinates[1] - top_black_count) / img_ratio
            line_coordinates[2] /= img_ratio
            line_coordinates[3] = (line_coordinates[3] - top_black_count) / img_ratio    
    else:
        left_black_count = (1024 - inner_w) / 2
        img_ratio = 1024.0 / img.shape[0]
        
        for line_coordinates in img_lines_coordinates:
            line_coordinates[0] = (line_coordinates[0] - left_black_count) / img_ratio
            line_coordinates[1] /= img_ratio
            line_coordinates[2] = (line_coordinates[2] - left_black_count) / img_ratio
            line_coordinates[3] /= img_ratio 
        
        
    # convert coordinates to int
    for line_coordinates in img_lines_coordinates:
        for i in range(len(line_coordinates)):
            line_coordinates[i] = int(line_coordinates[i])
    
    # return result
    return img_lines_coordinates


def get_full_lines_coordinates(img, boxes, initial_point=(0,0)):
    full_lines_coordinates = []
    
    for i in range(len(boxes)):
        if i < len(boxes)-1:
            bottom_right_point = (img.shape[1], (boxes[i][3]+boxes[i+1][1]) / 2.0)
        else:
            bottom_right_point = (img.shape[1], img.shape[0])
        
        full_lines_coordinates.append([initial_point[0], initial_point[1], bottom_right_point[0], bottom_right_point[1]])
        
        initial_point = (0, bottom_right_point[1])
        
    return full_lines_coordinates
	

# get part of an img
def crop_box(image, box):
    return image[box[1]:box[3], box[0]:box[2]]


