import cv2
import numpy as np



def get_lines_coordinates(boxes, y_offset = 4, min_box_line_iou = 0):
    
    lines=[]
    
    boxes = sorted(boxes, key=lambda box: box[1])
    
    for box in boxes:
        box_added = False
        box_tl_x = box[0]
        box_tl_y = box[1]
        box_br_x = box[2]
        box_br_y = box[3]
            
        if len(lines) > 0:
            line = lines[-1]
            
            if box_br_y <= line[3]+y_offset or line_box_projection_iou(line, box) > min_box_line_iou:
                line[0] = min(box_tl_x, line[0])
                line[1] = min(box_tl_y, line[1])
                line[2] = max(box_br_x, line[2])
                line[3] = max(box_br_y, line[3])

                box_added = True
                
        if not box_added:
            lines.append(box)

    return lines


def line_box_projection_iou(line, box):
    
    intersection = line[3] - box[1]
    
    union = line[3] - line[1] + box[3] - box[1] - intersection
    
    return intersection / union
    



# get img or array of imgs
def read_images(imgs, imgs_array = True):
    
    if imgs_array:
        images = []
        if type(imgs[0]) == str:
            for path in imgs:
                images.append(cv2.imread(path))
        else:
            images = imgs
        return images

    if type(imgs) == str:
        return cv2.imread(imgs)
    return imgs


def get_detection_result(imgs, detection_model, imgs_array=True):
    
    input_imgs = read_images(imgs, imgs_array)
    
    if not imgs_array:
        resized_image, inner_img_shape, w_start, h_start= resize_3channel_img_reserving_aspect_ratio(imgs)
        
        model_output = detection_model(np.array([resized_image]))
        
        return {'model_output':model_output, 'inner_img_shape':inner_img_shape, 'w_start':w_start, 'h_start':h_start}
    
    resized_imgs = []
    
    for input_img in input_imgs:
        resized_imgs.append(resize_3channel_img_reserving_aspect_ratio(input_img)[0])
        
    model_output = detection_model(np.array(resized_imgs))
    
    return {'model_output':model_output}



# resize img, centralize it and save ratio using black padding
def resize_3channel_img_reserving_aspect_ratio(img, final_width = 1024, final_height = 1024, width_padding_factor=2, height_padding_factor=2):
    original_h, original_w = img.shape[:2]
    
    original_ratio = original_w / original_h
    final_ratio = final_width / final_height
    
    if original_ratio >= final_ratio:
        new_height = original_h * (final_width / original_w)
        resize_shape = (final_width, int(new_height))
    else:
        new_width = original_w * (final_height / original_h)
        resize_shape = (int(new_width), final_height)
    
    resized_img = cv2.resize(img, resize_shape)
    
    black_img = np.zeros((final_height, final_width, 3), dtype=resized_img.dtype)
        
    h_start = 0
    w_start = 0
    if width_padding_factor != 1:
        w_start = (final_width - resized_img.shape[1]) // width_padding_factor
    if height_padding_factor != 1:
        h_start = (final_height - resized_img.shape[0]) // height_padding_factor
    
    h_end = h_start+resized_img.shape[0]
    w_end = w_start+resized_img.shape[1]
    
    black_img[h_start:h_end, w_start:w_end, :] = resized_img
    
    return black_img, resized_img.shape, w_start, h_start