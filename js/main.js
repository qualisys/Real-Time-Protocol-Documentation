var debouncedOnResize = [];

jQuery(document).ready(function($)
{
	$('header.affix-wrapper').height($('header div.affix').height());

	$('div.aside.affix').affix({
		offset: {
			top: function() {
				return $('div.content').offset().top - $('header').height();
			}
		}
	});

	$('header div.affix').affix({
		offset: {
			top: function() {
				return $('h1').offset().top;
			}
		}
	});

	$('pre code').each(function(i, e) {
		var lang = $(this).attr('class').replace('lang-', '');

		$(this).addClass(lang);
		hljs.highlightBlock(e)
	});

	window.onresize = function() {
		debouncedOnResize.forEach(function(fun) {
			fun();
		});
	};

});

