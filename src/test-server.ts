import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Hello World');
});

const PORT = 5005;
server.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});

// Keep process alive explicitly
setInterval(() => {
  console.log('Keep-alive tick');
}, 10000);
