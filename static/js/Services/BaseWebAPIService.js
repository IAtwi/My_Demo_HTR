'use strict';
(function (app) {
    BaseWebAPIService.$inject = ['$http'];

    function BaseWebAPIService($http) {
        
		function post(url, data, contentType= 'application/json', transformRequest= undefined){
			var payload = {
				method: 'POST',
				url: url,
				data: data,
				headers: {
					'Content-Type': contentType != '' ? contentType : undefined
				}
			};
			
			if(transformRequest != undefined){
				payload.transformRequest = transformRequest;
			}
			
			return $http(payload);
		}		

        return {
            post: post
        };
    }
    app.service('BaseWebAPIService', BaseWebAPIService);
})(app);