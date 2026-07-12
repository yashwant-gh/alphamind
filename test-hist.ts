import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();
yahooFinance.historical('RELIANCE.NS', { period1: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000), interval: '1mo' })
  .then(res => console.log(res.length, res[0]))
  .catch(console.error);
