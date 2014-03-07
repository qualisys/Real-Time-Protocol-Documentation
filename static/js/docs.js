jQuery(document).ready(function($)
{
	var nav = $('nav');
	var ol = $('nav ol ol').first()
				.addClass('nav');

	nav.find('ol').first().replaceWith(ol);
	nav.wrap('<div class="col-sm-3 col-xs-4 aside-container"><div class="aside affix" data-spy="affix">');

	// Remove title and version headings from table of contents.
	nav.find('li').first().remove();
	nav.find('li').first().remove();

	var prepareAffix = function() {
		$('div.row.content').prepend(nav.parent().parent().detach());
		$('header.affix-wrapper').height($('header div.affix').height());
	};
	prepareAffix();
	
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
				return $('h1').offset().top; //+ $('h1').height() / 5;
			 }
		}
	});

	var debouncedUpdates = debounce(prepareAffix, 85);
	var scrollSpyOffset = 90;

	$('body').scrollspy({ offset: scrollSpyOffset });

	window.onresize = function() {
		debouncedUpdates();
	};

	tocFix();

	$('nav.toq a').on('click', function(e) {
		tocFix();
		var anchor = '#' + $(this).prop('href').split('#')[1];
		$('html, body').prop('scrollTop', $(anchor).offset().top - scrollSpyOffset + 10);
		e.preventDefault();
	});

	$('nav.toq').on('activate.bs.scrollspy', function () {
		tocFix();
	})
});

/**
 * Debounce.
 */
debounce = function(fn, timeout) 
{
	var timeoutID = -1;
	return function() {
		if (timeoutID > -1) {
			window.clearTimeout(timeoutID);
		}
		timeoutID = window.setTimeout(fn, timeout);
	}
};

var autocollapse = true;

function tocFix()
{
	if (autocollapse) {
		$('nav ol.expanded').removeClass('expanded');

		// Select deepest active list item.
		var el = $('nav li.active.deepest').first();
		
		if (0 < el.length) {
			// Step up through the parent child.
			while (!el.hasClass('nav')) {
				// Show sub items.
				var siblingChild = el.next().children().first();
				if ('OL' == siblingChild.prop('tagName'))
					siblingChild.addClass('expanded');
				el.parent().addClass('expanded');
				// Select next parent up in the chain.
				el = el.parent();
			}
		}
	}

	$('nav li.active').each(function(el) {
		var li = $(this);

		if (!$(this).find('li.active').length)
			$(this).addClass('deepest');
	});
}
