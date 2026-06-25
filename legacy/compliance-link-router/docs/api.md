# API Documentation for Secure, Compliance-Shielded Link Routing SaaS Platform

## 1. Overview

This document provides the specification for the RESTful API of the link routing platform. The API allows developers and administrators to programmatically manage links, routing rules, and view platform data.

*   **Base URL:** `https://api.example.com/api/v1` (Versioned API - FR-21)
*   **Content-Type:** `application/json`
*   **Authentication:** Bearer Token (JWT) via Supabase Auth (FR-24).

## 2. Authentication

All endpoints (except `/auth/login` and `/auth/signup`) require a valid JWT in the `Authorization` header.

`Authorization: Bearer <your_jwt_token>`

## 3. Endpoints

### 3.1. Link Management

#### 3.1.1. Create a Link
*   **Endpoint:** `POST /links`
*   **Description:** Creates a new routing link.
*   **Request Body:**
    ```json
    {
      "slug": "promo-2024", // Max 50 chars (NFR-5)
      "targetUrl": "https://destination.com/sale", // Max 2048 chars (NFR-5)
      "title": "Fall Promo", // Optional, Max 100 chars
      "description": "Main link for the fall promotional campaign" // Optional, Max 250 chars
    }
    ```
*   **Responses:**
    *   `201 Created`: Link created successfully. Returns link object.
    *   `400 Bad Request`: Validation error (e.g., slug too long, invalid URL).
    *   `401 Unauthorized`: Missing or invalid JWT.
    *   `409 Conflict`: Slug already exists.

#### 3.1.2. Get All Links
*   **Endpoint:** `GET /links`
*   **Description:** Retrieves a list of all links owned by the authenticated user.
*   **Query Parameters:**
    *   `limit` (optional): Number of results to return (default 50).
    *   `offset` (optional): Number of results to skip.
*   **Responses:**
    *   `200 OK`: Returns an array of link objects.

#### 3.1.3. Get a Specific Link
*   **Endpoint:** `GET /links/:id`
*   **Description:** Retrieves details of a specific link by its UUID.
*   **Responses:**
    *   `200 OK`: Returns the link object.
    *   `404 Not Found`: Link does not exist or user does not have access.

#### 3.1.4. Update a Link
*   **Endpoint:** `PUT /links/:id`
*   **Description:** Updates an existing link.
*   **Request Body:** (Same fields as Create Link, all optional)
*   **Responses:**
    *   `200 OK`: Link updated successfully.
    *   `400 Bad Request`: Validation error.
    *   `404 Not Found`: Link not found.

#### 3.1.5. Delete a Link
*   **Endpoint:** `DELETE /links/:id`
*   **Description:** Deletes a link and all its associated routing rules.
*   **Responses:**
    *   `204 No Content`: Link deleted successfully.
    *   `404 Not Found`: Link not found.

### 3.2. Redirect Rules Management

#### 3.2.1. Create a Rule
*   **Endpoint:** `POST /links/:linkId/rules`
*   **Description:** Adds a new routing rule to a specific link.
*   **Request Body:**
    ```json
    {
      "priority": 1, // Integer, lower is higher priority
      "ruleType": "geo", // Enum: 'geo', 'device', 'ml_score', 'time'
      "ruleValue": "US", // The condition to match
      "targetUrl": "https://us.destination.com"
    }
    ```
*   **Responses:**
    *   `201 Created`: Rule created successfully.
    *   `400 Bad Request`: Invalid rule type or value.
    *   `404 Not Found`: Parent link not found.

#### 3.2.2. Get Rules for a Link
*   **Endpoint:** `GET /links/:linkId/rules`
*   **Description:** Retrieves all rules associated with a link, ordered by priority.
*   **Responses:**
    *   `200 OK`: Returns an array of rule objects.

#### 3.2.3. Delete a Rule
*   **Endpoint:** `DELETE /links/:linkId/rules/:ruleId`
*   **Description:** Deletes a specific routing rule.
*   **Responses:**
    *   `204 No Content`: Rule deleted successfully.

### 3.3. Asset Management

#### 3.3.1. Upload Asset
*   **Endpoint:** `POST /assets/upload`
*   **Description:** Uploads an image asset (e.g., for link previews). Enforces NFR-4.
*   **Content-Type:** `multipart/form-data`
*   **Body:** Form data with a `file` field.
*   **Responses:**
    *   `200 OK`: Upload successful. Returns the storage path.
    *   `400 Bad Request`: File exceeds 2MB or is not an allowed MIME type (png, jpg, webp).
