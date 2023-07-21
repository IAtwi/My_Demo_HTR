'use strict';
app.directive('resultsDisplayer', ['UtilsService',
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
			templateUrl: 'template/resultsDisplayerDirectiveTemplate'
		};

		function Ctor(ctrl, $scope, $attrs) {
			this.initializeController = initializeController;

			function initializeController() {
				$scope.scopeModel = {
					results: []
				};

				defineAPI();
			};

			function defineAPI() {
				var api = {};
				
				api.load = function(payload) {
					
					var promises = [];
					
					$scope.scopeModel.results = [];
					
					if(payload != undefined){
						var images = payload.images;
						
						if(images != undefined && images.length >0){
							
							for(var i=0; i<images.length; i++){
								addItem({
									id: i,
									image: images[i]
								},promises);
							}
						}
					}

					return UtilsService.waitPromiseNode({promises: promises});
				};

				if (ctrl.onReady != null && typeof (ctrl.onReady) == "function") {
					ctrl.onReady(api);
				}
			};
			
			
			function addItem (data, promises){
				var item = {
					id: data.id,
					image: data.image
				}
				
				loadImageDisplayer(item, promises);
				
				$scope.scopeModel.results.push(item);
			}
			
			function loadImageDisplayer(item, promises){
				item.resultDisplayerReady = UtilsService.createPromiseDeferred();
				
				item.onResultDisplayerReady = function(api){
					item.resultdisplayerAPI = api;
					item.resultDisplayerReady.resolve();
				};
				
				item.resultDisplayerReady.promise.then(function(){
					
					var payload = {
						image:item.image,
						id: item.id
					};
					
					var promise = item.resultdisplayerAPI.load(payload);
					
					if(promises != undefined){
						promises.push(promise);
					}
				});
			}
		};

		return directiveDefinitionObject;
	}]);
