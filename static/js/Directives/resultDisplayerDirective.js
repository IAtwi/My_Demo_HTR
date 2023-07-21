'use strict';
app.directive('resultDisplayer', ['UtilsService', 'WebAPIService',
    function (UtilsService, WebAPIService) {

        var directiveDefinitionObject = {
			restrict: 'E',
            scope: {
                onReady: '=',
				id: '@'
            },
            controller: function ($scope, $element, $attrs) {
                var ctrl = this;
                var ctor = new Ctor(ctrl, $scope, $attrs);
                ctor.initializeController();
            },
			bindToController: true,
			controllerAs: 'ctrl',
			templateUrl: 'template/resultDisplayerDirectiveTemplate'
        };

        function Ctor(ctrl, $scope, $attrs) {
            this.initializeController = initializeController;
			
			var context;
			var image;
			
			var result;

            function initializeController() {
                $scope.scopeModel = {
					Checked: false,
					disableTextarea: true,
					isLoading: true
				};
				
				$scope.scopeModel.copyResult = function(){
					
					var textBox = document.getElementById(`textarea-${ctrl.id}`);
					
					var text = textBox.value.trim();

					if (text === '') {
					  return;
					}
					
					textBox.select();
					
					var successful = document.execCommand('copy');
					var msg = successful ? 'Text copied to clipboard' : 'Unable to copy text';
					alert(msg);
					
					textBox.blur();
				};
				
				$scope.scopeModel.downloadTxt = function(){
					var text = $scope.scopeModel.resultText;

					if(text == undefined || text == ''){
						return;
					}

					var blob = new Blob([text], { type: 'text/plain' });
					var url = URL.createObjectURL(blob);

					var a = document.createElement('a');
					a.href = url;
					a.download = `${image.name}.txt`;
					a.click();

					URL.revokeObjectURL(url);
					
					alert(`${image.name}.txt Downloaded !`);
				};
				
				$scope.scopeModel.downloadDoc = function(){
					var text = $scope.scopeModel.resultText;

					if(text == undefined || text == ''){
						return;
					}

					var blob = new Blob([text], { type: 'application/msword' });
					var url = window.URL.createObjectURL(blob);
					
					var a = document.createElement('a');
					a.href = url;
					a.download = `${image.name}.doc`;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					
					window.URL.revokeObjectURL(url);
				  
					alert(`${image.name}.doc Downloaded !`);
				};
				
				$scope.scopeModel.checkBoxChanged = function(){
					displayResult();
				};
				
                defineAPI();
            };

            function defineAPI() {
                var api = {};

                api.load = function (payload) {
                    var promises = [];
					
					if(payload != undefined){
						image = payload.image;
						
						if(image != undefined){
							
							$scope.scopeModel.src = image.src;
							$scope.scopeModel.name = image.name;
							
							WebAPIService.recognizeImage(image.name, image.detections)
							.then(function(response) {
								
								result = response.data;
								displayResult();
								
								$scope.scopeModel.disableTextarea = false;
								$scope.scopeModel.isLoading = false;
							});
						}
					}

                    return UtilsService.waitPromiseNode({promises: promises});
                };

                if (ctrl.onReady != null && typeof (ctrl.onReady) == "function"){
                    ctrl.onReady(api);
                }
            }
			
			function displayResult(){
				if(result == undefined)
					return;
				
				$scope.scopeModel.resultText = result.join($scope.scopeModel.Checked ? ' ': '\n');
			}
        }

        return directiveDefinitionObject;
    }]);
