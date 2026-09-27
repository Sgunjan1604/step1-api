# Step 1 — Plain API (no Docker yet)

This is just the CRUD API from the plan: Express + MongoDB. Nothing is
Dockerized yet — that's what you'll do next, by hand, following the plan.

## What's here

```
step1-api/
├── package.json
├── .gitignore
└── src
    ├── server.js       # Express app + routes
    └── itemModel.js    # Mongoose schema
```

No `Dockerfile`, no `docker-compose.yml`, no Redis. On purpose.

## Run it right now (before touching Docker)

1. Run MongoDB as a container, exactly like Hour 1 says:
   ```bash
   docker run -d -p 27017:27017 --name mongo mongo
   docker ps
   ```
2. Install deps and start the API normally on your host machine (not
   containerized yet):
   ```bash
   npm install
   npm start
   ```
3. Test in Postman:
   - `GET http://localhost:3000/health`
   - `POST http://localhost:3000/items` with a JSON body like
     `{ "name": "Keyboard", "price": 49.99 }`
   - `GET http://localhost:3000/items`

If that works, Hour 1 + your Postman skills are confirmed working.

## Your next steps (don't skip ahead)

- **Hour 2:** write your own `Dockerfile` in this folder. Hints from the
  plan: `WORKDIR`, `COPY package*.json`, install, `COPY` the rest,
  `EXPOSE 3000`, `CMD`. Build with `docker build -t my-api .` and run with
  `docker run -p 3000:3000 my-api` — then figure out why it can't reach
  Mongo yet (hint: `localhost` inside a container isn't what you think).
- **Hour 3:** write your own `docker-compose.yml` with two services
  (`api`, `mongo`) and a named volume for Mongo's data.
- **Hour 4:** re-test everything in Postman against the Dockerized stack.
- **Part 2:** add a `redis` service to compose, add the `ioredis` package,
  and wrap `GET /items` in a cache-aside pattern with a TTL.

Come back and ask me to check your Dockerfile / compose file / Redis code
at each step, or ask for a hint if you get stuck — you don't need the full
answer handed to you again.
