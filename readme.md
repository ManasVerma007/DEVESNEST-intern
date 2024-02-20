# Scrappy's Ghost

This is a Node.js application that uses Puppeteer to scrape product data from an online marketplace.

## Features

- Search for products by name
- Scrape product details including name, price, rating, reviews, and customer reviews
- Navigate to product pages to scrape customer reviews

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

What things you need to install the software and how to install them:

- Node.js
- npm

### Installing

A step by step series of examples that tell you how to get a development environment running:

1. Clone the repo
2. Install NPM packages: `npm install`
3. Start the server: `npm start`

## Usage

To start using the application, navigate to `http://localhost:3000/` in your browser.

To search for a product, use the `/search/:search_query` endpoint, replacing `:search_query` with your search term.

You can test the API using tools like Postman or Thunder Client. Simply send a GET request to the `/search/:search_query` endpoint.

## Important Note

Upon continuous testing, it has been found that the API requires a good and stable internet connection to function optimally. Please ensure you have a stable connection while using the API.

## Built With

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Puppeteer](https://pptr.dev/)