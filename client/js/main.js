var scrollSpyOffset = 90;

var stripToc = function(str)
{
	$('nav a').each(function() {
		$(this).text($(this).text().replace(str, ''));
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

	stripToc(' (OSC)');
	stripToc(' (Telnet)');

	// Apply syntax highlighting.
	$('pre code').each(function(i, e) {
		var lang  = 'no-highlight'
		  , theClass = $(this).attr('class');

		if (undefined !== theClass) {
			lang = theClass.replace('lang-', '');
		}
		$(this).addClass(lang);

		hljs.highlightBlock(e);
	});

	// Highlight the word 'or' in coffeescript-highlighted code.
	$('code.coffeescript span.hljs-keyword:contains(or)').each(function() {
		if ('or' == $(this).text())
			$(this).addClass('highlight-or');
	});

	
	// Handle scroll and history of internal #-links.
	$('div.body a').on('click', function(e) {
		var href = $(this).prop('href').split('#');

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

	setupToc();

});

