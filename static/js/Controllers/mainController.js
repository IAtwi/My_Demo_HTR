"use strict";
var app = angular.module('myApp', []);

function mainController($scope, WebAPIService, UtilsService, $timeout) {

	var imagesDisplayerAPI;
	var resultsDisplayerAPI;
	
	var context;
	var stage;
	var dataInModal;
	
	
    defineScope();
    loadStaticData();


    function defineScope() {
        $scope.scopeModel = {
			recognizePressed: false,
			submitPressed: false,
			isAppLoading: false,
			showActionSection: true
		};
		
		$scope.scopeModel.onImagesDisplayerReady = function(api){
			imagesDisplayerAPI = api;
		};
		
		$scope.scopeModel.onResultsDisplayerReady = function(api){
			resultsDisplayerAPI = api;
		};
		
		$scope.scopeModel.uploadImages = function(){
			document.getElementById('imageUpload').click();
		};
		
		$scope.scopeModel.handleFileChange = function(element){
			var files = element.files;
			
			if(files.length == 0){
				return;
			}
			
			var formData = new FormData(document.getElementById('upload-file'));
			
			uploadImages(files, formData);
		};
		
		$scope.scopeModel.submit = function(){
			
			if(imagesDisplayerAPI.getImagesCount() == 0){
				alert('Please Upload Images First');
				return;
			}
			
			$scope.scopeModel.submitPressed = true;
			$scope.scopeModel.showJCropSection = false;
			$scope.scopeModel.showActionSection = true;
			
			imagesDisplayerAPI.submitImages();
		};
		
		$scope.scopeModel.test = function(){
			$scope.scopeModel.isLoading = ! $scope.scopeModel.isLoading;
		};

		$scope.scopeModel.detectAll = function(){
			
			$scope.scopeModel.isAppLoading = true;
			var images = imagesDisplayerAPI.getImages();
			
			$scope.scopeModel.showJCropSection = false;
			
			WebAPIService.getDetections(images.map(image => image.name))
			.then(function(response) {
				var results = response.data;
				
				var payload_images = [];
				
				for(var i=0; i<results.length; i++){
					var result = results[i];
					var detections = result.detections;
					
					for(var j =0; j< detections.length; j++){
						var line = detections[j];
						
						for(var k=0; k<line.length; k++){
							if(line[k] < 0){
								line[k] = 0;
							}
						}
					}
					
					var correspondingImage = UtilsService.getItemByVal(images, result.name, 'name');
					
					payload_images.push({
						name: result.name,
						src: correspondingImage.src,
						detections: result.detections,
						originalHeight: result.originalHeight
					});
				}
				
				var payload = {
					images: payload_images,
					context: getContext()
				};
				
				imagesDisplayerAPI.clearImages();
				imagesDisplayerAPI.addImages(payload).then(function(){
					$scope.scopeModel.isAppLoading = false;
				});
			});
		};
		
		$scope.scopeModel.recognizeAll = function(){
			
			var payload = {
				images: imagesDisplayerAPI.getImages()
			};
			
			resultsDisplayerAPI.load(payload);
			
			$scope.scopeModel.recognizePressed = true;
			$scope.scopeModel.showJCropSection = false;
		};
		
		$scope.scopeModel.reset = function(){
			location.reload();
		};
		
		$scope.scopeModel.cancel = function(){
			$scope.scopeModel.showJCropSection = false;
			$scope.scopeModel.showActionSection = true;
			scrollToSection('images_section');
		};
		
		$scope.scopeModel.save = function(){
			if(stage == undefined || stage.crops.size == 0){
				return;
			}
			
			$scope.scopeModel.showJCropSection = false;
			$scope.scopeModel.isAppLoading = true;
			scrollToSection('images_section');
			var crops = stage.crops;
			
			if(dataInModal.image.detections == undefined){
				var [first] = crops;
			
				var pos = first.pos;
				
				var img = document.getElementById('jcrop_img');
				
				WebAPIService.cropImage(dataInModal.image.name, [pos.x, pos.y, pos.w, pos.h], img.height)
				.then(function(response){
					
					var payload = {
						id: dataInModal.id,
						src: response.data
					};
					
					imagesDisplayerAPI.loadImage(payload).then(function(){
						$scope.scopeModel.isAppLoading = false;
						$scope.scopeModel.showActionSection = true;
					});
				});
			}else{
				
				var img = document.getElementById('jcrop_img');
				var detections = [];
				
				var heightRatio = dataInModal.image.originalHeight / img.height ;
				
				crops.forEach((crop) => {
					var pos = crop.pos;
					
					var x1 = pos.x * heightRatio;
					var y1 = pos.y * heightRatio;
					var x2 = x1 + pos.w * heightRatio;
					var y2 = y1 + pos.h * heightRatio;
					
					detections.push([
						Math.floor(x1), Math.floor(y1), Math.floor(x2), Math.floor(y2)
					]);
				});
				
				var payload = {
					id: dataInModal.id,
					detections: detections,
					originalHeight: dataInModal.image.originalHeight
				};
				
				imagesDisplayerAPI.loadImage(payload).then(function(){
					$scope.scopeModel.isAppLoading = false;
					$scope.scopeModel.showActionSection = true;
				});	
			}
		};
    }
	
	function loadStaticData() {
		
		// INPUT AREA EVENTS
		const dropArea = document.getElementById('input-area');

		dropArea.addEventListener('dragenter', handleDragEnter, false);
		dropArea.addEventListener('dragover', handleDragOver, false);
		dropArea.addEventListener('dragleave', handleDragLeave, false);
		dropArea.addEventListener('drop', handleDrop, false);
		
		function handleDragEnter(e) {
			preventDefault(e);
			dropArea.style.backgroundcolor = '#ddd';
		}
		
		function handleDragOver(e) {
			preventDefault(e);
			dropArea.style.backgroundColor = '#ddd';
		}
		
		function handleDragLeave(e) {
			preventDefault(e);
			dropArea.style.backgroundColor = '#f0f8ff';
		}

		function handleDrop(e) {
			preventDefault(e);
			
			dropArea.style.backgroundColor = '#f0f8ff';
			
			const files = e.dataTransfer.files;
			
			uploadImages(files);
		}
		
		dropArea.addEventListener('paste', handlePaste, false);

		function handlePaste(e) {
			const pastes = (e.clipboardData || e.originalEvent.clipboardData).items;
			
			const files = [];

			for (let i = 0; i < pastes.length; i++) {
				const paste = pastes[i];

				if (paste.kind === 'file') {
					files.push(paste.getAsFile());
				}
			}

			if(files.length >0)
				uploadImages(files);
		}
		
		function preventDefault(e) {
			e.preventDefault();
			e.stopPropagation();
		}
	}
	
	function scrollToSection(sectionId){
		var section = document.getElementById(sectionId);
		
		if (section) {
			section.scrollIntoView({ behavior: 'smooth' });
		}
	}
	
	function uploadImages(files, formData){
		
		if(imagesDisplayerAPI.getImagesCount() + files.length > 10){
			alert("Can't upload more than 10 images.");
			return;
		}
		
		$scope.scopeModel.isAppLoading = true;
		
		if(formData == undefined){
			formData = new FormData();
			
			for (let i = 0; i < files.length; i++) {
				formData.append('file', files[i]);
			}
		}
		
		WebAPIService.uploadImages(formData)
		.then(function(response) {
			
			var existingImagesNames = imagesDisplayerAPI.getImages().map(image => {
				return image.name;
			});
			
			var results = [];
			var counter = 0;

			for (var i = 0; i < files.length; i++) {
				var file = files[i];
				
				if(existingImagesNames.includes(file.name)){
					counter++;
					
					if(counter == files.length) {
						
						var payload = {
							images: results,
							context: getContext()
						};

						imagesDisplayerAPI.addImages(payload).then(function(){
							$scope.scopeModel.isAppLoading = false;
						});
					}
					
					continue;
				}
				
				var reader = new FileReader();

				reader.onload = (function (theFile) {
					return function (e) {
							results.push({
							name: theFile.name,
							src: e.target.result
						});

						counter++;

						if(counter == files.length) {
							
							var payload = {
								images: results,
								context: getContext()
							};

							imagesDisplayerAPI.addImages(payload).then(function(){
								$scope.scopeModel.isAppLoading = false;
							});
						}
					};
				})(file);
				
				reader.readAsDataURL(file);
			}
		}).catch(function(error){
			alert(error.data);
			$scope.scopeModel.isAppLoading = false;
		});
	}
	
	function getContext(){
		
		if(context != undefined){
			return context;
		}
		
		context = {
			displayInModal: function(data){
				dataInModal = data;
				showJCropSection(data.image);
			},
			onImageRemoved: function(){
				$scope.scopeModel.showJCropSection = false;
			}
		};
		
		return context;
	}
	
	function showJCropSection(image){
		
		$scope.scopeModel.src = image.src;
		$scope.scopeModel.name = image.name;
		$scope.scopeModel.showActionSection = false;
		$scope.scopeModel.detectionsCount = undefined;
		var detections = image.detections;
		var isCropMode = detections == undefined || detections.length == 0;
		
		const stageOptions = {
			shadeColor: [0, 0, 0, 0.5],
			multi: !isCropMode
		};
		
		$scope.scopeModel.JCropSectionTitle = isCropMode ? 'Crop': 'Detections';
		$scope.scopeModel.showJCropSection = true;
		
		Jcrop.load('jcrop_img').then(function(img) {
			
			if(stage != undefined){
				stage.destroy();
			}
			
			stage = Jcrop.attach(img, stageOptions);
			
			if(isCropMode){
				scrollToSection('jcrop-section');
				return;
			}
			
			$scope.scopeModel.detectionsCount = `(${detections.length})`;
			
			stage.listen('crop.activate', (widget,e) => {
				$timeout(function(){
					$scope.scopeModel.detectionsCount = stage.crops.size;
				});
			});
			
			var heightRatio = img.height / image.originalHeight;
			
			for(var i=detections.length-1; i>=0; i--){
				var detection = detections[i];
				
				var x = Math.round(detection[0] * heightRatio);
				var y = Math.round(detection[1] * heightRatio);
				var w = Math.round(detection[2] * heightRatio - x);
				var h = Math.round(detection[3] * heightRatio - y);
				
				const rect = Jcrop.Rect.create(x,y,w,h);
				stage.newWidget(rect,{});
			}
			
			scrollToSection('jcrop-section');
		});
	}
}
app.controller("mainController", mainController);