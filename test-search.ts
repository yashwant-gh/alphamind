import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();
yahooFinance.search('sbin').then(res => console.log(res.quotes.map(q => q.symbol + ' | ' + q.shortname + ' | ' + q.quoteType)));
