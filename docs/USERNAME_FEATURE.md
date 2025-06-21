# Username Feature Documentation

## Overview

Fitur username telah ditambahkan ke model User untuk memungkinkan slug author blog menggunakan username yang unik. Username dibuat secara otomatis dari potongan email untuk memastikan keunikan.

## Perubahan Database

### Schema Prisma

Field `username` telah ditambahkan ke model `User`:

```prisma
model User {
  id           String         @id @default(uuid())
  email        String         @unique
  username     String         @unique  // Field baru
  name         String
  // ... field lainnya
}
```

### Migrasi Database

Migrasi `20250621095531_add_username_to_user` telah dibuat dan dijalankan untuk menambahkan kolom `username` ke tabel `User`.

## Implementasi

### 1. Utility Function

File: `src/utils/userHelpers.ts`

```typescript
export const generateUniqueUsername = async (
  email: string
): Promise<string> => {
  // Extract the part before @ from email
  const baseUsername = email.split("@")[0].toLowerCase();

  // Remove any non-alphanumeric characters and replace with underscore
  const cleanUsername = baseUsername.replace(/[^a-z0-9]/g, "_");

  let username = cleanUsername;
  let counter = 1;

  // Check if username already exists and generate unique one
  while (true) {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!existingUser) {
      return username;
    }

    // If username exists, append counter
    username = `${cleanUsername}_${counter}`;
    counter++;
  }
};
```

### 2. Auth Controller Updates

File: `src/controllers/authController.ts`

- Import `generateUniqueUsername` function
- Saat membuat user baru via Google OAuth, username dibuat otomatis dari email
- Response auth menyertakan field `username`

### 3. User Controller Updates

File: `src/controllers/userController.ts`

- Menambahkan endpoint `getUserProfileByUsername` untuk mendapatkan user berdasarkan username
- Mengupdate response untuk menyertakan field `username`

### 4. Routes Updates

File: `src/routes/user.ts`

- Menambahkan route `GET /api/users/username/:username` untuk mendapatkan user berdasarkan username

### 5. Types Updates

File: `src/types/user.ts`

- Mengupdate interface `UserProfile` untuk menyertakan field `username`

## API Endpoints

### 1. Get User by Username

```
GET /api/users/username/:username
```

**Response:**

```json
{
  "id": "user-id",
  "email": "user@example.com",
  "username": "user_example",
  "name": "User Name",
  "bio": "User bio",
  "avatar": "avatar-url"
  // ... field lainnya
}
```

### 2. Auth Responses (Updated)

#### Google Auth

```
POST /api/auth/google
```

**Response:**

```json
{
  "message": "Google authentication successful",
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "username": "user_example",
    "bio": "User bio",
    "avatar": "avatar-url"
  }
}
```

#### Get Current User (Me)

```
GET /api/auth/me
```

**Response:**

```json
{
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "username": "user_example",
    "bio": "User bio",
    "avatar": "avatar-url"
  }
}
```

#### Refresh Token

```
POST /api/auth/refresh
```

**Response:**

```json
{
  "message": "Token refreshed successfully",
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "username": "user_example",
    "bio": "User bio",
    "avatar": "avatar-url"
  }
}
```

## Contoh Penggunaan

### 1. Slug Author Blog

Sekarang slug author blog bisa menggunakan username:

```
/blog/my-awesome-post/author/john_doe
```

### 2. Profile URL

URL profil user bisa menggunakan username:

```
/profile/john_doe
```

## Aturan Username

1. **Unik**: Setiap username harus unik di seluruh sistem
2. **Format**: Hanya huruf kecil, angka, dan underscore (\_)
3. **Panjang**: 3-30 karakter
4. **Otomatis**: Dibuat dari email saat registrasi
5. **Increment**: Jika username sudah ada, akan ditambahkan counter (contoh: john_doe_1)

## Contoh Konversi Email ke Username

| Email                      | Username   |
| -------------------------- | ---------- |
| john.doe@gmail.com         | john_doe   |
| user123@example.com        | user123    |
| test-user@domain.co.id     | test_user  |
| john.doe@gmail.com (kedua) | john_doe_1 |

## Migration Script

Script `scripts/updateExistingUsers.ts` telah dibuat untuk mengupdate user yang sudah ada dengan username. Script ini:

1. Mencari semua user yang belum memiliki username
2. Generate username unik dari email mereka
3. Update database dengan username baru

## Frontend Integration

### User Navigation (user-nav)

Sekarang semua endpoint auth mengembalikan field `username`, sehingga komponen user-nav di frontend dapat mengakses username untuk:

1. **Menampilkan username di dropdown/menu**
2. **Membuat link profil dengan username**: `/profile/{username}`
3. **Membuat slug author untuk blog**: `/blog/{slug}/author/{username}`

### Contoh Penggunaan di Frontend

```javascript
// Setelah login atau refresh token
const authResponse = await fetch("/api/auth/me");
const { user } = await authResponse.json();

// Sekarang user object memiliki username
console.log(user.username); // "john_doe"

// Bisa digunakan untuk navigasi
const profileUrl = `/profile/${user.username}`;
const authorUrl = `/blog/my-post/author/${user.username}`;
```

### State Management

```javascript
// Redux/Zustand store
const userSlice = {
  user: {
    id: "user-id",
    name: "John Doe",
    email: "john.doe@gmail.com",
    username: "john_doe", // ✅ Sekarang tersedia
    bio: "Developer",
    avatar: "avatar-url",
  },
};
```

## Testing

Untuk menguji fitur ini:

1. Jalankan server: `npm run dev`
2. Login dengan Google OAuth
3. Cek response auth untuk melihat username yang dibuat
4. Test endpoint `/api/auth/me` untuk memastikan username dikembalikan
5. Akses endpoint `/api/users/username/{username}` untuk mendapatkan profil user
