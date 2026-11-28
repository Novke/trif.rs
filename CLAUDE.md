# trif.rs (3F Solutions)

Statičan sajt bez build koraka. Push na `main` ga GitHub Actions (`.github/workflows/deploy.yml`) rsync-uje na produkciju.

## Dva jezika

- `index.html` je engleska verzija i podrazumevana (`https://trif.rs/`).
- `sr/index.html` je srpska verzija (`https://trif.rs/sr/`); putanje do `assets/` i `resources/` počinju sa `../`.
- **Svaka izmena markup-a ide u oba fajla.** Struktura, klase i `id`-jevi sekcija (`#usluge`, `#tim`, `#kontakt`...) su isti u obe verzije, razlikuje se samo tekst.
- Automatski izbor: inline skripta na vrhu `<head>` u `index.html` šalje na `sr/` (uz isti `#hash`) posetioce čija je vremenska zona `Europe/Belgrade` ili kojima je srpski prvi jezik pregledača. Prekidač EN/SR (nav, meni, futer; `data-lang`) pamti izbor u `localStorage['3f-lang']`, a zapamćen izbor ima prednost. `sr/` nikad ne preusmerava.
- Novi HTML fajl u novom folderu: dodaj ga u `sed` za cache-bust u `deploy.yml`.
