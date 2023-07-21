'use strict';
(function (app) {
    WebAPIService.$inject = ['BaseWebAPIService'];

    function WebAPIService(BaseWebAPIService) {
        
		function recognizeImage(imgName, imgDetections){
			return BaseWebAPIService.post('/api/recognize_img', {
				name: imgName,
				detections: imgDetections
			});
		}
		
		function getDetections(imagesNames){
			return BaseWebAPIService.post('/api/detect_lines', {
				images_names: imagesNames
			});
		}
		
		function cropImage(imageName, coordinates, height){
			return BaseWebAPIService.post('/api/crop_image', {
				name: imageName,
				position: coordinates,
				height: height
			});
		}
		
		function uploadImages(form_data){
			return BaseWebAPIService.post('/api/upload_images', form_data, '', angular.identity);
		}

        return {
			recognizeImage: recognizeImage,
			getDetections: getDetections,
			cropImage: cropImage,
			uploadImages: uploadImages
        };
    }
    app.service('WebAPIService', WebAPIService);
})(app);