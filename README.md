# Smaznov portfolio

Портфолио по Figma: четыре статические страницы, общий шаблон, навигация и адаптивные стили. Eleventy и Nunjucks собирают сайт; браузерный JavaScript управляет переходами между страницами, загрузкой изображений и кнопкой возврата наверх.

## Запуск

Нужны Node.js 20+ и npm. В папке `smaznov-portfolio`:

```sh
npm ci
npm run dev
```

Откройте адрес, напечатанный Eleventy в терминале (по умолчанию `http://localhost:8080`). Остановка — `Ctrl+C`.

```sh
npm run build
```

Сборка создаёт `_site/`: `index.html`, `cases/index.html`, `resume/index.html`, `education/index.html` и общие ресурсы. Папка генерируется автоматически: не редактируйте её вручную. Для просмотра нужен HTTP-сервер, поскольку ссылки начинаются от корня сайта.

## Структура

```text
src/
  _data/
    navigation.json
    cases.json
    resume.json
    education.json
  _includes/
    layout.njk
    navigation.njk
    footer.njk
  index.njk
  cases.njk
  resume.njk
  education.njk
  assets/
    css/
      tokens.css
      styles.css
    js/
      site.js
      scroll-menu.js
    fonts/
      dm-sans-variable.ttf
      OFL.txt
    images/
      portrait.png
      case-placeholder.png
      practicum.svg
      bureau.svg
      msuiecs.svg
docs/design-notes.md
eleventy.config.js
package.json
package-lock.json
```

## Где редактировать

| Изменение | Файл |
| --- | --- |
| Тексты кейсов | `src/_data/cases.json` |
| Опыт и списки обязанностей | `src/_data/resume.json` |
| Образование | `src/_data/education.json` |
| Пункты меню | `src/_data/navigation.json` |
| Общий каркас, бренд, заголовок и слоган Main | `src/_includes/layout.njk` |
| Разметка навигации и текущий пункт | `src/_includes/navigation.njk` |
| Разметка футера для экранов до 1080 px | `src/_includes/footer.njk` |
| Разметка содержимого страницы, title и description | `src/*.njk` |
| Цвета, типографика, повторяющиеся размеры | `src/assets/css/tokens.css` |
| BEM-классы, сетка, состояния, адаптивность | `src/assets/css/styles.css` |
| Появление меню при прокрутке и возврат наверх | `src/assets/js/scroll-menu.js` |
| Переходы между страницами и загрузка изображений | `src/assets/js/site.js` |
| Изображения | `src/assets/images/` |

Nunjucks перебирает записи JSON через `{% for %}`. `pageKey` в начале страницы определяет активный пункт; `layout` подключает общий шаблон. На Main переход ведёт через бренд `Smaznov.`; в меню три остальных назначения, как в макете.

На ширинах до 1080 px после ухода заголовка за верх экрана появляется кнопка с фото и названием раздела. Она возвращает к началу страницы. Анимация отключается при системной настройке уменьшения движения.

Шрифт DM Sans хранится локально, лицензия — `src/assets/fonts/OFL.txt`. Для работы сайта не нужны внешние запросы к шрифтовому сервису.

## Публикация

Сайт опубликован по адресу <https://smaznov.design/> из репозитория <https://github.com/torovfritz/smaznov-portfolio>. Отправка изменений в `main` запускает [GitHub Actions](.github/workflows/pages.yml): workflow выполняет `npm ci`, затем `npm run build` и публикует `_site/` на GitHub Pages.

Сайт размещён в корне домена. Не добавляйте `--pathprefix=/smaznov-portfolio/` в команду сборки: такой префикс направит ссылки на разделы, стили и скрипты по неверному пути. `node_modules/`, `_site/`, временные проверки и `.env` исключены из Git.

Проверки, источники Figma, placeholders, отличия и вопросы доступности описаны в [design-notes.md](docs/design-notes.md).
