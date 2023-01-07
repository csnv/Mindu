
# Mindu

Small webserver for the hercules emulator, made with NodeJS and Typescript.

> **Note**
>
> This project only aims to provide a bare minimun solution for 2019-06+ clients.
For a more functional, feature rich, better security and better performance solution, help funding the real deal here https://board.herc.ws/topic/20151-http-support-in-hercules-funding/


## Requisites

- Nodejs version >= 14
- [csnv's webtoken plugin](https://github.com/csnv/webtoken)

## Installation
- Navigate to the project folder and install any dependencies with `npm install`
- Head to config/webserver.ts and configure your database connection details as well as the port of the webserver and the name/s of the server as it is defined in your configuration.
- Build the app with `npm run build`
- You can now run the server with the following command `npm run start` and you should be seeing this message on your terminal window:
> Webserver running on port 8082

## Features
- Token authentication.
- Emblem upload/download with transparency checks for both BMP and GIF formats.
- User config and char config saving/loading.
- Merchant store functionality.

## Contributing
- Clone the repo.
- Make some changes.
- Upload to your repo.
- Open a pull request.

## Ideas, suggestions, bugs...
Please use the issues tab here in Github, your feedback is appreciated!
