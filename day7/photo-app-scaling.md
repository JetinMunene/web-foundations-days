# SnapShare Photo App Scaling Plan

## 1. Overview

SnapShare is a photo-sharing application where users upload photos and scroll through a feed containing photos from people they follow.

The system needs to support a large number of users, frequent feed views, photo uploads, and storage of large image files.

The main goal of this scaling plan is to design an architecture that can handle high read traffic, store photos efficiently, and process uploaded photos asynchronously.

---

## 2. Assumptions

The following assumptions are based on the facts provided in the assignment:

- SnapShare has 10 million registered users.
- 10% of registered users are active each day.
- Each daily active user uploads 1 photo per day.
- Each daily active user views 50 feed pages per day.
- An average original photo is 2 MB.
- Each photo also has one 50 KB thumbnail.
- There are 365 days in a year.
- Traffic is assumed to be distributed evenly throughout a 24-hour day when calculating average requests per second.
- Peak traffic is estimated at 5 times the average traffic.
- Every uploaded photo is stored as an original photo and a thumbnail.

---

## 3. Daily Active Users

There are 10 million registered users and 10% are active each day.

```text
Daily Active Users = 10,000,000 × 10%

Daily Active Users = 1,000,000


 ##4. Uploads Per Second

Each daily active user uploads 1 photo per day.
    Photos uploaded per day
    = 1,000,000 users × 1 photo
    = 1,000,000 photos per day
    There are 86,400 seconds in one day.
Uploads per second
= 1,000,000 ÷ 86,400
≈ 11.57 uploads/second

Therefore:
- Average uploads: approximately 11.6 uploads/second
- Peak uploads: approximately 57.9 uploads/second
Peak is calculated using the 5× assumption:
11.57 × 5 ≈ 57.85 uploads/second

## 5. Feed Views Per Second

 Each daily active user views 50 feed pages per day.
Feed views per day
= 1,000,000 users × 50 pages
= 50,000,000 feed pages per day

There are 86,400 seconds in one day.
Average feed views per second
= 50,000,000 ÷ 86,400
≈ 578.70 feed views/second

Using a 5× peak traffic factor:
Peak feed views per second
= 578.70 × 5
≈ 2,893.5 feed views/second

Therefore:
- Average feed views: approximately 579/second
- Peak feed views: approximately 2,894/second

## 6. Photo Storage Per Year

Each photo consists of:
- Original photo = 2 MB
- Thumbnail = 50 KB
- Total storage per photo = 2.05 MB
There are 1,000,000 uploaded photos per day.
Daily photo storage
= 1,000,000 × 2.05 MB
= 2,050,000 MB

This is approximately:
2,050 GB
= 2.05 TB per day

For one year:
Annual photo storage
= 2.05 TB × 365
= 748.25 TB

Therefore, SnapShare would require approximately:
748 TB of photo storage per year, before considering replication, backups, metadata, or other storage overhead.


## 7. Read-Heavy or Write-Heavy

Read-Heavy or Write-Heavy?
SnapShare is a read-heavy system.
The system receives approximately:
- 11.6 photo uploads per second on average.
- 579 feed views per second on average.
This means feed reads occur approximately 50 times more frequently than photo uploads.
The design should therefore prioritize fast read performance. A CDN should serve photos close to users, a cache should reduce repeated database queries, and a database read replica should handle read traffic without placing all of the workload on the primary database.

## 8. Why Photos should not be stored in the Database

The actual photo files should not be stored directly inside the database.
Photos are relatively large files, and storing hundreds of terabytes of images in database rows would make database storage, backups, replication, and scaling more expensive and difficult.
Instead, the original photos and thumbnails should be stored in object storage.
The database should store metadata such as:
- Photo ID
- User ID
- Caption
- Upload time
- Object storage key or URL
- Thumbnail location
Object storage is designed to store large amounts of files and can scale independently from the application database.

## 9. SnapShare Architecture
                         ┌─────────────────────┐
                         │       Users         │
                         │ Mobile / Web Apps   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │        CDN          │
                         │ Photos & Thumbnails │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Load Balancer     │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
              ┌───────────┐   ┌───────────┐   ┌───────────┐
              │ App Server│   │ App Server│   │ App Server│
              │     1     │   │     2     │   │     3     │
              └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
             ┌─────────────┐                ┌───────────────┐
             │    Cache    │                │ Primary DB    │
             │   (Redis)   │                │               │
             └──────┬──────┘                └───────┬───────┘
                    │                               │
                    │                               ▼
                    │                       ┌───────────────┐
                    │                       │  Read Replica │
                    │                       └───────────────┘
                    │
                    │
                    │        ┌──────────────────────┐
                    └───────►│    Object Storage    │
                             │ Original Photos      │
                             │ + Thumbnails         │
                             └──────────────────────┘


          Photo Upload Processing

              App Server
                   │
                   ▼
            ┌───────────────┐
            │     Queue     │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │    Worker     │
            │               │
            │ Create        │
            │ Thumbnail     │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │ Object Storage│
            │   Thumbnail   │
            └───────────────┘

## 10. Component Responsibilities

CDN
-The CDN stores and serves frequently requested photos and thumbnails from locations close to users, reducing latency and application-server traffic.
Load Balancer
-The load balancer distributes incoming requests across multiple application servers so that no single server becomes overloaded.
App Servers
-Application servers handle business logic such as authentication, uploads, feed generation, following users, and API requests.
Cache
-The cache stores frequently accessed data such as popular feed information and metadata so that repeated requests do not always need to reach the database.
Primary Database
-The primary database stores structured application data such as users, relationships, photo metadata, and upload information, while handling writes.
Read Replica
-The read replica handles database read operations so that heavy feed-reading traffic does not overload the primary database.
Object Storage
-Object storage stores the original photo files and thumbnails efficiently and independently from the application database.
Queue
-The queue holds background jobs such as thumbnail creation so that image processing does not slow down the user's upload request.
Worker
-The worker retrieves thumbnail jobs from the queue, creates smaller thumbnail images, and stores the thumbnails in object storage.

## 11. Photo Upload Flow

Step 1: User selects a photo
The user selects a photo using the SnapShare mobile or web application.
Step 2: Upload request reaches the load balancer
The upload request is sent to SnapShare and the load balancer forwards it to an available application server.
Step 3: Application server validates the upload
The application server checks the user's authentication, file type, file size, and other upload requirements.
Step 4: Original photo is stored
The application server uploads the original photo to object storage.
Step 5: Photo metadata is saved
The application server stores metadata about the photo in the primary database, including the user ID, photo ID, object storage location, caption, and upload time.
Step 6: Thumbnail job is added to the queue
The application server creates a thumbnail-processing job and places it into the queue.
The upload request does not need to wait for thumbnail processing to finish.
Step 7: Worker processes the job
A background worker retrieves the job from the queue and creates a 50 KB thumbnail from the original photo.
Step 8: Thumbnail is stored
The worker stores the generated thumbnail in object storage.
Step 9: Feed becomes available
The photo metadata can be included in the user's followers' feeds. The CDN can then serve the thumbnail or original photo when users request it.

## 12. Feed Reading Flow

When a user opens the SnapShare feed:
1. The user's request reaches the CDN and load balancer.
2. The application server checks the cache for frequently accessed feed data.
3. If the required data is not cached, the application server queries the database.
4. Read queries are directed to the database read replica where appropriate.
5. The application retrieves photo metadata and object storage locations.
6. The CDN serves the required thumbnails and photos.
7. The user receives the feed.
This design reduces the amount of work that must be performed by the application servers and database.

## 13. Scaling Strategy

SnapShare can scale horizontally by adding more application servers behind the load balancer.
As feed traffic increases, additional caching and CDN capacity can reduce the load on application servers and databases.
The database can use read replicas to handle increasing read traffic while the primary database continues handling writes.
Object storage can scale independently as the number of uploaded photos grows.
The queue and workers can also scale horizontally. If many thumbnail jobs are waiting, additional workers can process them concurrently.

## 14. Trade-offs

Trade-Off 1: CDN Performance vs Cost
Using a CDN improves photo delivery speed and reduces traffic to the application servers, but CDN usage introduces additional infrastructure costs.
For SnapShare, the performance benefits are important because the system is read-heavy.

Trade-Off 2: Asynchronous Thumbnail Processing vs Immediate Availability
Using a queue and background worker makes uploads faster because the user does not have to wait for thumbnail generation.
However, the thumbnail may not be available immediately after the upload because it must first be processed by the worker.

Trade-Off 3: Object Storage vs Simplicity
Object storage is much better suited to storing hundreds of terabytes of photos than a database, but it introduces additional infrastructure components and requires the application to manage object-storage references.
