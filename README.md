# PTT IP Index

Free, local-first PTT public source IP indexing prototype.

This project does not depend on Plytic data. GitHub Actions runs a small scheduled crawler, stores the generated index in `data/ip-index.json`, and the web prototype can use that index to show shared-IP clues.

## Free Architecture

- GitHub public repository: hosts code and scheduled Actions.
- GitHub Actions: crawls a small batch of seed users every 6 hours.
- JSON index: stores `IP -> user IDs` and `user ID -> IPs` evidence.
- Web prototype: local UI for testing search and source IP analysis.

## Local Commands

```bash
npm test
npm run index:users
npm run serve
```

Open:

```text
http://127.0.0.1:5179
```

## Seed Users

Edit `data/seed-users.json` to decide which PTT IDs the free crawler should index.

## Limits

This free version builds the index gradually. It will not instantly cover all PTT users. Shared IP is only a clue and does not prove two accounts belong to the same person.
