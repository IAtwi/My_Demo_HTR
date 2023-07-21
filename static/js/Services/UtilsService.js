'use strict';
(function (app) {
    UtilsService.$inject = ['$q'];
    function UtilsService($q) {
        "use strict";
		
		function getItemIndexByVal(array, value, attname) {
            for (var i = 0; i < array.length; i++) {
                if (eval('array[' + i + '].' + attname) == value) {
                    return i;
                }
            }
            return -1;
        }
		
		function getItemByVal(array, value, attname) {
            for (var i = 0; i < array.length; i++) {
                if (eval('array[' + i + '].' + attname) == value) {
                    return array[i];
                }
            }
            return null;
        }

		function waitPromiseNode(promiseNode) {
			var resultPromiseDeferred = createPromiseDeferred();
			waitMultiplePromises(promiseNode.promises).then(function () {
				if (promiseNode.getChildNode != undefined && typeof (promiseNode.getChildNode) == 'function') {
					var childNodePromise = waitPromiseNode(promiseNode.getChildNode());
					linkExistingPromiseToPromiseDeferred(childNodePromise, resultPromiseDeferred);
				}
				else {
					resultPromiseDeferred.resolve();
				}
			}).catch(function (error) {
				resultPromiseDeferred.reject(error);
			});
			return resultPromiseDeferred.promise;
		}

		function createPromiseDeferred(promiseName) {
			return new PromiseClass(promiseName);
		}
		
		function callDirectiveLoad(directiveAPI, directiveLoadPayload, loadPromiseDeferred) {
            convertToPromiseIfUndefined(directiveAPI.load(directiveLoadPayload)).then(function (response) {
                if (loadPromiseDeferred != undefined)
                    loadPromiseDeferred.resolve(response);
            }).catch(function (error) {
                if (loadPromiseDeferred != undefined)
                    loadPromiseDeferred.reject(error);
            });
        }
		
		function guid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        }
		
		
		
		function waitMultiplePromises(promises) {
            var deferred = createPromiseDeferred();
            var pendingPromises = promises.length;
            var isRejected = false;
            if (pendingPromises == 0)
                deferred.resolve();
            angular.forEach(promises, function (promise) {
                promise && promise.then(function () {
                    if (isRejected)
                        return;
                    pendingPromises--;

                    if (pendingPromises == 0)
                        deferred.resolve();
                }).catch(function (error) {
                    deferred.reject(error);
                    isRejected = true;
                });
            });
            return deferred.promise;
        }
		
		function PromiseClass(promiseName) {
            var deferred = $q.defer();
			
            this.promise = deferred.promise;
            this.resolve = deferred.resolve;
            this.reject = deferred.reject;
        }
		
		function linkExistingPromiseToPromiseDeferred(existingPromise, promiseDeferred) {
            existingPromise
                .then(function (response) {
                    promiseDeferred.resolve(response);
                })
                .catch(function (error) {
                    promiseDeferred.reject(error);
                });
        }
		
		function convertToPromiseIfUndefined(promiseOrUndefined) {
            if (promiseOrUndefined != undefined)
                return promiseOrUndefined;
            else {//if value is undefined, create promise and resolve it
                var promiseDeferred = createPromiseDeferred();
                promiseDeferred.resolve();
                return promiseDeferred.promise;
            }
        }
		

		return {
			createPromiseDeferred: createPromiseDeferred,
			waitPromiseNode: waitPromiseNode,
			getItemIndexByVal: getItemIndexByVal,
			getItemByVal: getItemByVal,
			callDirectiveLoad: callDirectiveLoad,
			guid: guid
		};
	}

    app.service('UtilsService', UtilsService);
})(app);