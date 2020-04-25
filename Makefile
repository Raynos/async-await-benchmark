
.PHONY: start_await
start_await:
	node async-await.js

.PHONY: write_data
write_data:
	curl -X POST --data '{"id":"42","email":"foo@bar.com"}' localhost:8000/create-user

.PHONY: bench_await
bench_await:
	autocannon -c 100 -d 5 -p 10 http://localhost:8000/get-user?id=42
