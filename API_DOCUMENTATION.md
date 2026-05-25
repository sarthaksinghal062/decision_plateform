# API Documentation

Base URL:
http://127.0.0.1:8000

---

# Routes

## GET /

Health check route

Response:
{
"message": "Decision Intelligence API is running"
}

---

## POST /decisions

Creates new decision

Request:
{
"title": "Best Laptop",
"description": "Choosing best laptop under budget"
}

---

## GET /decisions/{id}

Fetch decision details

---

## POST /criteria

Add decision criteria

---

## POST /options

Add decision options

---

## POST /compare

Compare all decision options and calculate scores
