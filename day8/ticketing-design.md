Step 1 - Estimate the traffic. Normal day: 50,000 visitors × 10 pages = 500,000 page views ÷ 100,000 seconds = about 5 requests per second - very small. The big sale: 200,000 people in 10 minutes (600 seconds), each making perhaps 10 requests (refreshing, choosing seats, paying) = 2,000,000 requests ÷ 600 ≈ 3,300 requests per second - nearly 700 times normal traffic, arriving all at once. The real design challenge is not the normal day but this sudden spike, together with the strict rule that a seat can only be sold once.

Step 2 - Write the design document.

day8/ticketing-design.md   (markdown)

# TicketHub - Design Document


## 1. Requirements



**Functional**

- Browse and search events.

- See which seats are available for an event.

- Hold seats for 10 minutes while paying.

- Pay and receive tickets; view my tickets.



**Non-functional**

- A seat must NEVER be sold twice (correctness comes first).

- Survive big sales: ~3,300 requests/second for 10 minutes.

- Pages load in under 1 second on normal days.

- Fairness: people who arrive first get the first chance to buy.



## 2. Estimates

- Normal: 50,000 visitors × 10 pages = 500,000/day ≈ 5 requests/s.

- Big sale: 200,000 people × ~10 requests in 600 s ≈ 3,300 requests/s.

- Only 20,000 seats exist, so at most 20,000 orders can succeed;

  180,000 people will not get a ticket and must be told quickly.



## 3. API

- GET  /events?search=&city=      list and search events (200)

- GET  /events/{id}                event details (200)

- GET  /events/{id}/seats          seats with their status (200)

- POST /holds                      body: { "eventId": 7, "seatIds": [101, 102] }

                                   → 201 with holdId and expiry time,

                                   → 409 Conflict if a seat is taken

- POST /orders                     body: { "holdId": 55, "paymentToken": "..." }

                                   → 201 Created (tickets issued)

- GET  /me/tickets                 my tickets (200)



409 Conflict means the request clashes with the current state

(the seat is no longer available).



## 4. Data model

- users   (id, name, email UNIQUE, password_hash)

- events  (id, name, venue, starts_at)

- seats   (id, event_id FK → events, section, row, number,

           status: 'available' | 'held' | 'sold',

           hold_id, hold_expires_at,

           UNIQUE (event_id, section, row, number))

- orders  (id, user_id FK → users, event_id FK → events,

           total, status, created_at)

- order_seats (order_id FK → orders, seat_id FK → seats UNIQUE)



Relationships: an event has many seats (one-to-many); a user has many

orders (one-to-many); an order contains many seats, and each seat can

belong to at most one order - enforced by UNIQUE on order_seats.seat_id.



## 5. Preventing double-booking

Holding a seat uses a single conditional update inside a transaction:



    BEGIN TRANSACTION;

    UPDATE seats

    SET status = 'held', hold_id = 55,

        hold_expires_at = NOW() + INTERVAL '10 minutes'

    WHERE id IN (101, 102) AND event_id = 7

      AND (status = 'available'

           OR (status = 'held' AND hold_expires_at < NOW()));

    -- if fewer than 2 rows changed, someone else got a seat first:

    ROLLBACK;  -- and reply 409 Conflict

    -- otherwise:

    COMMIT;    -- and reply 201 Created



Because the database checks the status and changes it in one atomic

step, two buyers can never both succeed for the same seat: the second

update finds the seat already 'held' and changes nothing. The UNIQUE

constraint on order_seats.seat_id is a second safety net. Expired holds

become available again automatically, because the WHERE clause treats

them like available seats.



## 6. Architecture


                         ┌─────────────────────┐
                         │      Browser        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    CDN / Edge       │
                         │ pages, images, CSS  │
                         │       and JS        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Load Balancer     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Waiting Room      │
                         │  Virtual Queue      │
                         └──────────┬──────────┘
                                    │
                         ┌──────────┴──────────┐
                         │                     │
                         ▼                     ▼
                  ┌──────────────┐      ┌──────────────┐
                  │ App Server 1 │      │ App Server 2 │
                  └──────┬───────┘      └──────┬───────┘
                         │                     │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       ┌─────────────┐      ┌───────────────┐     ┌───────────────┐
       │ Redis Cache │      │  Primary DB   │     │    Payment    │
       │             │      │               │     │   Provider    │
       │ Event pages │      │ Seats         │     │               │
       │ Seat map    │      │ Holds         │     │ External      │
       └─────────────┘      │ Orders        │     │ service       │
                            └───────┬───────┘     └───────────────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │ Read Replicas │
                            │               │
                            │ Search        │
                            │ Browsing      │
                            └───────────────┘

                                    │
                                    ▼
                            ┌───────────────┐
                            │     Queue     │
                            └───────┬───────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │    Workers    │
                            │               │
                            │ Emails        │
                            │ Ticket PDFs   │
                            └───────────────┘



- CDN: event pages and images are identical for everyone, so they

  are served from the edge during the rush.

- Waiting room: during a big sale, visitors join a virtual queue

  and are let in at a rate the system can handle, in arrival order.

This protects the database from being overwhelmed and improves fairness by giving users an orderly opportunity to purchase tickets.

- Load balancer + auto-scaled stateless app servers: extra servers

  are added before a known big sale and removed afterwards.

- Redis Cache: the seat map is cached for a few seconds to absorb millions

  of views; the final check always happens in the database.Caching reduces database load and improves response times.     However, the cache is not treated as the final authority for seat availability. The primary database performs the final check before a seat is held or sold.

- Application Servers: The application servers handle business logic such as authentication, event browsing, seat selection, seat holds, and order creation.

They are stateless, meaning that user sessions and important data are not stored only on one server. This allows more application servers to be added when traffic increases.

- Primary database: the only place seats are held and sold, so the

  transaction guarantees correctness.
- Payment provider: The external payment provider processes customer payments. The TicketHub application sends the required payment information and receives a success or failure response.

The application should not store sensitive payment credentials.

- Read replicas: handle browsing and search so the primary can focus

  on holds and orders.

- Queue + workers: ticket emails and PDFs are created in the

  background after payment, keeping checkout fast.

- Monitoring and Logging

Monitoring records system health, request rates, database performance, errors, queue length, and application-server health.

During a large ticket sale, these metrics help engineers identify bottlenecks and respond quickly to failures.



## 7. Trade-offs

1. Trade-off 1: Strong Consistency vs Availability During Seat Reservation

The system could make seat reservations highly available by allowing different application servers or database replicas to process reservations independently. However, this creates a serious risk of two users successfully reserving the same seat.

TicketHub therefore chooses strong consistency for the seat reservation path.

All seat holds and purchases are sent to the primary database. A transaction and conditional update verify the current seat status before changing it.

For example:

UPDATE seats
SET status = 'held',
    hold_id = 55,
    hold_expires_at = NOW() + INTERVAL '10 minutes'
WHERE id = 101
  AND status = 'available';

Only one transaction can successfully change the seat from available to held.

The disadvantage is that during extreme traffic or a database failure, some users may experience delays or receive a temporary error instead of completing a purchase immediately.

Decision: TicketHub chooses correctness over maximum availability because selling the same seat twice is more damaging than temporarily rejecting or delaying a reservation.

2. Trade-off 2: Cache Performance vs Data Freshness

Caching the seat map in Redis can significantly reduce database traffic during a major sale. However, cached information may become outdated quickly.

For example, a seat may appear available in the cached seat map while another customer has already placed a hold on it.

TicketHub therefore uses caching only to improve the browsing experience. The cache is never trusted for the final reservation decision.

The final seat check always happens against the primary database.

This creates a trade-off:

More caching: faster responses and lower database load.

Less caching: fresher information but higher database traffic.

Decision: TicketHub accepts slightly stale seat-map information in exchange for much better performance. If a user selects a seat that has already been taken, the database returns 409 Conflict, and the user can select another seat.


Design Principle

The most important principle in the architecture is that the database is the final authority for seat ownership.

The CDN, cache, load balancer, waiting room, read replicas, and workers exist primarily to absorb and distribute the huge amount of traffic.

The critical operation remains the database transaction that changes a seat from available to held or sold. This keeps the system scalable while protecting the most important business rule:

A seat can only be successfully sold to one customer.
