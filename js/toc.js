var autocollapse = true;

jQuery(document).ready(function($)
{
	var nav             = $('nav')
	  , ol              = $('nav ol ol').first().addClass('nav')
	  , scrollSpyOffset = 90
	  , startExpanded   = ['introduction', 'protocol-versions', 'overview', 'commands', 'qtm-rt-packets']
	;

	var setNavHeight = function() {
		var topOffset = Math.max(
				$('div.aside-container').next().get(0).getBoundingClientRect().top,
				$('div.affix').height()
			) + 2 * parseInt($('nav').css('padding-top'));

		$('nav.toq').height($(window).height() - topOffset);
	};

	nav.find('ol').first().replaceWith(ol);
	nav.wrap('<div class="col-lg-3 col-md-4 col-sm-5 col-xs-1 aside-container"><div class="aside affix" data-spy="affix">');

	// Remove title and version headings from table of contents.
	nav.find('li').first().remove();
	nav.find('li').first().remove();

	$('div.row.content').prepend(nav.parent().parent().detach());

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

	debouncedOnResize.push(debounce(setNavHeight, 30));

	$(window).on('scroll', function() {
		setNavHeight();
	});

	setNavHeight();
	expandToc();
	stripOSC();

	startExpanded.forEach(function(heading) {
		expandHeading(heading);
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
	})

	$('body').scrollspy({ offset: scrollSpyOffset });
});

function expandHeading(heading) {
	var ol = $('nav.toq li.toq-level-2 > span + a[href=#' + heading + ']')
		.parent().next().find('ol').first();

	ol.addClass('expanded nocollapse');
}

function expand(el)
{
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


function expandToc()
{
	if (autocollapse) {
		$('nav ol.expanded').not('.nocollapse').each(function() {
			if (!$(this).parent().prev().hasClass('active'))
				$(this).removeClass('expanded');
		});

		// Select deepest active list item.
		expand($('nav li.active.deepest').first());
	}

	$('nav li.active').each(function(el) {
		if (!$(this).find('li.active').length)
			$(this).addClass('deepest');
	});
}

function stripOSC()
{
	$('nav a, h1, h2, h3, h4, h5').each(function() {
		$(this).text($(this).text().replace('(OSC)', ''));
	});
}
