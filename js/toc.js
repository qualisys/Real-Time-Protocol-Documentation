var autocollapse = true;

var setNavHeight = function() {
	var topOffset = Math.max(
			$('div.aside-container').next().get(0).getBoundingClientRect().top,
			$('header div.affix').height()
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
	nav.append('<p><a class="expand-all" href="#">Expand all</a></p>');
	
	nav.find('a.expand-all').on('click', function(e) {
		var a = $(this);

		if (a.hasClass('expand-all'))
		{
			a.text('Close all');
			$('nav li ol').each(function() {
				expand($(this), false);
			});
		}
		else
		{
			a.text('Expand all');
			$('nav li ol').each(function() {
				collapse($(this), false);
			});
			$('nav li i.expand').each(function() {
				$(this).removeClass('icon-minus');
				$(this).addClass('icon-plus');
			});

		}

		a.toggleClass('expand-all');
		a.toggleClass('collapse-all');

		e.preventDefault();
	});

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

var expandUp = function(el, autocollapse)
{
	if (undefined === autocollapse)
		autocollapse = true;
	
	if (0 < el.length) {
		// Step up through the parent chain.
		while (!el.hasClass('nav')) {
			expand(el);
			el = el.parent();
		}
	}
};
var expand = function(el, autocollapse)
{
	if (undefined == autocollapse)
		autocollapse = true;

	var ol, li;

	if ('OL' === el.prop('tagName'))
	{
		li = el.parent().prev().first();
		ol = el;
	}
	else
	{
		if (0 == el.find('ol').length)
			li = el;

		ol = el.next().find('ol').first();
	}

	if (li) {
		var icon = li.find('i.expand').first();

		li.addClass('expanded');

		if (!autocollapse) {
			li.addClass('nocollapse');
		}

		icon.removeClass('icon-plus');
		icon.addClass('icon-minus');
	}

	ol.addClass('expanded');

	if (!autocollapse) {
		ol.addClass('nocollapse');
	}
		
}

var collapse = function(el, autocollapse)
{
	if (undefined == autocollapse)
		autocollapse = true;

	var ol   = el.next().find('ol').first();
	var icon = el.find('i.expand').first();

	if (!autocollapse) {
		el.removeClass('nocollapse');
		ol.removeClass('nocollapse');
	}

	if (!ol.hasClass('nocollapse')) {
		ol.removeClass('expanded');
	}

	if (!el.hasClass('nocollapse')) {
		icon.removeClass('icon-minus');
		icon.addClass('icon-plus');
		el.removeClass('expanded');
	}
}

var expandToc = function()
{
	var li;

	if (autocollapse)
	{
		$('nav li.expanded').each(function() {
			collapse($(this));
		});

		// Select deepest active list item.
		expandUp($('nav li.active.deepest').first(), autocollapse);
		expand($('nav li.active').next().find('ol').first(), autocollapse);
	}

	$('nav li.active').each(function() {
		if (!$(this).find('li.active').length)
			$(this).addClass('deepest');
	});
};

var insertExpandIcon = function(ol)
{
	if (!(ol.hasClass('expanded') || ol.parent().hasClass('toq-level-2')))
	{
		ol.parent().prev().find('a').prepend('<i class="icon-plus expand"></i>');
	}
}

var setupToc = function()
{
	var startExpanded = ['introduction', 'overview', 'commands', 'qtm-rt-packets'];

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

	$('nav.toq li a').on('click', function(e) {
		expandToc();
		expand($(this).closest('li').next().find('ol').first());

		var anchor = '#' + $(this).prop('href').split('#')[1];
		$('html, body').prop('scrollTop', $(anchor).offset().top - scrollSpyOffset + 5);
		e.preventDefault();
	});

	$('nav.toq a i').on('click', function(e) {
		var li = $(this).closest('li');

		if (li.hasClass('expanded'))
		{
			collapse(li, false);
		}
		else
		{
			expand(li, false);
			li.addClass('nocollapse');
		}

		e.preventDefault();
		e.stopPropagation();
	});

	$('nav.toq').on('activate.bs.scrollspy', function () {
		expandToc();
	});

	$(window).on('scroll', function() {
		setNavHeight();
	});

	$('body').scrollspy({ offset: scrollSpyOffset });
};
