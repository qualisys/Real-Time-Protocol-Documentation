
var stripOSC = function()
{
	$('nav a, h1, h2, h3, h4, h5').each(function() {
		$(this).text($(this).text().replace('(OSC)', ''));
	});
};

jQuery(document).ready(function($)
{
	$('header div.affix').affix({
		offset: {
			top: function() {
				return $('h1').offset().top;
			 }
		}
	});

	stripOSC();

	$('pre code').each(function(i, e) {
		var lang = $(this).attr('class').replace('lang-', '');

		$(this).addClass(lang);
		hljs.highlightBlock(e);
	});

});

