import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();
const period1 = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);
yahooFinance.chart('SBIN.NS', { period1, interval: '1mo' })
  .then(res => console.log(res.quotes.length, res.quotes[0]))
  .catch(console.error);
