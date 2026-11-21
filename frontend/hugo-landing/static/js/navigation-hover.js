(function ($) {
    const links = document.querySelectorAll('#navbar .navbar-nav > li > a, #navbar .navbar-nav > li > .dropdown-menu > li > a');
    links.forEach(function (link) {
        const text = Array.from(link.childNodes).find(function (node) {
            return node.nodeType === Node.TEXT_NODE && node.textContent.trim();
        });
        if (!text) return;

        const label = document.createElement('span');
        label.className = 'nav-hover-label';
        text.before(label);
        label.append(text);
    });

    if (!$ || !$.fn.dropdown) return;

    const desktopHover = window.matchMedia('(min-width: 768px) and (any-hover: hover)');
    const dropdowns = document.querySelectorAll('#navbar .navbar-nav > .dropdown');

    dropdowns.forEach(function (dropdown) {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        if (!toggle || !menu) return;

        const $toggle = $(toggle);
        let openedByHover = false;

        $(dropdown).on('hidden.bs.dropdown', function () {
            openedByHover = false;
        });

        dropdown.addEventListener('pointerenter', function (event) {
            if (event.pointerType !== 'mouse' || !desktopHover.matches || dropdown.classList.contains('open')) return;

            const previousFocus = document.activeElement;
            $toggle.dropdown('toggle');
            openedByHover = dropdown.classList.contains('open');

            // Bootstrap focuses the toggle on open. Keep the user's keyboard position during hover.
            if (document.activeElement !== toggle || previousFocus === toggle) return;
            if (previousFocus === document.body) {
                toggle.blur();
            } else {
                previousFocus.focus();
            }
        });

        dropdown.addEventListener('pointerleave', function (event) {
            if (event.pointerType !== 'mouse' || !openedByHover || menu.contains(document.activeElement)) return;
            $toggle.dropdown('toggle');
        });

        dropdown.addEventListener('focusout', function (event) {
            if (!openedByHover || dropdown.matches(':hover') || dropdown.contains(event.relatedTarget)) return;
            $toggle.dropdown('toggle');
        });
    });
})(window.jQuery);
