'use strict';

var debouncedOnResize = [];

var debounce = function(fn, timeout) 
{
	var timeoutID = -1;
	return function() {
		if (timeoutID > -1) {
			window.clearTimeout(timeoutID);
		}
		timeoutID = window.setTimeout(fn, timeout);
	};
};

jQuery(document).ready(function($)
{
	window.onresize = function() {
		debouncedOnResize.forEach(function(fun) {
			fun();
		});
	};
});
