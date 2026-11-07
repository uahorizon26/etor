(function () {
    'use strict';

    // Плагін для Lampa:
    // 1) вмикає розділ торрентів (TorrServer і Парсер)
    // 2) додає кнопку «Торенти» в основний ряд кнопок на картці

    var DEBUG = false; // постав true тільки для відлагодження

    function note(text, time) {
        if (!DEBUG) return;
        try { Lampa.Noty.show(text, { time: time || 3000 }); } catch (e) {}
    }

    function apply() {
        if (!window.lampa_settings) window.lampa_settings = {};
        window.lampa_settings.torrents_use = true;
        window.lampa_settings.demo = false;
        window.lampa_settings.read_only = false;
    }

    apply();

    var ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></svg>';

    function openTorrents(movie) {
        Lampa.Activity.push({
            url: '',
            title: Lampa.Lang.translate('title_torrents') || 'Торенти',
            component: 'torrents',
            search_one: movie.title || movie.name,
            search_two: movie.original_title || movie.original_name,
            movie: movie,
            page: 1
        });
    }

    function findRow(render) {
        // шукаємо батька основних кнопок
        var any = render.find('.button--play, .button--book, .button--options, .full-start__button').first();
        return any.length ? any.parent() : $();
    }

    function place(render, movie) {
        if (render.find('.etor--btn').length) return true;

        var row = findRow(render);
        if (!row.length) return false;

        var btn = $(
            '<div class="full-start__button selector etor--btn">' +
                ICON +
                '<span>' + (Lampa.Lang.translate('title_torrents') || 'Торенти') + '</span>' +
            '</div>'
        );

        btn.on('hover:enter', function () {
            openTorrents(movie);
        });

        // Ставимо перед закладкою, якщо вона є, інакше після другої кнопки
        var book = row.children('.button--book').first();
        if (book.length) {
            book.before(btn);
        } else {
            var kids = row.children('.full-start__button, .selector');
            if (kids.length > 1) {
                kids.eq(1).after(btn);
            } else {
                row.append(btn);
            }
        }

        try {
            Lampa.Controller.toggle(Lampa.Controller.enabled().name);
        } catch (e) {}

        return true;
    }

    function addButton(e) {
        var movie = e.data && e.data.movie;
        if (!movie) return;

        var render = e.object.activity.render();
        var tries = 0;

        (function attempt() {
            var ok = false;
            try {
                ok = place(render, movie);
            } catch (err) {
                if (DEBUG) note('Etor помилка: ' + err.message, 8000);
            }

            tries++;
            if (!ok && tries < 12) {
                setTimeout(attempt, 250);
            } else if (DEBUG) {
                note(ok ? 'Etor: кнопку додано' : 'Etor: кнопку НЕ додано', 4000);
            }
        })();
    }

    var started = false;

    function start() {
        if (started) return;
        started = true;

        apply();

        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite' || e.type === 'complete') {
                addButton(e);
            }
        });

        if (DEBUG) {
            setTimeout(function () {
                note('Etor v4.1 завантажено', 3000);
            }, 3500);
        }
    }

    function boot() {
        if (window.Lampa && Lampa.Listener && Lampa.Activity && window.$) {
            start();
            return true;
        }
        return false;
    }

    if (!boot()) {
        var timer = setInterval(function () {
            if (boot()) clearInterval(timer);
        }, 300);
    }
})();
