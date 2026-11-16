# Smaznov portfolio

Первый локальный этап портфолио по Figma: `Untitled` → `Page 3`. Четыре статические страницы, общий шаблон, навигация и адаптивные стили. Eleventy и Nunjucks используются только для сборки; JavaScript в итоговых страницах отсутствует.

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
  index.njk
  cases.njk
  resume.njk
  education.njk
  assets/
    css/
      tokens.css
      styles.css
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
| Разметка содержимого страницы, title и description | `src/*.njk` |
| Цвета, типографика, повторяющиеся размеры | `src/assets/css/tokens.css` |
| BEM-классы, сетка, состояния, адаптивность | `src/assets/css/styles.css` |
| Изображения | `src/assets/images/` |

Nunjucks перебирает записи JSON через `{% for %}`. `pageKey` в начале страницы определяет активный пункт; `layout` подключает общий шаблон. На Main переход ведёт через бренд `Smaznov.`; в меню три остальных назначения, как в макете.

Шрифт DM Sans хранится локально, лицензия — `src/assets/fonts/OFL.txt`. Для работы сайта не нужны внешние запросы к шрифтовому сервису.

## Границы этапа

Репозиторий создан приватным: <https://github.com/torovfritz/smaznov-portfolio>. Коммиты сохранены только локально. Push, деплой и хостинг не выполнялись. `node_modules/`, `_site/`, временные проверки и `.env` исключены из Git.

Проверки, источники Figma, placeholders, отличия и вопросы доступности описаны в [design-notes.md](docs/design-notes.md).
