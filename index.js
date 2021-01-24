const express = require("express");
const fetch = require("node-fetch");
const redis = require("redis");

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

app.get("/repos/:username", cache, getRepos);

function setResponse(username, repos) {
  return `<h2>${username} has ${repos} Github repos</h2>`;
}

//make request to github for data
async function getRepos(req, res, next) {
  try {
    console.log("Fetching data...");
    const { username } = req.params;
    const response = await fetch(`https://api.github.com/users/${username}`);
    const data = await response.json();

    const repos = data.public_repos;

    //set to redis
    client.setex(username, 3600, repos);
    res.send(setResponse(username, repos));
  } catch (err) {
    console.error(err);
    res.status(500);
  }
}

//cache middleware
function cache(req, res, next) {
  const { username } = req.params;
  client.get(username, (err, data) => {
    if (err) throw err;

    if (data) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  });
}

app.listen(5000, () => {
  console.log(`App listening on port ${PORT}`);
});
