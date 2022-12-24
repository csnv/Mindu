
# Mindu

Small webserver for the hercules emulator, made with NodeJS and Typescript.

> **Note**
> This project only aims to provide a bare minimun solution for 2019-06+ clients.
For a more functional, feature rich, better security and better performance solution, help funding the real deal here https://board.herc.ws/topic/20151-http-support-in-hercules-funding/


## Requisites

- Nodejs
- csnv's webtoken plugin
- [This PR](https://github.com/HerculesWS/Hercules/pull/3183)

## Installation
- Navigate to the project folder and install any dependencies with `npm install`
- Head to config/webserver.ts and configure your database connection details as well as the port of the webserver and the name/s of the server as it is defined in your client's clientinfo.
- You can now run the server with the following command `npm run start` and you should be seeing this message on your terminal window:
> Webserver running on port 82

## Features
- Emblem upload/download with transparency checks for both BMP and GIF formats.
- User config and char config saving/loading.

## Pending
- Merchant store functionality

## Contributing
- Clone the repo.
- Make some changes.
- Upload to your repo.
- Open a pull request.