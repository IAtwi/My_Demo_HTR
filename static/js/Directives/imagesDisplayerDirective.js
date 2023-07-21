'use strict';
app.directive('imagesDisplayer', ['UtilsService',
	function (UtilsService) {

		var directiveDefinitionObject = {
			restrict: 'E',
			scope: {
				onReady: '='
			},
			controller: function ($scope, $element, $attrs) {
				var ctrl = this;
				var ctor = new Ctor(ctrl, $scope, $attrs);
				ctor.initializeController();
			},
			bindToController: true,
			controllerAs: 'ctrl',
			templateUrl: 'template/imagesDisplayerDirectiveTemplate'
		};

		function Ctor(ctrl, $scope, $attrs) {
			this.initializeController = initializeController;
			
			var context;
			var images;
			var parentContext;

			function initializeController() {
				$scope.scopeModel = {
					showImages: false,
					submitted: false,
					images: []
				};
				
				
				$scope.scopeModel.clearImages = function(){
					clearImages();
				};
				

				defineAPI();
			};

			function defineAPI() {
				var api = {};
				
				api.addImages = function(payload){
					
					var promises = [];
					
					if(payload != undefined){
						images = payload.images;
						parentContext = payload.context;
						
						if(images != undefined && images.length >0){
							
							for(var i=0; i<images.length; i++){
								addItem({
									id: UtilsService.guid(),
									image: images[i],
									context: getContext()
								},promises);
							}
						}
					}


					return UtilsService.waitPromiseNode({promises: promises}).then(function(){
						$scope.scopeModel.showImages = true;
					});
				};
				
				api.loadImage = function(data){
					if(data == undefined){
						return;
					}
					
					var item = UtilsService.getItemByVal($scope.scopeModel.images, data.id, 'id');
					
					if(item == undefined){
						return;
					}
					
					var payload = {
						image: {
							src: data.src == undefined ? item.image.src: data.src,
							name: item.image.name,
							detections: data.detections,
							originalHeight: data.originalHeight
						},
						id: item.id,
						context: getContext()
					};
					
					return item.imagedisplayerAPI.load(payload);
				};
				
				api.getImages = function(){
					var images = [];
					
					for(var i=0; i<$scope.scopeModel.images.length; i++){
						images.push($scope.scopeModel.images[i].imagedisplayerAPI.getImage());
					}
					
					return images;
				};
				
				api.clearImages = function(){
					clearImages();
				};
				
				api.getImagesCount = function(){
					return $scope.scopeModel.images.length;
				};
				
				api.submitImages = function(){
					$scope.scopeModel.submitted = true;
					
					for(var i=0; i<$scope.scopeModel.images.length; i++){
						$scope.scopeModel.images[i].imagedisplayerAPI?.submit();
					}
				};

				if (ctrl.onReady != null && typeof (ctrl.onReady) == "function") {
					ctrl.onReady(api);
				}
			};
			
			
			function clearImages (){
				$scope.scopeModel.showImages = false;
				$scope.scopeModel.images = [];
			}
			
			function addItem (data, promises){
				var item = {
					id: data.id,
					image: data.image,
					context: data.context
				}
				
				loadImageDisplayer(item, promises);
				
				$scope.scopeModel.images.push(item);
			}
			
			function loadImageDisplayer(item, promises){
				item.imageDisplayerReady = UtilsService.createPromiseDeferred();
				
				item.onImageDisplayerReady = function(api){
					item.imagedisplayerAPI = api;
					item.imageDisplayerReady.resolve();
				};
				
				item.imageDisplayerReady.promise.then(function(){
					
					var payload = {
						image: item.image,
						id: item.id,
						context: item.context
					};
					
					var promise = item.imagedisplayerAPI.load(payload);
					
					if(promises != undefined){
						promises.push(promise);
					}
				});
			}
			
			function getContext(){
				if(context != undefined){
					return context;
				}
				
				context = {
					...parentContext,
					removeImage: function(id){
						var index = UtilsService.getItemIndexByVal($scope.scopeModel.images, id, 'id');
						
						if(index >= 0){
							$scope.scopeModel.images.splice(index, 1);
							
							if($scope.scopeModel.images.length == 0){
								$scope.scopeModel.showImages = false;
							}
							
							if(parentContext.onImageRemoved != undefined && typeof(parentContext.onImageRemoved) == 'function'){
								parentContext.onImageRemoved();
							}
						}
					}
				};
				
				return context;
			}
		};

		return directiveDefinitionObject;
	}]);
