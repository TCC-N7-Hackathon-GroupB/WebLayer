WebLayer
========

Setup:

1) Set up CORS
In order to consume ServiceLayer, you need to allow CORS.  

Here is what I did in my nginx.config:

server {
    listen       5000;
    server_name  localhost;
    add_header Access-Control-Allow-Headers "X-Requested-With";
    add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS";
    add_header Access-Control-Allow-Origin "*";
    location / {
        proxy_pass http://vm:5000;
    }
}

Reference: http://lukasz.cepowski.com/devlog/50,simple-cdn-with-nginx-that-allows-cors

2) Start ServiceLayer app

cd into ServiceLayer
start app: python app.py

3) Start webapp

cd into where graph.html is, and start http server.

python -m SimpleHTTPServer 8000

Hit localhost:8080/graph.html, and you should be able to see the page!