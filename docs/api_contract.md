# API Contract - Marketplace Jasa Harian (MVP)

API Documentation untuk platform marketplace jasa harian dengan sistem dual-role (requester & provider dalam satu akun)

## 📋 Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Phone Verification](#phone-verification-belum)
- [Email Verification](#email-verification)
- [User](#user)
- [Province](#master-provinces)
- [Cities](#master-cities)
- [Districts](#master-districts)
- [Sub Districts](#master-subdistricts)
- [Addresses](#addresses)
- [Job Categories](#job-categories)
- [Skills](#skills-belum)
- [User Skill](#user-skills-belum)
- [Jobs](#jobs)
- [Bookmarks](#bookmarks)
- [Job Applications](#job-applications)
- [Notifications](#notifications)
- [Reviews](#reviews)
- [](#)
- [](#)

---

# Overview

## Core Concepts

- **Dual Role System**: Satu user dapat berperan sebagai pemberi kerja (provider) dan penyedia jasa (worker)
- **Job Lifecycle**: Berbasis state machine dengan validasi di backend
- **Consistent Response**: Semua endpoint menggunakan format response yang konsisten

## Response Format (Standard)

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

```json
{
  "success": true,
  "message": "Operation failed",
  "errors": []
}
```

---

# Base URL

```https
[https://api.jasaharian.com](https://api.jasaharian.com/v1)
```

private

```https
[https://api.jasaharian.com](https://api.jasaharian.com/v1)/api
```

public

```https
[https://api.jasaharian.com](https://api.jasaharian.com/v1)/public/api
```

---

# Authentication

### 1.1 Register (public)

Membuat akun pengguna baru.

- **Endpoint:** `POST /auth/register`
- **Request Body (multipart/form-data):**

| Key           | Type | Required | Description                                                                                                                    |
| ------------- | ---- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `profilePict` | File | No       | JPEG, JPG, PNG, WEBP — max 2MB                                                                                                 |
| `username`    | Text | Yes      |                                                                                                                                |
| `email`       | Text | Yes      |                                                                                                                                |
| `password`    | Text | Yes      | Min 8 characters, minimal one uppercase, minimal one lowercase, minimal one number, minimal one special character (!@#$% etc.) |
| `firstName`   | Text | Yes      |                                                                                                                                |
| `lastName`    | Text | No       |                                                                                                                                |
| `birthDate`   | Text | Yes      | Format: YYYY-MM-DD                                                                                                             |
| `phone`       | Text | Yes      | Format: +62xxxxxxxxx                                                                                                           |

**Request Body:**

```json
{
  "username": "skywalk",
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "birthDate": "YYYY-MM-DD",
  "phone": "0812345678"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "id": "uuid",
    "username": "skywalk",
    "email": "user@example.com",
    "profilePictUrl": "https://....",
    "firstName": "John",
    "lastName": "Doe",
    "birthDate": "YYYY-MM-DD",
    "isEmailVerified": false,
    "isPhoneVerfied": false,
    "status": "PENDING_VERIFICATION",
    "createdAt": YYYY-MM-DD HH:MI:SS,
  }
}
```

**Response:** `400 bad request`

```json
{
  "success": false,
  "message": "bad request",
  "errors": "username must not blank, …"
}
```

### 1.2 Login (public)

Login untuk mendapatkan JWT token.  
**Endpoint:** `POST /auth/login`  
**Request Body:**

```json
{
  "usernamOrEmail": "...",
  "password": "securepassword"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response:** `401 unauthorized`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "email or username or password wrong"
}
```

### 1.3 Renew access token (public)

Renew access token yang sudah EXP untuk generate token baru, selama refresh token masih berlaku  
**Endpoint:** `POST /auth/refresh`  
**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Successful generate new token",
  "data": {
    "newAccessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": "refresh token is missing"
}
```

### 1.4 Logout

Logout untuk keluar aplikasi.

**Endpoint:** `POST /auth/logout`

**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Logout successful",
  "data": "OK"
}
```

---

# Phone Verification (BELUM)

### 1.1.1 OTP phone

**Endpoint:** `POST /otp/phone/send`  
**Request Body:**

```json
{
  "phone": "0812345678"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "OTP send to phone",
  "data": {
    "expiresIn": 300 //s
  }
}
```

**Response:** `404 not found`

```json
{
  "success": false,
  "message": "not found",
  "errors": "phone not found"
}
```

**Response:** `409 conflict`

```json
{
  "success": false,
  "message": "conflict",
  "errors": "phone already verified"
}
```

**Response:** `429 to many request`

```json
{
  "success": false,
  "message": "to many requests",
  "errors": "OTP request limit exceeded",
  "retryAfter": 120 //s
}
```

### 1.1.2 Verify phone

**Endpoint:** `GET /otp/phone/verify`  
**Query params:**
| Key | Type | Required | Description |
|----------------|--------|----------|------------------------------------|
| `phone` | string | Yes | |
| `otp` | number | Yes | |

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "phone verified successful",
  "data": {
	"phoneVerifiedAt": YYYY-MM-DD HH:MI:SS,
  }
}
```

**Response:** `400 bad request`

```json
{
  "success": false,
  "message": "bad request",
  "errors": "invalid otp",
  "remainingAttempts": 2
}
```

**Response:** `410 gone`

```json
{
  "success": false,
  "message": "Gone",
  "errors": "OTP expired"
}
```

**Response:** `409 conflict`

```json
{
  "success": false,
  "message": "conflict",
  "errors": "OTP already used"
}
```

**Response:** `429 to many requests`

```json
{
  "success": false,
  "message": "to many requests",
  "errors": "maximum OTP attempts exceeded"
}
```

---

# Email Verification

### 1.1.1 LINK to email

**Endpoint:** `POST /emailVerifications/send-verification`  
**Request body:**

```json
{
  "email": "..."
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Verification link sent to email",
  "data": {
    "email": "u***@gmail.com",
    "expiresIn": 8690 // detik
  }
}
```

**Response:** `401 unauthorized`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": " "
}
```

**Response:** `404 not found`

```json
{
  "success": false,
  "message": "not found",
  "errors": "email not found"
}
```

**Response:** `409 conflict`

```json
{
  "success": false,
  "message": "conflict",
  "errors": "email already verified"
}
```

**Response:** `429 too many requests`

```json
{
  "success": false,
  "message": "too many requests",
  "errors": "OTP request limit exceeded",
  "retryAfter": 300 //s
}
```

### 1.1.2 Verify email

**Endpoint:** `GET /emailVerifications/verify`  
**Query param:**

- **token: string (mandatory)**

| Key     | Type   | Required | Description |
| ------- | ------ | -------- | ----------- |
| `token` | string | Yes      |             |

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "email verified successful",
  "data": {
    "emailVerifiedAt": "2026-01-01T10:00:00Z"
  }
}
```

**Response:** `400 bad request`

```json
{
  "success": false,
  "message": "bad request",
  "errors": "invalid OTP"
}
```

**Response:** `401 unauthorized`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": " "
}
```

**Response:** `410 gone`

```json
{
  "success": false,
  "message": "Gone",
  "errors": "OTP expired"
}
```

**Response:** `409 conflict`

```json
{
  "success": false,
  "message": "conflict",
  "errors": "OTP already used"
}
```

// JIKA PHONE DAN EMAIL USER SUDAH VERIFIED UBAH user status = ACTIVE

---

# USER

### 2.1 Get user

Mendapatkan info akun pengguna saat ini.  
**Endpoint:** `GET /users/current`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get user successful",
  "data": {
    "id": "uuid",
    "username": "skywalk",
    "email": "user@example.com",
    "profilePictUrl": "https://example.url",
    "name": "...",
    "isEmailVerified": false,
    "isPhoneVerified": false
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "not found",
  "errors": "user not found"
}
```

### 2.2 Update user (Belum)

Membuat akun pengguna baru.  
**Endpoint:** `PATCH /users/current`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

- **Request Body (multipart/form-data):**

| Key           | Type | Required | Description                    |
| ------------- | ---- | -------- | ------------------------------ |
| `profilePict` | File | No       | JPEG, JPG, PNG, WEBP — max 2MB |
| `username`    | Text | No       |                                |
| `firstName`   | Text | No       |                                |
| `lastName`    | Text | No       |                                |
| `birthDate`   | Text | No       | Format: YYYY-MM-DD             |
| `phone`       | Text | No       | Format: +62xxxxx               |

```json
{
  "username": "newUsername", // PUT if only want to update username
  "birtDate": "YYYY-MM-DD", // PUT if only want to update bio
  "firstName": "newFirstName", // PUT if only want to update firstName
  "lastName": "newLastName", // PUT if only want to update lastName
  "phone": "NewPhone" // PUT if only want to update phone
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "id": "uuid",
    "username": "skywalk",
    "profilePict": "https://...",
    "firstName": "John",
    "lastName": "Doe",
    "birtDate": "YYYY-MM-DD",
    "phone": "+6281234567890",
    "updatedAt": DD-MM-YY
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "....."
}
```

### 2.2 Profile owner (BELUM)

Mendapatkan profile user sendiri  
**Endpoint:** `GET /users/profile`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Get profile successfully",
  "data": {
    "id": "uuid",
    "username": "budisantoso",
    "name": "Budi Santoso",
    "email": "budi@gmail.com",
    "phone": "08111234567",
    "profilePictUrl": "https://example.url",
    "birthDate": "1995-01-01",
    "status": "ACTIVE",
    "isEmailVerified": true,
    "isPhoneVerified": false,
    "createdAt": "2026-01-01T10:00:00Z",
    "locations": {
      "subdistrict": {
        "id": "SD1",
        "name": "Keude Bakongan",
        "code": "11.01.01.2001"
      },
      "district": {
        "id": "D1",
        "name": "Bakongan",
        "code": "11.01.01"
      },
      "city": {
        "id": "C1",
        "name": "Kab. Aceh Selatan",
        "code": "11.01"
      },
      "province": {
        "id": "P1",
        "name": "Aceh",
        "code": "11"
      }
    },
    "asWorker": {
      "totalApplied": 20,
      "totalAccepted": 15,
      "totalRejected": 3,
      "reviews": {
        "averageRating": 4.7,
        "totalReviews": 23,
        "distribution": {
          "5": 15,
          "4": 5,
          "3": 2,
          "2": 1,
          "1": 0,
          "0": 0
        },
        "latest": []
      }
    },
    "asProvider": {
      "totalJobsPosted": 8,
      "totalJobsCompleted": 6,
      "totalJobsCanceled": 1,
      "reviews": {
        "averageRating": 4.7,
        "totalReviews": 23,
        "distribution": {
          "5": 15,
          "4": 5,
          "3": 2,
          "2": 1,
          "1": 0,
          "0": 0
        },
        "latest": []
      }
    },
    "bookmark": {
      "totalBookmark": 10
    }
  }
}
```

**Response:** `404 Not found`

```json
{
  "success": false,
  "message": "not found",
  "errors": "User not found"
}
```

### 2.2 Profile other people (BELUM)

Mendapatkan profil orang lain  
**Endpoint:** `GET /users/:userId/profile`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Get profile successfully",
  "data": {
    "id": "uuid",
    "name": "Budi Santoso",
    "profilePictUrl": "https://example.url",
    "createdAt": "2026-01-01T10:00:00Z",
    "asWorker": {
      "totalApplied": 20,
      "totalAccepted": 15,
      "totalRejected": 3,
      "reviews": {
        "averageRating": 4.7,
        "totalReviews": 23,
        "distribution": {
          "5": 15,
          "4": 5,
          "3": 2,
          "2": 1,
          "1": 0,
          "0": 0
        },
        "latest": []
      }
    },
    "asProvider": {
      "totalJobsPosted": 8,
      "totalJobsCompleted": 6,
      "totalJobsCanceled": 1,
      "reviews": {
        "averageRating": 4.7,
        "totalReviews": 23,
        "distribution": {
          "5": 15,
          "4": 5,
          "3": 2,
          "2": 1,
          "1": 0,
          "0": 0
        },
        "latest": []
      }
    }
  }
}
```

**Response:** `404 Not found`

```json
{
  "success": false,
  "message": "not found",
  "errors": "User not found"
}
```

---

# Master provinces

### 3.2 Get provinces

Mencari provinsi sesuai id provinsi.  
**Endpoint:** `GET /provinces/:provinceId`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get province successful",
  "data": {
    "id": "P1",
    "code": "11",
    "name": "Aceh"
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "failed get province",
  "errors": "unauthorized"
}
```

**Response:** `400 failed`

```json
{
  "success": false,
  "message": "invalid path parameter",
  "errors": "bad request"
}
```

### 3.3 Get all provinces

Mencari semua provinsi.  
**Endpoint:** `GET /provinces`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get provinces successful",
  "data": [
    {
	    "id": "P1",
    	"code": "11",
    	"name": "Aceh"
    },
    ...,
    ...
  ]
}
```

**Response:** `200 OK, but empty`

```json
{
  "success": true,
  "message": "get provinces successful",
  "data": []
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed get provinces"
}
```

---

# Master cities

### 4.2 Get city

Mendapatkan kota berdasarkan id kota.  
**Endpoint:** `GET /cities/:cityId`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get city successful",
  "data": {
    "id": "C1",
    "code": "11.01",
    "name": "Kab. Aceh Selatan",
    "province": {
      "id": "id-fk-master-province",
      "code": "11",
      "name": "Aceh"
    }
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed get city"
}
```

**Response:** `400 failed`

```json
{
  "success": false,
  "message": "bad request",
  "errors": "invalid path parameter"
}
```

### 4.3 Get city by provinceId

Mendapatkan kota berdasarkan provinsi.  
**Endpoint:** `GET /provinces/:provinceId/cities`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get city by province successful",
  "data": [
    {
      "id": "C1",
      "code": "11.01",
      "name": "Kab. Aceh Selatan"
    },
    ...,
    ...
  ]
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "failed get city",
  "errors": "unauthorized"
}
```

**Response:** `400 failed`

```json
{
  "success": false,
  "message": "bad request",
  "errors": "invalid path parameter"
}
```

### 4.4 Get all city

Mencari semua kota.  
**Endpoint:** `GET /cities`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get cities successful",
  "data": [
    {
      "id": "C1",
      "code": "11.01",
      "name": "Kab. Aceh Selatan",
      "province": {
        "id": "id-fk-master-province",
        "code": "11",
        "name": "Aceh",
      }
    },
    ...,
    ...
  ]
}
```

**Response:** `200 OK, but empty`

```json
{
  "success": true,
  "message": "get cities successful",
  "data": []
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed get cities"
}
```

---

# Master districts

### 5.2 Get districts

mencari kecamatan berdasarkan id kecamatan.  
**Endpoint:** `GET /districts/:districtId`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get districts successful",
  "data": {
    "id": "D1",
    "code": "11.01.01",
    "name": "Bakongan",
    "city": {
      "id": "C1",
      "code": "11.01",
      "name": "Kab. Aceh Selatan"
    },
    "province": {
      "id": "P1",
      "code": "11",
      "name": "Aceh"
    }
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": ""
}
```

**Response:** `400 failed`

```json
{
  "success": false,
  "message": "bad request",
  "errors": ""
}
```

### 5.3 Get districts by city

mencari kecamatan berdasarkan id kecamatan.  
**Endpoint:** `GET /cities/:cityId/districts`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get districts by city and province successful",
  "data": [
    {
      "id": "D1",
      "code": "11.01.01",
      "name": "Bakongan"
    },
    ...,
    ...
  ]
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed get district"
}
```

**Response:** `400 failed`

```json
{
  "success": false,
  "message": "bad request",
  "errors": "invalid path parameter"
}
```

### 5.4 Get all districts

Membuat kecamatan.  
**Endpoint:** `GET /districts`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get districts successful",
  "data": [
    {
      "id": "D1",
      "code": "11.01.01",
      "name": "Bakongan",
      "city": {
        "id": "C1",
        "code": "11.01",
        "name": "Kab. Aceh Selatan",
      },
      "province": {
        "id": "P1",
        "code": "11",
        "name": "Aceh",
      },
    },
    ...,
    ...
  ]
}
```

**Response:** `200 OK, but empty`

```json
{
  "success": true,
  "message": "get districts successful",
  "data": []
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed get districts"
}
```

---

# Master subdistricts

### 6.2 Get subdistricts

Mendapatkan desa.  
**Endpoint:** `GET /subdistricts/:subdistrictId`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get district successful",
  "data": {
    "id": "SD1",
    "code": "11.01.01.2001",
    "name": "Keude Bakongan",
    "district": {
      "id": "D1",
      "code": "11.01.01",
      "name": "Bakongan"
    },
    "city": {
      "id": "C1",
      "code": "11.01",
      "name": "Kab. Aceh Selatan"
    },
    "province": {
      "id": "P1",
      "code": "11",
      "name": "Aceh"
    }
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "failed get subdistrict",
  "errors": "unauthorized"
}
```

**Response:** `400 failed`

```json
{
  "success": false,
  "message": "invalid path parameter",
  "errors": "bad request"
}
```

### 6.3 Get subdistricts by district

Mendapatkan desa berdasarkan id kecamatan  
**Endpoint:** `GET /districts/:districtId/subdistricts`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get subdistrict by district, city, and province  successful",
  "data": [
    {
      "id": "SD1",
      "code": "11.01.01.2001",
      "name": "Keude Bakongan",
    },
    ...,
    ...
  ]
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed get subdistrict"
}
```

**Response:** `400 failed`

```json
{
  "success": false,
  "message": "bad request",
  "errors": "invalid path parameter"
}
```

### 6.4 Get all subdistricts

Membuat desa.  
**Endpoint:** `GET /subdistricts`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get districts successful",
  "data": [
    {
      "id": "SD1",
      "code": "11.01.01.2001",
      "name": "Keude Bakongan",
      "district": {
        "id": "D1",
        "code": "11.01.01",
        "name": "Bakongan"
      },
      "city": {
        "id": "C1",
        "code": "11.01",
        "name": "Kab. Aceh Selatan"
      },
      "province": {
        "id": "P1",
        "code": "11",
        "name": "Aceh",
      },
    },
    ...,
    ...
  ]
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed create subdistrict"
}
```

---

# Addresses

set isPrimary = true saat pertama kali buat addresses dan saat user membuat alamat lagi set isPrimary = false

### 7.1 Create address

Membuat alamat pengguna.  
**Endpoint:** `POST /addresses`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Request Body:**

```json
{
  "subdistrictId": "uuid-fk-subdistrict",
  "street": "Jln. Subroto No. 4",
  "postalCode": "xxxxx",
  "benchmark": "depan tugu",
  "markAs": "home",
  "isPrimary": true,
  "lat": -6.0,
  "lng": 5.33333
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "create addresses successful",
  "data": {
    "id": "uuid-address-id",
    "street": "Jln. Subroto No. 4",
   	"country": "Indonesia",
    "postalCode": "xxxxx",
    "lat": -6.00000,
    "lng": 5.33333,
    "isPrimary": true,
    "locations": {
      "subdistrict": {
        "id": "SD1",
        "name": "Keude Bakongan",
        "code": "11.01.01.2001",
      },
      "district": {
        "id": "D1",
        "name": "Bakongan",
        "code": "11.01.01"
      },
      "city": {
        "id": "C1",
        "name": "Kab. Aceh Selatan",
        "code": "11.01"
      },
      "province": {
        "id": "P1",
        "name": "Aceh",
        "code": "11"
      }
    },
    "createdAt": YYYY-MM-DD HH:MI:SS
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed create subdistrict"
}
```

### 7.2 Get All address

mendapatkan address user saat ini  
**Endpoint:** `GET /addresses`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get addresses successful",
  "data": [
    {
      "id": "uuid-addresses",
      "street": "Jln. Subroto No. 4",
      "country": "Indonesia",
      "postalCode": "xxxxx",
      "lat": -6.00000,
      "lng": 5.33333,
      "isPrimary": "true",
      "locations": {
        "subdistrict": {
          "id": "SD1",
          "name": "Keude Bakongan",
          "code": "11.01.01.2001"
        },
        "district": {
          "id": "D1",
          "name": "Bakongan",
          "code": "11.01.01"
        },
        "city": {
          "id": "C1",
          "name": "Kab. Aceh Selatan",
          "code": "11.01"
        },
        "province": {
          "id": "P1",
          "name": "Aceh",
          "code": "11"
        }
      },
      "createdAt": YYYY-MM-DD HH:MI:SS,
      "updatedAt": YYYY-MM-DD HH:MI:SS
    },
    ...,
    ...
  ]
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed get address"
}
```

**Response:** `404 failed`

```json
{
  "success": false,
  "message": "not found",
  "errors": "address is not found"
}
```

### 7.3 Get address

mendapatkan address user saat ini  
**Endpoint:** `GET /addresses/:addressId`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get address successful",
  "data":  {
    "id": "uuid-addresses",
    "street": "Jln. Subroto No. 4",
    "country": "Indonesia",
    "postalCode": "xxxxx",
    "lat": -6.00000,
    "lng": 5.33333,
    "isPrimary": "true",
    "locations": {
      "subdistrict": {
        "id": "SD1",
        "name": "Keude Bakongan",
        "code": "11.01.01.2001"
      },
      "district": {
        "id": "D1",
        "name": "Bakongan",
        "code": "11.01.01"
      },
      "city": {
        "id": "C1",
        "name": "Kab. Aceh Selatan",
        "code": "11.01"
      },
      "province": {
        "id": "P1",
        "name": "Aceh",
        "code": "11"
      }
    },
    "createdAt": YYYY-MM-DD HH:MI:SS,
    "updatedAt": YYYY-MM-DD HH:MI:SS
  },
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed get address"
}
```

**Response:** `404 failed`

```json
{
  "success": false,
  "message": "not found",
  "errors": "address is not found"
}
```

### 7.4 Update address

Update alamat pengguna berdasarkan id address tertentu.  
**Endpoint:** `PATCH /addresses/:addressId`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Request Body:**

```json
{
  "street": "jln. soekarno hatta",
  "postaCode": "xxxxx",
  "subDistrictId": "id-fk-subDistrict",
  "isPrimary": true,
  "benchmark": "...",
  "markAs": "Office",
  "lat": -6.0,
  "lng": 5.33333
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "update address successful",
  "data": {
    "id": "uuid-address",
    "street": "jln. soekarno hatta",
    "postaCode": "xxxxx",
    "subDistrictId": "id-fk-subDistrict",
    "lat": -6.00000,
    "lng": 5.33333,
    "isPrimary": true,
    "benchmark": "......",
    "markAs": "Office",
    "locations": {
      "subdistrict": {
        "id": "SD1",
        "name": "Keude Bakongan",
        "code": "11.01.01.2001"
      },
      "district": {
        "id": "D1",
        "name": "Bakongan",
        "code": "11.01.01"
      },
      "city": {
        "id": "C1",
        "name": "Kab. Aceh Selatan",
        "code": "11.01"
      },
      "province": {
        "id": "P1",
        "name": "Aceh",
        "code": "11"
      }
    },
    "updatedAt": YYYY-MM-DD HH:MI:SS
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed update address"
}
```

**Response:** `400 failed`

```json
{
  "success": false,
  "message": "bad request",
  "errors": "invalid sub district"
}
```

**Response:** `404 failed`

```json
{
  "success": false,
  "message": "not found",
  "errors": "address is not found"
}
```

### 7.4 Delete address

**Endpoint:** `DELETE /addresses/:addressId`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Delete address successful",
  "data": {}
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed update address"
}
```

**Response:** `400 failed`

```json
{
  "success": false,
  "message": "bad request",
  "errors": "invalid sub district"
}
```

**Response:** `404 failed`

```json
{
  "success": false,
  "message": "not found",
  "errors": "address is not found"
}
```

---

# Job categories

### 8.1 Get job category

**Endpoint:** `GET /jobCategories/:jobCategoryId`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get job category successful",
  "data": {
    "id": "jc1",
    "code": "CLN",
    "name": "CLEANING",
    "isActive": true
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed get job category"
}
```

### 8.2 Get all job categories

**Endpoint:** `GET /jobCategories`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get job categories successful",
  "data": [
    {
      "id": "jc1",
      "code": "CLN",
      "name": "CLEANING",
      "isActive": true
    },
    ...,
    ...
  ]
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed get job categories"
}
```

---

# SKILLS (BELUM)

### 9.1 Create Skills

Membuat skill keahlian user  
**Endpoint:** `POST /jobCategories/Skills`  
**ONLY ADMIN**  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Request Body:**

```json
{
  "name": "Plumbing",
  "jobCategoryId": "jc1"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "create skill successful",
  "data": {
    "id": "sk1",
    "jobCategoryId": "id-fk-jobCategory",
    "name": "Plumbing",
    "description": "lorem ipsum",
    "createdAt": YYYY-MM-DD HH:MI:SS
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed create skill"
}
```

### 9.2 Get all Skills

Membuat skill keahlian user  
**Endpoint:** `GET /jobCategories/Skills`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get skill successful",
  "data": [
    {
      "id": "sk1",
      "jobCategory": {
        "jobCategoryId": "id-fk-jobCategory",
        "name": "ELECTRICS"
      },
      "name": "`Electrical circuit troubleshooting`", "description": "lorem ipsum",//optional
    },
    ...,
    ...
  ]
}
```

**Response:** `200 OK, but empty`

```json
{
  "success": true,
  "message": "get skill successful",
  "data": []
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed get skill"
}
```

### 9.3 Get Skills

Membuat skill keahlian user  
**Endpoint:** `GET /jobCategories/Skills/{skillId}`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get skill successful",
  "data": {
    "id": "sk1",
    "jobCategory": {
      "jobCategoryId": "id-fk-jobCategory",
      "name": "ELECTRICS"
    },
    "name": "`Electrical circuit troubleshooting`","description": "lorem ipsum",//optional
    "createdAt": YYYY-MM-DD HH:MI:SS,
    "updatedAt": YYYY-MM-DD HH:MI:SS
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed get skill"
}
```

**Response:** `404 failed`

```json
{
  "success": false,
  "message": "not found",
  "errors": "skill not found"
}
```

### 9.4 Update Skills

Membuat skill keahlian user  
**Endpoint:** `PATCH /jobCategories/Skills/{skillId}`  
**ONLY ADMIN**  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Request Body:**

```json
{
  "name": "Plumbing", //optional
  "description": "lorem ipsum", //optional
  "jobCategoryId": "id-jobCategory"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "update skill successful",
  "data": "OK"
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed update skill"
}
```

**Response:** `404 failed`

```json
{
  "success": false,
  "message": "not found",
  "errors": "skill not found"
}
```

### 9.5 Delete Skills

Membuat skill keahlian user  
**Endpoint:** `DELETE /jobCategories/Skills/{skillId}`  
**ONLY ADMIN**  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "update skill successful",
  "data": "OK"
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed delete skill"
}
```

**Response:** `400 not found`

```json
{
  "success": false,
  "message": "not found",
  "errors": "skill not found"
}
```

---

# User Skills (BELUM)

problem: user kadang menulis custom skill mereka dalam b. inggris atau tidak bahasa indonesia

### 10.1 Create user skills

Membuat level keahlian user [beginner, intermediate, expert, master]  
**Endpoint:** `POST /skills/userSkills`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Request Body:**

```json
{
  "level": "Beginner",
  "skillId": "id-fk-skill", // optional (NULL jika custom skill name ada)
  "customSkillName": "`Smart Home Installation", //optional (NULL jika skill id ada)
  "customSkillDesc": "lorem ipsum", //optional (NULL jika skill id ada)
  "portofolioUrl": "https://example.url", //optional
  "certificationUrl": "https://example.url" //optional
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "create user skill successful",
  "data": {
    "id": "us1",
    "userId": "uuid-fk-user",
    "skillId": "id-fk-skills", //optional (NULL jika ada custom skill)
    "customSkillName": "`Smart Home Installation",//optional (NOT NULL jika skillId NULL)
    "customSkillDesc": "lorem ipsum", //optional (NOT NULL jika skillId NULL)
    "level": "Beginner",
    "portofolioUrl": "https://example.url", //optional
    "certificationUrl": "https://example.url", //optional
    "createdAt":` YYYY-MM-DD HH:MI:SS
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed created user skill"
}
```

**Response:** `400 failed`

```json
{
  "success": false,
  "message": "bad request",
  "errors": "level cannot be null"
}
```

### 10.2 Get all user skills

Mendapatkan level keahlian user [beginner, intermediate, expert, master]  
**Endpoint:** `GET /skills/userSkills`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get user skill successful",
  "data": [
    {
      "id": "us1",
      "skill": { //optional (NULL untuk jika ada custom skill)
        "skillId": "id-fk-skills",
        "name": "...."
      },
      "customSkillName": "`Smart Home Installation",//optional (NOT NULL jika skillId NULL)
      "level": "Beginner",
      "portofolioUrl": "https://example.url", //optional
      "certificationUrl": "https://example.url", //optional
      "createdAt": YYYY-MM-DD HH:MI:SS,
      "updatedAt": YYYY-MM-DD HH:MI:SS
    },
    ...,
    ...
  ]
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed get user skill"
}
```

### 10.3 Get user skills

Mendapatkan level keahlian user [beginner, intermediate, expert, master]  
**Endpoint:** `GET /skills/userSkills/{userSkillId}`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get user skill successful",
  "data": {
    "id": "us1",
    "userId": "uuid-fk-user",
    "skill": {
      //optional (NULL untuk jika ada custom skill)
      "skillId": "id-fk-skills",
      "name": "...."
    },
    "customSkillName": "`Smart Home Installation", //optional (NOT NULL jika skillId NULL
    "level": "Beginner",
    "portofolioUrl": "https://example.url", //optional
    "certificationUrl": "https://example.url" //optional
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed get user skill"
}
```

### 10.4 Update user skills

Update level keahlian user [beginner, intermediate, expert, master]  
**Endpoint:** `PATCH /skills/userSkills/{userSkillId}`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Request Body:**

````json
{
	"level": "Beginner", //optional
	"skillId": "id-fk-skills", //optional (NULL untuk jika ada custom skill)
	"customSkillName": "`Smart Home Installation",//optional (jika di DB NULL => invalid)
	"portofolioUrl": "https://example.url", //optional
	"certificationUrl": "https://example.url", //optional
}

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "get user skill successful",
  "data": {
    "id": "us1",
    "skillId": "id-fk-skills", //optional (NULL jika mengisi custom skill)
    "customSkillName": "`Smart Home Installation",//optional (NOT NULL jika skillId NULL)
    "level": "Beginner",//optional
    "portofolioUrl": "https://example.url", //optional
    "certificationUrl": "https://example.url", //optional
    "updatedAt": YYYY-MM-DD HH:MI:SS
  }
}
````

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed get user skill"
}
```

### 10.5 Delete user skills

Update level keahlian user [beginner, intermediate, expert, master]  
**Endpoint:** `DELETE /skills/userSkills/{userSkillId}`  
**Request Header:**

- **Authorization: Bearer <token> (accessToken)**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "delete user skill successful",
  "data": "OK"
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed delete user skill"
}
```

**Response:** `404 not found`

```json
{
  "success": false,
  "message": "not found",
  "errors": "user skill not found"
}
```

---

# Jobs

- job site = [On site, Hybrid, Remote]
- budget type = [Fixed, Hourly, Negotiable]
- status = [Open, Canceled, In Progress, Closed] //default open
- level = [Beginner, Intermediate, Advanced, Expert]
- type = [Urgent, Non urgent]

### 12.1 Create Job

User membuat/posting job baru.  
**Endpoint:** `POST /jobs`  
**Request Headers:**

- **Authorization: Bearer {token}**

**Request Body:**

```json
{
  "addressId": "fk-uuid-jobs",
  "jobCategoriesId":  ["jc1", "jc2", "jc3"],
  "title": "Bantu pindahan barang",
  "introduction": "kami merupakan pt ...",
  "description": "
    - Membantu pindahan barang dari rumah ke kos, estimasi 2  jam,
    - Memastikan barang baik baik saja
    - Membersihkan kos",
  "level": ["Beginer"],
  "type": "urgent", // jika memilih urgent budget urgent sebesar 15%
  "required": 2, // orang
  "jobSite": "On site",
  "budgetMin": 150000, //opsional
  "budgetMax": 200000, //opsional
  "budgetType": "Fixed", //opsional (wajib ada jika mencantumkan budget)
  "status": "Open",
  "startTime": "09:10", //optional
  "endTime": "19:10", // optional (jika null maka sampai selesai)
  "startDate": "DD-MM-YY", //optional
  "endDate": "DD-MM-YY", //optional
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "id": "uuid-job",
    "jobProviderId": "uuid-fk-user",
    "jobCategoriesId":  ["jc1", "jc2", "jc3"],
    "addressId": "uuid-fk-address",
    "isPublic": true,
    "location": {
      "lat": -6.00000,
      "lng": 5.33333,
      "street": "Jln. semangka",
      "postalCode": "xxxxx",
      "masterLocation": {
        "subdistrict": {
          "id": "subdistrict-id",
          "name": "Keude Bakongan",
          "code": "11.01.01.2001",
        },
        "district": {
          "id": "district-id",
          "name": "Bakongan",
          "code": "11.01.01"
        },
        "city": {
          "id": "city-id",
          "name": "Kab. Aceh Selatan",
          "code": "11.01"
        },
        "province": {
          "id": "province-id",
          "name": "Aceh",
          "code": "11"
        }
      }
    },
    "title": "Bantu pindahan barang",
    "introduction": "kami merupakan pt ...",
    "description": "
      - Membantu pindahan barang dari rumah ke kos, estimasi 2 jam,
      - Memastikan barang baik baik saja
      - Membersihkan kos
    ",
    "level": "beginner",
    "type": "urgent",
    "required": 2, // orang
    "jobSite": "On site",
    "budgetMin": 150000 + biaya urgent, //opsional
    "budgetMax": 200000 + biaya urgent, //opsional
    "status": "Open",
    "startTime": "09:10 AM", //optional
    "endTime": "07:10 PM", //optional
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "createdAt": "2026-01-01T10:00:00Z",
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed created job"
}
```

**Response:** `400 failed`

```json
{
  "success": false,
  "message": "bad request",
  "errors": "title cannot be null, …."
}
```

### 12.2 List Jobs card (FOR LANDING PAGE) (public)

**Endpoint:** `GET /jobs`  
Query param:

| Parameter | Type   | Required | Default | Description                         |
| :-------- | :----- | :------- | :------ | :---------------------------------- |
| `page`    | number | No       | 1       | Halaman pagination                  |
| `size`    | number | No       | 10      | maksimal jumlah data pada 1 halaman |

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get jobs successfully",
  "data": [
    {
      "id": "uuid-job",
      "title": "kitchen staff coffee",
      "isPublic": true,
      "location": {
        "street": "Jln. semangka",
        "postalCode": "xxxxx",
        "lat": -6.00000,
        "lng": 5.33333,
        "subdistrict": {
          "id": "subdistrict-id",
          "name": "Keude Bakongan",
          "code": "11.01.01.2001",
        },
        "district": {
          "id": "district-id",
          "name": "Bakongan",
          "code": "11.01.01"
        },
        "city": {
          "id": "city-id",
          "name": "Kab. Aceh Selatan",
          "code": "11.01"
        },
        "province": {
          "id": "province-id",
          "name": "Aceh",
          "code": "11"
        }
      },
      "type": "Urgent",
      "jobSite": "On site",
      "budgetMin": 150000 + biaya urgent, //opsional
      "budgetMax": 200000 + biaya urgent, //opsional
      "budgetType": "Fixed",
      "status": "Open",
      "jobAge": "2 days ago",
      "primaryImage":
    },
    ...,
    ...
  ],
  "paging": {
    "currentPage": 1,
    "totalPage": 10,
    "totalElement": 100,
    "size": 10,
    "nextPage": true,
    "previousPage": false,
    "firstPage": true,
    "lastPage": false
  }
}
```

### 12.3 List Jobs card created by provider (Provider View)

Menampilkan daftar job yang dibuat oleh provider.  
**Endpoint:** `GET /jobs/provider`  
**Request Headers:**

- **Authorization: Bearer {token}**

**Query param:**

| Parameter | Type   | Required | Default | Description                         |
| :-------- | :----- | :------- | :------ | :---------------------------------- |
| `page`    | number | No       | 1       | Halaman pagination                  |
| `size`    | number | No       | 10      | maksimal jumlah data pada 1 halaman |

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get jobs successfully",
  "data":
   [
   {
	"id": "uuid-job",
	"user": {
		"jobProvider": {
		"providerId": "uuid-fk-user",
		"name":"lion lionardo"
		"username": ….,
		"profilePictureUrl": …,
		"emailIsVerified": ….,
		"phoneIsVerified": ….
		}
	},
	"title": "kitchen staff coffee",
	"introduction": "......",
	"isProvider": true, // jika provider job
	"isPublic": true,
	"location": {
		"street": "Jln. semangka",
			"postalCode": "xxxxx",
			"lat": -6.00000,
		"lng": 5.33333,
		"subdistrict": {
 	"id": "subdistrict-id",
	"name": "Keude Bakongan",
	"code": "11.01.01.2001",
   },
   "district": {
 	"id": "district-id",
	"name": "Bakongan",
	"code": "11.01.01",
   },
   "city": {
 	"id": "city-id",
	"name": "Kab. Aceh Selatan",
	"code": "11.01",
   },
   "province": {
 	"id": "province-id",
	"name": "Aceh",
	"code": "11",
   }
	},
"type": "Urgent",
"jobSite": "On site",
"budgetMin": 150000 + biaya urgent, //opsional
"budgetMax": 200000 + biaya urgent, //opsional
"budgetType": "Fixed",
"status": "Open",
"jobAge": "2 days ago",
"jobcategories": [
	{
		"jobCategoryId": "jc1",
		"name": "ELECTRICTS",
	},
	{
		"jobCategoryId": "jc2",
		"name": "IT",
	},
	{
		"jobCategoryId": "jc3",
		"name": "HOUSE",
	}
],
"createdAt": YYYY-MM-DD HH:MI:SS,
"updatedAt": YYYY-MM-DD HH:MI:SS,
    },
    …,
    …
      ],
      "paging": {
	"currentPage": 1,
	"totalPage": 10,
	"totalElement": 100,
	"size": 10,
	"nextPage": true,
	"previousPage": false,
	"firstPage": true,
	"lastPage": false
       }
 }
```

### 12.3 List Jobs/search job (Marketplace)

Menampilkan daftar job dengan filter dan pagination.  
**Endpoint:** `GET /jobs/search`  
**Headers:**

- Authorization: Bearer {token}

**Query Parameters:**

| Parameter       | Type     | Required | Default | Description                                  |
| :-------------- | :------- | :------- | :------ | :------------------------------------------- |
| `categoryId`    | string[] | No       | -       | Filter berdasarkan kategori                  |
| `title`         | string   | No       | -       | Filter berdasarkan yang mengandung title job |
| `level`         | string[] | No       | -       | Filter berdasarkan level                     |
| `page`          | integer  | No       | 1       | Halaman pagination                           |
| `size`          | integer  | No       | 10      | maksimal jumlah data pada 1 halaman          |
| `status`        | string   | No       | -       | filter berdasarkan status job                |
| `provinceId`    | string   | No       | -       | Filter by province ID                        |
| `cityId`        | string   | No       | -       | Filter by city ID                            |
| `disctrictId`   | string   | No       | -       | Filter by district ID                        |
| `subdistrictId` | string   | No       | -       | Filter by subdistrict ID                     |

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get jobs successfully",
  "data": [
    {
      "id": "uuid-job",
      "user": {
        "jobProvider": {
          "providerId": "uuid-fk-user",
          "name":"lion lionardo",
          "username": "...",
          "profilePictureUrl": "...",
          "emailIsVerified": "...",
          "phoneIsVerified": "..."
        }
      },
      "addressId": "uuid-fk-address",
      "isProvider": false,
      "isPublic": true,
      "location": {
        "street": "Jln. semangka",
        "postalCode": "xxxxx",
        "lat": -6.00000,
        "lng": 5.33333,
        "subdistrict": {
          "id": "subdistrict-id",
          "name": "Keude Bakongan",
          "code": "11.01.01.2001"
        },
        "district": {
          "id": "district-id",
          "name": "Bakongan",
          "code": "11.01.01"
        },
        "city": {
          "id": "city-id",
          "name": "Kab. Aceh Selatan",
          "code": "11.01"
        },
        "province": {
          "id": "province-id",
          "name": "Aceh",
          "code": "11"
        }
      },
      "title": "Bantu pindahan barang",
      "description": "
        - weekend helper
        - washing station
      ",
      "level": "Beginner",
      "type": "Urgent",
      "required": 2, // orang
      "jobSite": "On site",
      "budgetMin": 150000 + biaya urgent, //opsional
      "budgetMax": 200000 + biaya urgent, //opsional
      "status": "Open",
      "distance": "2 km", // gorong lali
      "jobAge": "Just now",
      "jobcategories": [
        {
          "jobCategoryId": "jc1",
          "name": "ELECTRICTS",
        },
        {
          "jobCategoryId": "jc2",
          "name": "IT"
        },
        {
          "jobCategoryId": "jc3",
          "name": "HOUSE"
        }
      ],
      "createdAt": YYYY-MM-DD HH:MI:SS,
    },
    ...,
    ...
  ],
  "paging": {
    "currentPage": 0,
    "totalPage": 10,
    "totalElement": 100,
    "size": 10,
    "nextPage": true,
    "previousPage": false,
    "firstPage": true,
    "lastPage": false
  }
}
```

**Response:** `200 OK, but empty`

```json
{
  "success": true,
  "message": "get jobs successfully",
  "data": [],
  "paging": {
    "currentPage": 0,
    "totalPage": 0,
    "totalElement": 0,
    "size": 10,
    "nextPage": false,
    "previousPage": false,
    "firstPage": true,
    "lastPage": false
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed get jobs"
}
```

### 12.3 Job Detail

user Mendapatkan detail lengkap sebuah job berdasarkan id job  
**Endpoint:** `GET /jobs/:jobId`  
**Headers:**

- **Authorization: Bearer {token}**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "get job successfully",
  "data": {
    "id": "uuid-job",
    "user": {
      "jobProvider": {
        "id": "uuid-fk-user",
        "name":"lion lionardo",
        "username": ...,
        "profilePictureUrl": ...,
        "emailIsVerified": ...,
        "phoneIsVerified": ...
      }
	  },
	  "acceptedApplicant": [ // hanya untuk tampilan job provider jika job privider accept worker
      {
        "id": ,
        "name": ...,
        "username": ...,
        "profilePictUrl": ...
      }
    ],
    "addressId": "uuid-fk-address",
    "isProvider": false,
    "isPublic": true,
    "location": {
      "street": "Jln. semangka",
      "postalCode": "xxxxx",
      "lat": -6.00000,
      "lng": 5.33333,
      "subdistrict": {
        "id": "subdistrict-id",
        "name": "Keude Bakongan",
        "code": "11.01.01.2001"
      },
      "district": {
        "id": "district-id",
        "name": "Bakongan",
        "code": "11.01.01",
      },
      "city": {
        "id": "city-id",
        "name": "Kab. Aceh Selatan",
        "code": "11.01"
      },
      "province": {
        "id": "province-id",
        "name": "Aceh",
        "code": "11"
      }
    },
    "title": "Bantu pindahan barang",
    "introduction": ".....",
    "description": "
      - Membantu pindahan barang dari rumah ke kos, estimasi 2 jam
      - Memastikan barang baik baik saja
      - Membersihkan kos
    ",
    "level": "Beginner",
    "required": 2, // orang
    "type": "Urgent",
    "jobSite": "On site",
    "budgetMin": 150000 + biaya urgent, //opsional
    "budgetMax": 200000 + biaya urgent, //opsional
    "budgetType": "Fixed", //opsional (wajib ada jika mencantumkan budget)
    "status": "Open",
    "applicationsCount": 0, //default
    "dayOfWeekStart": "*Selasa, 25 Desember 2024*", //optional
    "startTime": "09:10 AM", //optional
    "endTime": "07:10 PM", //optional
    "scheduledDate": YYYY-MM-DD,
    "estimatedDurationDays": "3 hari",
    "categories": [ // optional
      {
        "id": "jc1",
        "name": "ELECTRICTS",
      },
      {
        "id": "jc2",
        "name": "IT",
      },
      {
        "id": "jc3",
        "name": "HOUSE",
      }
    ],
  },
}
```

- update jobs tidak bisa dilakukan jika status sudah **closed**
- status => **closed** bisa dilakukan, jika **status** pada **job application** yang bernilai **accepted** sudah ada/mencapai senilai job **required** (worker yang dibutuhkan provider) atau **isAccepted** = **true** pada table job application sudah ada/mencapai senilai **job required.**

### 12.4 update Job

provider update job yang diposting.  
**Endpoint:** `PATCH /jobs/:jobId`  
**`ONLY OWN PROVIDER CAN UPDATE`**  
**Request Headers:**

- **Authorization: Bearer {token}**

**Request Body :**

```json
{
  "addressId": "fk-uuid-jobs",
  "jobCategoriesId":  ["jc1", "jc2", "jc3"],
  "title": "Bantu pindahan barang",
  "introduction": "kami merupakan pt ….",
  "description": "
    - Membantu pindahan barang dari rumah ke kos, estimasi 2 jam,
    - Memastikan barang baik baik saja
    - Membersihkan kos
  ",
  "level": [Beginer],
  "type": "urgent", // jika memilih urgent budget urgent sebesar 15% dan +2500 untuk admin biaya
  "isPublic": false,
  "required": 2, // orang
  "jobSite": "On site",
  "budgetMin": 150000, //opsional
  "budgetMax": 200000, //opsional
  "budgetType": "Fixed", //opsional (wajib ada jika mencantumkan budget)
  "status": "completed",
  "startTime": "09:10", //optional
  "endTime": "19:10", // optional (jika null maka sampai selesai)
  "startDate": "DD-MM-YY", //optional
  "endDate": "DD-MM-YY", //optional
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Job taken successfully",
  "data": {
    "id": "uuid-job",
    "addressId": "uuid-fk-address",
    "location": {
      "street": "Jln. semangka",
      "postalCode": "xxxxx",
      "lat": -6.00000,
      "lng": 5.33333,
      "subdistrict": {
        "id": "subdistrict-id",
        "name": "Keude Bakongan",
        "code": "11.01.01.2001"
      },
      "district": {
        "id": "district-id",
        "name": "Bakongan",
        "code": "11.01.01"
      },
      "city": {
        "id": "city-id",
        "name": "Kab. Aceh Selatan",
        "code": "11.01"
      },
      "province": {
        "id": "province-id",
        "name": "Aceh",
        "code": "11"
      }
    },
    "title": "Bantu pindahan barang",
    "introduction": "kami merupakan pt ….",
    "description": "

      - Membantu pindahan barang dari rumah ke kos, estimasi 2 jam,
      - Memastikan barang baik baik saja
      - Membersihkan kos
    ",
    "level": [Beginer],
    "type": "urgent", // jika memilih urgent budget urgent sebesar 15% dan +2500 untuk admin biaya
    "isPublic": false,
    "required": 2, // orang
    "jobSite": "On site",
    "budgetMin": 150000, //opsional
    "budgetMax": 200000, //opsional
    "budgetType": "Fixed", //opsional (wajib ada jika mencantumkan budget)
    "status": "closed",
    "startTime": "09:10", //optional
    "endTime": "19:10", // optional (jika null maka sampai selesai)
    "startDate": "DD-MM-YY", //optional
    "endDate": "DD-MM-YY", //optional
	  "updatedAt": YYYY-MM-DD HH:MI:SS
  }
}
```

**Error Response:** `400 Bad Request`

```json
{
  "success": false,
  "message": "bad request",
  "errors": "...."
}
```

**Error Response:** `403 Forbidden`

```json
{
  "success": false,
  "message": "Forbidden",
  "errors": "only job owner can update this job"
}
```

**Error Response:** `404 Not Found`

```json
{
  "success": false,
  "message": "Not found",
  "errors": "job not found"
}
```

### 12.5 Delete job

Menghapus job.  
**ONLY OWNER PROVIDER**  
**Endpoint:** `DELETE/jobs/:jobId`  
**Headers:**

- **Authorization: Bearer {token}**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "delete job successful",
  "data": {}
}
```

**Error Response:** `401 Unauthorized`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed delete job"
}
```

**Error Response:** `403 Forbidden`

```json
{
  "success": false,
  "message": "Forbidden",
  "errors": "only job owner can delete this job"
}
```

**Error Response:** `404 Not Found`

```json
{
  "success": false,
  "message": "Not found",
  "errors": "job not found"
}
```

---

# Bookmarks

### 13.1 Add

**Endpoint:** `POST /jobs/:jobId/bookmarks`  
**Request Headers:**

- **Authorization: Bearer {token}**

**Response:** `201 Created`

```json
{
  "status": true,
  "message": "Add bookmark successful",
  "data": {
    "jobId": "job-123"
  }
}
```

### 13.1 List

**Endpoint:** `GET /bookmarks`  
**Request Headers:**

- **Authorization: Bearer {token}**

**Query Params:**

- **page: integer, default 1 (optional)**
- **size: integer, default 10 (opsional)**

**Response:** `200 Success`

```json
{
	"status": true,
  "message": "Get list bookmarks successful",
  "data": [
    {
      "id": "....",
      "job": {
        "id": "....",
        "title": "Frontend Developer",
        "budgetMin": 1000000,
        "budgetMax": 3000000,
        "budgetType": "Monthly",
        "jobSite": "Remote",
        "type": "Urgent",
        "createdAt": "2026-03-25T10:00:00Z"
      }
    },
    ...,
    ...,
  ],
  "paging": {
    "currentPage": 1,
    "totalPage": 10,
    "totalElement": 100,
    "size": 10,
    "nextPage": true,
    "previousPage": false,
    "firstPage": true,
    "lastPage": false
  }
}
```

### 13.1 Delete

**Endpoint:** `DELETE /bookmarks/:bookmarkId`  
**Request Headers:**

- **Authorization: Bearer {token}**

**Response:** `201 Created`

```json
{
  "status": true,
  "message": "Delete bookmark successful",
  "data": {}
}
```

---

# Job applications

- status: [applied, reviewed, accepted, rejected] // default pending ketika apply
- create job application bisa dilakukan jika, **status job = open**
- job provider tidak bisa apply di pekerjaan yang dibuatnya

**Business Rules:**

- ❌ provider tidak boleh mengambil job milik sendiri
- hanya provider yang dapat mengubah miliknya sendiri
- ✅ Job hanya bisa diambil jika status = `open`

### 14.1 Create job applications

Worker membuat surat lamaran untuk job.  
**Endpoint:** `POST /jobs/:jobId/jobApplications`  
**Request Headers:**

- **Authorization: Bearer {token}**

**Request Body:**

```json
{
	"coverLetter": " //optional
          Kepada Yth.,
      Hiring Manager
      [Nama Perusahaan]

      Dengan hormat,

      Saya tertarik untuk mengajukan lamaran sebagai [Posisi/Jabatan] untuk pekerjaan "[Judul Pekerjaan]" yang Anda tawarkan. Dengan pengalaman lebih dari 5 tahun di bidang [bidang pekerjaan], saya yakin memiliki keterampilan dan kompetensi yang sesuai dengan kebutuhan proyek Anda.

      **Keahlian Relevan:**
      - Menguasai [Skill 1] dengan tingkat mahir
      - Pengalaman dalam [Skill 2] selama 3 tahun
      - Sertifikasi [Sertifikasi terkait]

      **Pengalaman Terkait:**
      1. Proyek "[Nama Proyek Sebelumnya]" - [Deskripsi singkat pencapaian]
      2. Pekerjaan untuk [Nama Klien] - [Hasil yang dicapai]

      Saya dikenal sebagai pribadi yang teliti, bertanggung jawab, dan mampu bekerja sesuai tenggat waktu. Saya sangat antusias untuk berkontribusi dalam proyek ini dan yakin dapat memberikan hasil yang memuaskan.

      Saya lampirkan portfolio pekerjaan sebelumnya untuk referensi. Siap untuk diskusi lebih lanjut mengenai detail proyek.

      Hormat saya,

      [Nama Lengkap]
      [No. Telepon]
      [Email]
      [Link Portfolio/Website]
    "
  }
```

**Response:** `201 Created`

```json
{
  "status": true,
  "message": "create job application successful",
  "data": {
    "id": "uuid",
    "status": "Applied",
    "job": {
      "id": "fk-uuid-job",
      "applicationsCount": 1, //increment
    },
    "coverLetter": "
          Kepada Yth.,
      Hiring Manager
      [Nama Perusahaan]

      Dengan hormat,

      Saya tertarik untuk mengajukan lamaran sebagai [Posisi/Jabatan] untuk pekerjaan "[Judul Pekerjaan]" yang Anda tawarkan. Dengan pengalaman lebih dari 5 tahun di bidang [bidang pekerjaan], saya yakin memiliki keterampilan dan kompetensi yang sesuai dengan kebutuhan proyek Anda.

      **Keahlian Relevan:**
      - Menguasai [Skill 1] dengan tingkat mahir
      - Pengalaman dalam [Skill 2] selama 3 tahun
      - Sertifikasi [Sertifikasi terkait]

      **Pengalaman Terkait:**
      1. Proyek "[Nama Proyek Sebelumnya]" - [Deskripsi singkat pencapaian]
      2. Pekerjaan untuk [Nama Klien] - [Hasil yang dicapai]

      Saya dikenal sebagai pribadi yang teliti, bertanggung jawab, dan mampu bekerja sesuai tenggat waktu. Saya sangat antusias untuk berkontribusi dalam proyek ini dan yakin dapat memberikan hasil yang memuaskan.

      Saya lampirkan portfolio pekerjaan sebelumnya untuk referensi. Siap untuk diskusi lebih lanjut mengenai detail proyek.

      Hormat saya,

      [Nama Lengkap]
      [No. Telepon]
      [Email]
      [Link Portfolio/Website]
    ",
    "appliedAt": "Applied on 27 January 2026",
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed create job application"
}
```

**Response:** `400 bad request`

```json
{
  "success": false,
  "message": "bad request",
  "errors": "cannot apply job, job status completed"
}
```

note:

- **accepted** hanya bisa dilakukan sebanyak **provider required** jobs, atau jumlah **accepted applicant** belum mencapai jumlah required jobs

### 14.2 Update Mark status

**provider** accept surat lamaran  
**PROVIDER ONLY**  
**Endpoint:** `PATCH /jobApplications/:jobApplicationId/status`  
**Request Headers:**

- **Authorization: Bearer {token}**

**Request Body:**

```json
{
  "jobMessage": "Kami menerima lamaran anda. semoga bisa bekerja sama dengan baik",
  // jika input = ‘default’ maka memilih default message
  "status": "Accept",
  "rejectedGlobalMessage": "........"
  // rejectedGlobalMessage dilakukan jika status Accept applicantion dan (required job - jumlah accepted applications sekarang == 1) dan bisa jika input ‘**default**’ maka memilih default message
}
```

**Response:** `200 OK`

```json
{
  "status": true,
  "message": "mark job application success",
  "data": {
    "id": "uuid-jobApplication",
    "status": "accept",
    "acceptedAt": "2026-01-01T10:00:00Z", //optional,` jika status=Accepted wajib diisi
    "rejectedAt": "2026-01-01T10:00:00Z", // optional, jika status=Rejected wajib diisi
    "user": {
      "workerId": "uuid-fk-user",
      "name": "sirada hatukani"
    },
    "job": {
      "id": "uuid-fk-job",
      "title": "bersih bersih",
      "status": "...."
    }
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed mark job application"
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "bad request",
  "errors": "accepted has reached limit"
}
```

### 14.3 Get job application by id

Melihat surat lamaran untuk job berdasarkan id application.  
**Endpoint:** `GET /jobApplications/:jobApplicationId`  
**Request Headers:**

- **Authorization: Bearer {token}**

**Response for job provider:** `200 OK`

```json
{
	"status": true,
	"message": "get job application success",
	"data": {
    "worker": {
      "id": "uuid-fk-user",
      "name": "mika",
      "profilePictUrl": ".....",
      "email": "2222@gmail.com",
      "phone": "081112344445"
    },
    "job": {
      "id": "uuid-fk-job",
      "title": "bersih bersih rumah",
      "status": ".....",
      "jobSite": "On Site",
      "isProvider": true
    },
    "id": "uuid-jobApplication",
    "status": "Accepted",
    "coverLetter": "
          Kepada Yth.,
      Hiring Manager
      [Nama Perusahaan]

      Dengan hormat,

      Saya tertarik untuk mengajukan lamaran sebagai [Posisi/Jabatan] untuk pekerjaan "[Judul Pekerjaan]" yang Anda tawarkan. Dengan pengalaman lebih dari 5 tahun di bidang [bidang pekerjaan], saya yakin memiliki keterampilan dan kompetensi yang sesuai dengan kebutuhan proyek Anda.

      **Keahlian Relevan:**
      - Menguasai [Skill 1] dengan tingkat mahir
      - Pengalaman dalam [Skill 2] selama 3 tahun
      - Sertifikasi [Sertifikasi terkait]

      **Pengalaman Terkait:**
      1. Proyek "[Nama Proyek Sebelumnya]" - [Deskripsi singkat pencapaian]
      2. Pekerjaan untuk [Nama Klien] - [Hasil yang dicapai]

      Saya dikenal sebagai pribadi yang teliti, bertanggung jawab, dan mampu bekerja sesuai tenggat waktu. Saya sangat antusias untuk berkontribusi dalam proyek ini dan yakin dapat memberikan hasil yang memuaskan.

      Saya lampirkan portfolio pekerjaan sebelumnya untuk referensi. Siap untuk diskusi lebih lanjut mengenai detail proyek.

      Hormat saya,

      [Nama Lengkap]
      [No. Telepon]
      [Email]
      [Link Portfolio/Website]
      ",
    "appliedAt": "Applicant applied on 20 February 2026",
    "reviewedAt": "Reviewed by you  on 27 February 2026", //optional
    "acceptedAt": "Accepted by you on 1 June 2026", //optional
    "rejectedAt":  "Rejected by you on 1 June 2026", //optional
	}
}
```

**Response for worker:** `200 OK`

```json
{
	"status": true,
	"message": "get job application success",
	"data": {
    "jobProvider": {
      "id": "uuid-fk-user",
      "name": "mika",
      "profilePictUrl": ".....",
      "email": "...."
    },
    "job": {
      "id": "uuid-fk-job",
      "title": "bersih bersih rumah",
      "status": ".....",
      "jobSite": "On Site",
      "isProvider": false,
      "locations": {
        "subdistrict": {
          "id": "SD1",
          "name": "Keude Bakongan"
        },
        "district": {
          "id": "D1",
          "name": "Bakongan",
        },
        "city": {
          "id": "C1",
	        "name": "Kab. Aceh Selatan"
        },
        "province": {
 	        "id": "P1",
          "name": "Aceh"
        }
      }
    },
    "id": "uuid-jobApplication",
    "status": "accepted",
    "coverLetter": "
          Kepada Yth.,
      Hiring Manager
      [Nama Perusahaan]

      Dengan hormat,

      Saya tertarik untuk mengajukan lamaran sebagai [Posisi/Jabatan] untuk pekerjaan "[Judul Pekerjaan]" yang Anda tawarkan. Dengan pengalaman lebih dari 5 tahun di bidang [bidang pekerjaan], saya yakin memiliki keterampilan dan kompetensi yang sesuai dengan kebutuhan proyek Anda.

      **Keahlian Relevan:**
      - Menguasai [Skill 1] dengan tingkat mahir
      - Pengalaman dalam [Skill 2] selama 3 tahun
      - Sertifikasi [Sertifikasi terkait]

      **Pengalaman Terkait:**
      1. Proyek "[Nama Proyek Sebelumnya]" - [Deskripsi singkat pencapaian]
      2. Pekerjaan untuk [Nama Klien] - [Hasil yang dicapai]

      Saya dikenal sebagai pribadi yang teliti, bertanggung jawab, dan mampu bekerja sesuai tenggat waktu. Saya sangat antusias untuk berkontribusi dalam proyek ini dan yakin dapat memberikan hasil yang memuaskan.

      Saya lampirkan portfolio pekerjaan sebelumnya untuk referensi. Siap untuk diskusi lebih lanjut mengenai detail proyek.

      Hormat saya,

      [Nama Lengkap]
      [No. Telepon]
      [Email]
      [Link Portfolio/Website]
    ",
    "appliedAt": "Applied on 20 February 2026",
    "reviewedAt": "Reviewed by …. on 27 February 2026", //optional
    "acceptedAt": "Accepted by … on 1 June 2026", //optional
    "rejectedAt":  "Rejected by …  on 1 June 2026", //optional
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed get job application"
}
```

### 14.4 Get list job applications for a job (Provider view)

melihat list surat lamaran job  
**Endpoint:** `GET /jobs/:jobId/jobApplications`  
**Request Headers:**

- **Authorization: Bearer {token}**

**Query Params:**

- **status: Pending/Shortlisted/Reviewed/Accepted/Rejected (optional)**
- **name: string (optional)**
- **page: integer, default 1 (optional)**
- **size: integer, default 10 (opsional)**

**Response:** `200 OK`

```json
{
  "status": true,
  "message": "get job application success",
  "data":[
    {
      "worker": {
        "id": "uuid-fk-user",
        "name": "zahra aulia",
        "profilePictUrl": "https://example.url"
      },
      "id": "uuid-jobApplication",
      "status": "Reviewed",
      "reviewedAt": "Reviewed on 27 February 2026", //optional
      "acceptedAt": "Accepted on 1 June 2026", //optional
      "rejectedAt":  "Rejected on 1 June 2026", //optional
    },
    ...,
    ...
  ],
  "paging": {
    "currentPage": 1,
    "totalPage": 2,
    "totalElement": 15,
    "size": 10,
    "nextPage": true,
    "previousPage": false,
    "firstPage": true,
    "lastPage": false
  }
}
```

**Response:** `200 OK`

```json
{
  "status": true,
  "message": "get list job applications success",
  "data": [],
  "paging": {
    "currentPage": 1,
    "totalPage": 2,
    "totalElement": 15,
    "size": 10,
    "nextPage": true,
    "previousPage": false,
    "firstPage": true,
    "lastPage": false
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed get job application"
}
```

### 14.5 Get list job applications for a job (worker view)

melihat list surat lamaran job  
**Endpoint:** `GET /jobApplications`  
**Request Headers:**

- **Authorization: Bearer {token}**

**Query Params:**

- **status: Pending/Reviewed/Accepted/Rejected (optional)**
- **name: string (optional)**
- **page: integer, default 1 (optional)**
- **size: integer, default 10 (opsional)**

**Response:** `200 OK`

```json
{
  "status": true,
  "message": "get list job applications success",
  "data": [
    {
      "jobProvider": {
        "id": "uuid-user",
        "name": "gudang garam",
        "profilePictUrl": "https://example.url"
      },
      "job": {
        "id": "uuid-fk-job",
        "title": "bersih bersih rumah",
        "jobAge": "....."
      },
      "id": "uuid-jobApplications",
      "status": "reviewed",
      "appliedAt": "Applied on 25 February 2026", //optional
      "reviewAt": "Reviewed on 27 February 2026", //optional
      "acceptedAt": "Accepted on 1 June 2026", //optional
      "rejectedAt":  "Rejected on 1 June 2026", //optional
    },
    ...,
    ...
  ],
  "paging": {
    "currentPage": 0,
    "totalPage": 2,
    "totalElement": 15,
    "size": 10,
    "nextPage": true,
    "previousPage": false,
    "firstPage": true,
    "lastPage": false
  }
}
```

**Response:** `200 OK`

```json
{
  "status": true,
  "message": "get list job applications success",
  "data": [],
  "paging": {
    "currentPage": 1,
    "totalPage": 2,
    "totalElement": 15,
    "size": 10,
    "nextPage": true,
    "previousPage": false,
    "firstPage": true,
    "lastPage": false
  }
}
```

**Response:** `401 failed`

```json
{
  "success": false,
  "message": "unauthorized",
  "errors": "failed get job application"
}
```

---

# Notifications

### 15.1 Get list notification

**Endpoint:** `GET /notifications`  
**Request Headers:**

- **Authorization: Bearer {token}**

**Query Params:**

- **isRead: boolean (optional)**
- **type: Job Applied/Job Accepted/Job Rejected/Job Reviewed (optional)**
- **page: integer, default 1 (optional)**
- **size: integer, default 10 (opsional)**

**Response:** `200 Success`

```json
{
  "success": true,
  "message": "Get list notifications successfully",
  "data": [
    {
      "id": "notif-123",
      "type": "JOB_ACCEPTED",
      "title": "Lamaran diterima",
      "message": "Selamat, kamu diterima",
      "isRead": false,
      "jobApplicationId": "app-456"
    },
    ...,
    ...
  ],
  "unread": 9,
  "paging": {
    "currentPage": 0,
    "totalPage": 2,
    "totalElement": 15,
    "size": 10,
    "nextPage": true,
    "previousPage": false,
    "firstPage": true,
    "lastPage": false
  }
}
```

**Error Response:** `400 Bad Request`

```json
{
  "success": false,
  "message": "bad request",
  "errors": "reviews status not completed yet"
}
```

**Error Response:** `409 Conflict`

```json
{
  "success": false,
  "message": "conflict",
  "erros": "review already submit"
}
```

### 15.2 Update notification as read

**Endpoint:** `PUT /notifications/:notificationId`  
**Headers:**

- **Authorization: Bearer {token}**

**Response:** `200 Success`

```json
{
  "success": true,
  "message": "Update notification successfully",
  "data": {
    "id": ".....",
    "isRead": true
  }
}
```

### 15.4 Mark all as read

**Endpoint:** `PUT /notifications`  
**Headers:**

- Authorization: Bearer {token}

**Response:** `200 Success`

```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "count": 8
  }
}
```

### 15.4 Delete notification

**Endpoint:** `DELETE /notifications/:notificationId`  
**Headers:**

- **Authorization: Bearer {token}**

**Response:** `200 Success`

```json
{
  "success": true,
  "message": "Delete notification successfully",
  "data": {}
}
```

---

# Reviews

Review bisa dilakukan jika, status pada jobs sudah **closed**

- Cek apakah user terlibat dalam job atau pembuat job
- Untuk provider: apakah user adalah pemilik job? provider-to-worker: 401;
- Untuk worker: apakah user adalah yang diterima di job tersebut? worker-to-provider: 401;

### 16.1 Create Review (Belum)

create review setelah job closed.  
**provider** bisa review **worker, dan Worker juga** bisa review **provider**

**Endpoint:** `POST /jobApplications/:jobApplicationId/reviews`  
**Request Headers:**

- **Authorization: Bearer {token}**

**Request Body:**

```json
{
  "comment": "Excellent work! very pro player",
  "rating": 4
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "id": "uuid",
    "type": "PROVIDER_TO_WORKER",
    "rating": 4,
    "comment": "Excellent work! very pro player",
    "createdAt": "2026-01-01T10:00:00Z",
    "user": {
      "reviewer": {
        "id": "uuid-fk-user",
        "name": "zaza zizi",
        "profilePictUrl": "https://example.url"
      },
      "reviewee": {
        "id": "uuid-fk-user",
        "name": "wowo",
        "profilePictUrl": "https://example.url"
      }
    },
    "job": {
      "id": "uuid",
      "title": "Bersih-bersih Rumah"
    }
  }
}
```

**Error Response:** `400 Bad Request`

```json
{
  "success": false,
  "message": "bad request",
  "errors": "reviews status not completed yet"
}
```

**Error Response:** `403 Forbidden`

```json
{
  "success": false,
  "message": "forbidden",
  "errors": "user are not involved in the job"
}
```

**Error Response:** `409 Conflict`

```json
{
  "success": false,
  "message": "conflict",
  "erros": "review already submit"
}
```

**Business Rules:**

- ✅ Review hanya bisa diberikan setelah job status = `Close`
- ✅ Setiap user hanya bisa memberikan 1 review per job
- ✅ Provider bisa reply untuk setiap review dari worker, batas 1 kali

### 16.2 Reply Review (Belum)

ONLY PROVIDER.  
**Endpoint:** `POST /reviews/:reviewId/reply`  
**Request Headers:**

- **Authorization: Bearer {token}**

**Request Body:**

```json
{
  "ReplyComment": "Terimakasih atas ratingnya!"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "Reply review successfully",
  "data": {
    "id": "uuid",
    "replyComment": "Terima kasih atas reviewnya!",
    "repliedAt": "2 Tahun yang lalu",
    "reviewer": {
      "id": "uuid",
      "name": "Budi Santoso",
      "profilePictUrl": "https://example.url"
    }
  }
}
```

**Error Response:** `403 Forbidden`

```json
{
  "success": false,
  "message": "forbidden",
  "errors": "Only the reviewee can reply"
}
```

**Error Response:** `404 Not found`

```json
{
  "success": false,
  "message": "forbidden",
  "errors": "Review not found"
}
```

**Error Response:** `409 Conflict`

```json
{
  "success": false,
  "message": "conflict",
  "erros": "Review already replied"
}
```

### 16.3.1 Get List Reviews pribadi

Mendapatkan semua review untuk sebuah job untuk profil.  
**Endpoint:** `GET /users/reviews`  
**Request Headers:**

- **Authorization: Bearer {token}**

**Query Params:**

- **rating: integer, 1-5 (optional)**
- **as: worker/provider (optional)**
- **page: integer, default 1**
- **size: integer, default 10**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Get list reviews successfully",
  "data": [
    {
      "id": "uuid",
      "rating": 5,
      "type": "PROVIDER_TO_WORKER",
      "review": {
        "comment": "Pekerja sangat profesional",
        "isMyReview": true,
        "by": {
          "id": "uuid",
          "name": "Budi Santoso",
          "profilePictUrl": "[https://example.url](https://example.url)"
        },
        "createdAt": "2 Bulan lalu",
        "updatedAt": "3 Bulan lalu"
      },
      "reply": {
        "comment": "Terima kasih atas reviewnya!", // null jika belum dibalas
        "isMyReply": false,
        "by": {
          "id": "uuid",
          "name": "Siti Aminah",
          "profilePictUrl": "https://example.url"
        },
        "repliedAt": "2026-01-01T10:00:00Z", // null jika belum dibalas
      },
      "job": {
        "id": "uuid",
        "title": "Bersih bersih rumah"
      }
    },
    ...,
    ...
  ],
  "paging": {
    "currentPage": 1,
    "totalPage": 2,
    "totalElement": 15,
    "size": 10,
    "nextPage": true,
    "previousPage": false,
    "firstPage": true,
    "lastPage": false
  },
}
```

### 16.3.2 Get List Reviews other users

Mendapatkan semua review untuk sebuah job untuk profil.  
**Endpoint:** `GET /users/:userId/reviews`  
**Request Headers:**

- **Authorization: Bearer {token}**

**Query Params:**

- **rating: integer, 1-5 (optional)**
- **as: worker/provider (optional)**
- **page: integer, default 1**
- **size: integer, default 10**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Get list reviews successfully",
  "data": [
    {
      "id": "uuid",
      "rating": 5,
      "type": "PROVIDER_TO_WORKER",
      "review": {
        "comment": "Pekerja sangat profesional",
        "by": {
          "id": "uuid",
          "name": "Budi Santoso",
          "profilePictUrl": "[https://example.url](https://example.url)"
        },
        "createdAt": "2 Bulan lalu",
        "updatedAt": "3 Bulan lalu"
      },
      "reply": {
        "comment": "Terima kasih atas reviewnya!", // null jika belum dibalas
        "by": {
          "id": "uuid",
          "name": "Siti Aminah",
          "profilePictUrl": "https://example.url"
        },
        "repliedAt": "2026-01-01T10:00:00Z" // null jika belum dibalas
      }, // null jika belum dibalas
      "job": {
        "id": "uuid",
        "title": "Bersih bersih rumah"
      }
    }
  ],
  "paging": {
    "currentPage": 1,
    "totalPage": 2,
    "totalElement": 15,
    "size": 10,
    "nextPage": true,
    "previousPage": false,
    "firstPage": true,
    "lastPage": false
  }
}
```

### 16.4.1 Update Reviews

Memperbarui review untuk sebuah job.  
hanya bisa dilakukan oleh **reviewer** (yang kasih review)  
**Endpoint:** `PATCH /reviews/:reviewId`  
**Headers:**

- **Authorization: Bearer {token}**

**Request Body:**

```json
{
  "comment": "Excellent work! very pro player", //optional
  "rating": 3 // optional
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Update reviews successfully",
  "data": {
	"id": "uuid",
	"rating": 3,
	"comment": "look like lazy person",
	"updatedAt": "2026-01-01T10:00:00Z",
}
```

**Error Response:** `403 Forbidden`

```json
{
  "success": false,
  "message": "forbidden",
  "erros": "Not the owner"
}
```

**Error Response:** `404 Not found`

```json
{
  "success": false,
  "message": "not found",
  "erros": "reviews not found"
}
```

**Error Response:** `410 Gone`

```json
{
  "success": false,
  "message": "gone",
  "erros": "Edit deadline has passed"
}
```

### 16.4.2 Update Reviews reply

Memperbarui review untuk sebuah job.  
hanya bisa dilakukan oleh **reviewee** (yang direview):  
**Endpoint:** `PATCH /reviews/:reviewId/reply`  
**Headers:**

- **Authorization: Bearer {token}**

**Request Body:**

```json
{
  "replyComment": "Excellent work! very pro player" //optional
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Update reply reviews successfully",
  "data": {
    "id": "uuid",
    "rating": 3,
    "comment": "look like lazy person",
    "repliedUpdatedAt": "2026-01-01T10:00:00Z"
  }
}
```

**Error Response:** `403 Forbidden`

```json
{
  "success": false,
  "message": "forbidden",
  "erros": "Not the owner"
}
```

**Error Response:** `404 Not found`

```json
{
  "success": false,
  "message": "not found",
  "erros": "reviews not found"
}
```

**Error Response:** `410 Gone`

```json
{
  "success": false,
  "message": "gone",
  "erros": "Edit deadline has passed"
}
```

### 16.5 Delete Reviews

hapus review (oleh reviewer)  
**Endpoint:** `DELETE /reviews/:reviewId`  
**Headers:**

- **Authorization: Bearer {token}**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Delete reviews successfully",
  "data": {}
}
```

**Error Response:** `403 Forbidden`

```json
{
  "success": false,
  "message": "forbidden",
  "erros": "Not the owner"
}
```

**Error Response:** `404 Not found`

```json
{
  "success": false,
  "message": "not found",
  "erros": "reviews not found"
}
```

### 16.5 Delete Reviews Reply

hapus reply saja (oleh reviewee)  
**Endpoint:** `DELETE /reviews/:reviewId/reply`  
**Headers:**

- **Authorization: Bearer {token}**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Delete reply reviews successfully",
  "data": {}
}
```

**Error Response:** `403 Forbidden`

```json
{
  "success": false,
  "message": "forbidden",
  "erros": "Not the owner"
}
```

**Error Response:** `404 Not found`

```json
{
  "success": false,
  "message": "not found",
  "erros": "reviews not found"
}
```

---

## Valid State Transitions

| From    | To         | Action     | Who                  |
| :------ | :--------- | :--------- | :------------------- |
| `open`  | `taken`    | Take Job   | Provider             |
| `open`  | `canceled` | Cancel Job | Requester            |
| `taken` | `done`     | Finish Job | Provider             |
| `taken` | `canceled` | Cancel Job | Requester / Provider |

### State Validation Rules

#### Status: `open`

- ✅ Job bisa diambil oleh provider (bukan owner)
- ✅ Job bisa dibatalkan oleh requester
- ❌ Tidak bisa diselesaikan
- ❌ Tidak bisa direview

#### Status: `taken`

- ❌ Tidak bisa diambil lagi
- ✅ Bisa diselesaikan oleh provider
- ✅ Bisa dibatalkan oleh requester atau provider
- ❌ Tidak bisa direview

#### Status: `done`

- ❌ Tidak bisa diambil
- ❌ Tidak bisa diselesaikan
- ❌ Tidak bisa dibatalkan
- ✅ Bisa direview oleh requester dan provider

#### Status: `canceled`

- ❌ Tidak ada action yang bisa dilakukan
- ❌ Tidak bisa direview

---

## Error Codes

### HTTP Status Codes

| Status Code | Description                                       |
| :---------- | :------------------------------------------------ |
| `200`       | OK - Request berhasil                             |
| `201`       | Created - Resource berhasil dibuat                |
| `400`       | Bad Request - Invalid input atau state transition |
| `401`       | Unauthorized - Token tidak valid atau expired     |
| `403`       | Forbidden - User tidak memiliki permission        |
| `404`       | Not Found - Resource tidak ditemukan              |
| `409`       | Conflict - Resource sudah ada                     |
| `410`       | Gone - data hilang                                |
| `422`       | Unprocessable Entity - Validation error           |
| `500`       | Internal Server Error                             |

### Application Error Codes

| Error Code            | HTTP Status | Description                                       |
| :-------------------- | :---------- | :------------------------------------------------ |
| `INVALID_STATE`       | 400         | State transition tidak valid sesuai state machine |
| `OWN_JOB`             | 403         | User mencoba mengambil job milik sendiri          |
| `UNAUTHORIZED_ACTION` | 403         | User tidak berhak melakukan action tertentu       |
| `REVIEW_EXISTS`       | 409         | Review sudah pernah dibuat untuk job ini          |
| `NOT_FOUND`           | 404         | Resource tidak ditemukan                          |
| `VALIDATION_ERROR`    | 422         | Input validation gagal                            |
| `INVALID_CREDENTIALS` | 401         | Email atau password salah                         |
| `TOKEN_EXPIRED`       | 401         | JWT token sudah expired                           |
| `EMAIL_EXISTS`        | 409         | Email sudah terdaftar                             |

###

### Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": "...."
}
```

---

## Future-Proof Design

### Extensibility Principles

API ini didesain untuk bisa di-extend tanpa breaking existing clients:

✅ **Backward Compatible Changes:**

- ✅ Menambah field baru di response (client harus ignore unknown fields)
- ✅ Menambah query parameters optional
- ✅ Menambah endpoint baru
- ✅ Menambah enum value baru (status, category, etc)

❌ **Breaking Changes (Avoid):**

- ❌ Menghapus field dari response
- ❌ Mengubah tipe data field existing
- ❌ Mengubah struktur response
- ❌ Membuat existing query parameter menjadi required

### Potential Future Extensions

#### Payment Integration

## Best Practices

### For Frontend Developers

1. **Always check `can_*` flags** sebelum render action buttons
2. **Handle error codes** untuk memberikan feedback yang tepat ke user
3. **Implement optimistic updates** untuk better UX, tapi handle rollback jika API error
4. **Cache job list** dan invalidate setelah state change
5. **Use pagination** dengan proper limit untuk performa

### For Backend Developers

1. **Validate state transitions** di business logic layer
2. **Use database transactions** untuk state changes
3. **Log all state transitions** untuk audit trail
4. **Implement rate limiting** untuk prevent abuse
5. **Add proper indexes** untuk query performance (location, status, created_at)

---

## Rate Limits

| Endpoint Type               | Rate Limit            |
| :-------------------------- | :-------------------- |
| Authentication              | 5 requests / minute   |
| Read Operations (GET)       | 100 requests / minute |
| Write Operations (POST/PUT) | 30 requests / minute  |

**Rate Limit Headers:**

X-RateLimit-Limit: 100

X-RateLimit-Remaining: 95

X-RateLimit-Reset: 1704110400

---

## Changelog

### v1.0.0 (2026-01-01)

- Initial MVP release
- Core job lifecycle implementation
- Dual-role user system
- Rating & review system

---

## Support

- **Documentation**: [https://docs.jasaharian.com](https://docs.jasaharian.com)
- **API Status**: [https://status.jasaharian.com](https://status.jasaharian.com)
- **Support Email**: [support@jasaharian.com](mailto:support@jasaharian.com)

---

## License

© 2026 Jasa Harian. All rights reserved.
