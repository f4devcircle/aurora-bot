# Aurora Bot (JKTbot)
Line bot serving app that helps you to find out JKT48 show schedule and get notified to which you subscribed (your loved member or setlist itself) through this [API](https://github.com/f4devcircle/jeketi-server) using [line bot node SDK](https://line.github.io/line-bot-sdk-nodejs/) and built with [Express](https://expressjs.com/).

## Prerequisites
* [Node JS, indeed!](https://nodejs.org/en/)
* [Google Cloud service subscription (Datastore)](https://cloud.google.com/datastore/)

## Installation
Clone this repository and install all dependencies
```bash
# clone this repository
git clone https://github.com/f4devcircle/aurora-bot.git
# install all dependencies
yarn install
```

Copy the .env template file from ```.env.example```, fill it up with your own environment config. ```LINE_TOKEN``` for your line token and ```API_URL``` for your scrapper api url, which is [this project's](https://github.com/f4devcircle/jeketi-server) url.

Because we use Google Datastore to store our data (setlists, shows and members), you have to put your Google Cloud config json file in ```googlekey.json```.

Last but not least, start your server file in ```bin\www``` with node, nodemon, or pm2, it's up to you. And voila, your bot serving app is running!

## Did i miss something?
In the way to make sure your line bot is runinng as what it should do, you have to complete your own bot registration thorugh Line Bot Service web. Find out more about how to start your own line bot [here](https://developers.line.me/en/docs/messaging-api/overview/).

## Join the club!
Check out more at [@f4devcircle](https://twitter.com/f4devcircle).
