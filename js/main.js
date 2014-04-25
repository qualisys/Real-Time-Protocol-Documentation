var scrollSpyOffset = 90;

var stripOSC = function()
{
	$('nav a, h1, h2, h3, h4, h5').each(function() {
		$(this).text($(this).text().replace(' (OSC)', ''));
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
		var lang  = 'no-highlight'
		  , theClass = $(this).attr('class');

		if (undefined !== theClass) {
			lang = theClass.replace('lang-', '');
		}
		$(this).addClass(lang);

		hljs.highlightBlock(e);
	});

	setupToc();

	$('code.coffeescript span.hljs-keyword:contains(or)').each(function() {
		if ('or' == $(this).text())
			$(this).addClass('highlight-or');
	});

	$('div.body a').on('click', function(e) {
		var href = $(this).prop('href').split('#');
			console.log($(this));

		if (1 < href.length) {
			var anchor = '#' + href[1];
			$('html, body').prop('scrollTop', $(anchor).offset().top - scrollSpyOffset + 5);

			// Overwrite current entry in history to store the scroll position:
			var stateData = {
				path: window.location.href,
				scrollTop: $(window).scrollTop(),
			};
			window.history.pushState(stateData, $(document).find("title").text(), href[0] + anchor);

			e.preventDefault();
		}
	});

});

