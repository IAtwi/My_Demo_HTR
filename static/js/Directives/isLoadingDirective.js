'use strict';
app.directive('isLoading', function() {
	return {
		restrict: 'A',
		scope: {
			isLoading: '='
		},
		compile: function(element) {
			element.css('position', 'relative');
			element.css('opacity', 1);
			// element.append('<div class="loading-spinner"></div>');

			return function(scope, element) {
				scope.$watch('isLoading', function(newVal) {
					if (newVal) {
						element.css('opacity', 0.5);
						element.addClass('loading');
					} else {
						element.css('opacity', 1);
						element.removeClass('loading');
					}
				});
			};
		}
	};
});