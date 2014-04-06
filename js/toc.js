var autocollapse = true;

var setNavHeight = function() {
	var topOffset = Math.max(
			$('div.aside-container').next().get(0).getBoundingClientRect().top,
			$('div.affix').height()
		) + 2 * parseInt($('nav').css('padding-top'));

	$('nav.toq').height($(window).height() - topOffset);
};

var setupNav = function()
{
	var nav             = $('nav')
	  , ol              = $('nav ol ol').first().addClass('nav');

	nav.find('ol').first().replaceWith(ol);
	nav.wrap('<div class="col-lg-3 col-md-4 col-sm-5 col-xs-1 aside-container"><div class="aside affix" data-spy="affix">');

	// Remove title and version headings from table of contents.
	nav.find('li').first().remove();
	nav.find('li').first().remove();

	// Insert the nav inside the content div, but before the actual content.
	$('div.row.content').prepend(nav.parent().parent().detach());

	$('div.aside.affix').affix({
		offset: {
			top: function() {
				return $('div.content').offset().top - $('header').height();
			}
		}
	});
};

var expandHeading = function(heading) {
	var ol = $('nav.toq li.toq-level-2 > span + a[href=#' + heading + ']')
		.parent().next().find('ol').first();

	ol.addClass('expanded nocollapse');
};

var expand = function(el)
{
	if (0 < el.length) {
		// Step up through the parent child.
		while (!el.hasClass('nav')) {
			// Show sub items.
			var siblingChild = el.next().children().first();
			if ('OL' === siblingChild.prop('tagName')) {
				siblingChild.addClass('expanded');
				el.addClass('expanded');
			}
			el.parent().prev().addClass('expanded');
			el.parent().addClass('expanded');
			// Select next parent up in the chain.
			el = el.parent();
		}
	}
};

var expandToc = function()
{
	if (autocollapse) {
		$('li.expanded').removeClass('expanded');

		$('nav ol.expanded').not('.nocollapse').each(function() {
			if (!$(this).parent().prev().hasClass('active'))
				$(this).removeClass('expanded');
		});

		// Select deepest active list item.
		expand($('nav li.active.deepest').first());
	}

	$('nav li.active').each(function() {
		if (!$(this).find('li.active').length)
			$(this).addClass('deepest');
	});
};

var insertExpandIcon = function(ol)
{
	if (ol.hasClass('expanded') || ol.parent().hasClass('toq-level-2'))
	{
		//ol.parent().prev().prepend('<a class="collapse" href="#"><i class="icon-minus-squared"></i> </a>');
	}
	else
	{
		ol.parent().prev().find('a').prepend('<i class="icon-plus expand"></i>');
	}
}

jQuery(document).ready(function($)
{
	var scrollSpyOffset = 90
	  , startExpanded   = ['introduction', 'protocol-versions', 'overview', 'commands', 'qtm-rt-packets']
	;

	debouncedOnResize.push(debounce(setNavHeight, 30));

	setupNav();
	setNavHeight();
	expandToc();

	startExpanded.forEach(function(heading) {
		expandHeading(heading);
	});

	$('nav').find('ol').not('.nav').each(function() {
		insertExpandIcon($(this));
	});

	$('nav.toq a').on('click', function(e) {
		expandToc();
		expand($(this).closest('li'));

		var anchor = '#' + $(this).prop('href').split('#')[1];
		$('html, body').prop('scrollTop', $(anchor).offset().top - scrollSpyOffset + 5);
		e.preventDefault();
	});

	$('nav.toq').on('activate.bs.scrollspy', function () {
		expandToc();
	});

	$(window).on('scroll', function() {
		setNavHeight();
	});

	$('body').scrollspy({ offset: scrollSpyOffset });
});

