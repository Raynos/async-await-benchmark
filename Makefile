
.PHONY: start_await
start_await:
	node async-await/main.js

.PHONY: 0x_await
0x_await:
	0x -P 'autocannon -c 100 -d 5 -p10 http://localhost:8000/get-user?id=42' -- node async-await/main.js

.PHONY: start_callback
start_callback:
	node callbacks/main.js

.PHONY: 0x_callbacks
0x_callbacks:
	0x -P 'autocannon -c 100 -d 5 -p10 http://localhost:8000/get-user?id=42' -- node callbacks/main.js

.PHONY: bench
bench:
	autocannon -c 100 -d 5 -p 10 http://localhost:8000/get-user?id=42

.PHONY: write_data
write_data:
	curl -X POST --data '{"id":"42","email":"foo@bar.com"}' localhost:8000/create-user

