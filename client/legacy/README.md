# Wanderly — plain HTML / CSS / JS version

Files:

- `index.html` — home: hero + search, Start chat band, destination grid
- `destinations.html` — all destinations
- `place.html?slug=ladakh` — destination details
- `book.html?slug=ladakh` — booking form
- `chat.html` — AI assistant
- `about.html`, `contact.html`
- `styles.css` — all styling (teal/emerald palette, responsive)
- `data.js` — destination data
- `app.js` — all interactivity (menu, "+" 2-option box, search, booking, chat fetch)
- `assets/` — logo and photos

## Run

Open `index.html` directly, or serve it:

```bash
cd static-site && python3 -m http.server 5500
```

## Connect your backend

In `app.js` change:

```js
const CHAT_ENDPOINT = "/api/chat"; // -> your backend URL
```

It POSTs `{ message, messages }` and accepts `reply` / `message` / `content` JSON or plain text.