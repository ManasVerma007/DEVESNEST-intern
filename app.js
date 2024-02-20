const express = require("express");
const puppeteer = require("puppeteer");
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs")
app.set("views", path.resolve("./views")) 

app.get("/", (req, res) => {
  res.render("home")
});

app.get("/search/:search_query", async (req, res) => {
  try {
    const searchPhrase = req.params.search_query;

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    const homeUrl = "https://www.amazon.in/";
    await page.goto(homeUrl);

    await page.waitForSelector("#twotabsearchtextbox");
    await page.type("#twotabsearchtextbox", searchPhrase, { delay: 100 });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await page.click("#nav-search-submit-button");

    await new Promise((resolve) => setTimeout(resolve, 2000));
    await page.waitForSelector(".s-widget-container");

    const url = page.url();

    const cardData = [];

    async function scrapePage(url) {
      console.log("Scraping page...");
      await page.goto(url);

      await new Promise((resolve) => setTimeout(resolve, 2000));
      await page.waitForSelector(".s-widget-container");

      const pageCardData = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll(".s-result-item"));

        const cardInfo = cards
          .map((card) => {

            const productNameElement = card.querySelector(
              "a.a-link-normal.s-underline-text.s-underline-link-text.s-link-style.a-text-normal > span.a-size-base-plus.a-color-base.a-text-normal"
            );
            const productName = productNameElement
              ? productNameElement.textContent.trim()
              : "N/A";
            const priceElement = card.querySelector(".a-price .a-offscreen");
            const price = priceElement ? priceElement.textContent : "N/A";
            const ratingElement = card.querySelector(
              ".a-row > span:nth-child(1)[aria-label]"
            );
            const rating = ratingElement
              ? ratingElement.getAttribute("aria-label")
              : "N/A";
            const reviewsElement = card.querySelector(
              "a.a-link-normal.s-underline-text.s-underline-link-text.s-link-style > span.a-size-base.s-underline-text"
            );
            const reviews = reviewsElement
              ? reviewsElement.textContent.trim()
              : "N/A";
            const urlElement = card.querySelector(".s-no-outline");
            const url = urlElement ? urlElement.href : "N/A";

            if (productName) {
              return {
                productName,
                price,
                rating,
                reviews,
                url,
              };
            } else {
              return null;
            }
          })
          .filter((card) => card !== null);

        return cardInfo;
      });

      cardData.push(
        ...pageCardData.filter(
          (card) =>
            !(
              card.productName === "N/A" ||
              card.price === "N/A" ||
              card.rating === "N/A" ||
              card.reviews === "N/A" ||
              card.url === "N/A"
            )
        )
      );

      console.log(cardData.slice(0, 4));

      for (let i = 0; i < 4; i++) {
        const productPage = await browser.newPage();
        console.log(cardData[i].url);
        await productPage.goto(cardData[i].url);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        console.log(`Scraping product ${i + 1}...`);

        try {

          await productPage.waitForSelector(
            '[data-hook="see-all-reviews-link-foot"]'
          );
          console.log("Clicking 'See more reviews' button...");
          await productPage.click('[data-hook="see-all-reviews-link-foot"]');
          console.log("Waiting for reviews to load...");

          console.log("Reviews loaded.");
          await new Promise((resolve) => setTimeout(resolve, 1000));

          await productPage.waitForSelector(
            ".a-size-base.review-text.review-text-content",
            { timeout: 4000 }
          );

          const Custreviews = await productPage.evaluate(() => {
            const formatReview = (review) => {

                let cleanedReview = review;
                let prevReview = "";
                while (cleanedReview !== prevReview) {
                    prevReview = cleanedReview;
                    cleanedReview = cleanedReview.replace(/{[^{}]*}/g, "");
                }
        
                cleanedReview = cleanedReview
                    .replace(/\s\s+/g, " ")
                    .replace(/\n/g, " ")
                    .replace(/,/g, " ");
        
                return cleanedReview;
            };
        
            return Array.from(
                document.querySelectorAll(
                    ".a-size-base.review-text.review-text-content"
                ),
                (span) => formatReview(span.textContent.trim())
            );
        });

          cardData[i].Custreviews = Custreviews;
        } catch (error) {
          console.error(
            `Failed to scrape Customer Reviews for product ${
              i + 1
            } due to ${error}`
          );
          cardData[i].Custreviews = [];
          continue;
        }

        await productPage.close();
      }
    }
    await scrapePage(url);
    console.log("Scraping finished.");

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await browser.close();
    console.log("Browser closed.");

    res.json(cardData.slice(0, 4));
  } catch (error) {

    console.error(`Failed to scrape data due to ${error}`);
    res.status(500).json({ error: "Failed to scrape data" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

module.exports = app;