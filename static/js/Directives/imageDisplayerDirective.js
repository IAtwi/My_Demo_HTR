'use strict';
app.directive('imageDisplayer', ['UtilsService',
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
			templateUrl: 'template/imageDisplayerDirectiveTemplate'
        };

        function Ctor(ctrl, $scope, $attrs) {
            this.initializeController = initializeController;
			
			var id;
			var context;
			var image;

            function initializeController() {
                $scope.scopeModel = {
					gotDetection: false,
					submitted: false,
					detectionCount: 0
				};
				
				$scope.scopeModel.removeImage = function(){
					if(context != undefined && typeof context.removeImage == 'function'){
						context.removeImage(id);
					}
				};
				
				// $scope.scopeModel.displayInModal = function(){
					// if(context != undefined && typeof context.displayInModal == 'function'){
						// context.displayInModal({
							// image:{
								// src: $scope.scopeModel.src,
								// name: $scope.scopeModel.name
							// },
							// id: id
						// });
					// }
				// };
				
				$scope.scopeModel.displayInModal = function(){
					
					if(context != undefined && typeof context.displayInModal == 'function'){
						context.displayInModal({
							image:{
								src: $scope.scopeModel.src,
								name: $scope.scopeModel.name,
								detections: image.detections,
								originalHeight: image.originalHeight
							},
							id: id
						});
					}
				};

                defineAPI();
            };

            function defineAPI() {
                var api = {};

                api.load = function (payload) {
                    var promises = [];
					
					if(payload != undefined){
						image = payload.image;
						id = payload.id;
						context = payload.context;
						
						if(image != undefined){
							$scope.scopeModel.src = image.src;
							$scope.scopeModel.name = image.name;

							if(image.detections != undefined){
								$scope.scopeModel.gotDetection = true;
								$scope.scopeModel.submitted = true;
								$scope.scopeModel.detectionCount = image.detections.length;
							}
						}
					}


                    return UtilsService.waitPromiseNode({promises: promises});
                };
				
				api.getImage = function(){
					return image;
				};
				
				api.submit = function(){
					$scope.scopeModel.submitted = true;
				};

                if (ctrl.onReady != null && typeof (ctrl.onReady) == "function") {
                    ctrl.onReady(api);
                }
            };
        };

        return directiveDefinitionObject;
    }]);
