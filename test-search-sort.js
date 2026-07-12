const q = 'sbin';
const quotes = [
  { symbol: 'SBINEQWETF.NS' },
  { symbol: 'SBIN.NS' }
];
quotes.sort((a, b) => {
  const aExact = a.symbol.split('.')[0].toUpperCase() === q.toUpperCase() ? 1 : 0;
  const bExact = b.symbol.split('.')[0].toUpperCase() === q.toUpperCase() ? 1 : 0;
  return bExact - aExact;
});
console.log(quotes);
