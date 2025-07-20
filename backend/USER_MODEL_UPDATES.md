# User Model Updates

## Added Fields

The User model has been extended with two new fields:

### Avatar (Optional)
- **Type**: `string` (nullable)
- **Purpose**: Store URL or path to user's profile picture/avatar
- **Example**: `"https://example.com/avatars/user123.jpg"` or `"/uploads/avatars/user123.png"`

### Role (Required)
- **Type**: `string` (non-nullable)  
- **Default**: `"user"`
- **Purpose**: Define user permissions and access levels
- **Common values**: `"admin"`, `"user"`, `"moderator"`, `"manager"`

## API Usage

### User Registration
When creating a new user, you can now include avatar and role:

```json
POST /auth/register
{
    "email": "user@example.com",
    "password": "securepassword",
    "avatar": "https://example.com/avatar.jpg",
    "role": "user"
}
```

### User Updates
Update user profile including avatar and role:

```json
PATCH /users/{user_id}
{
    "avatar": "https://newavatar.com/image.jpg",
    "role": "admin"
}
```

### User Response
User data now includes the new fields:

```json
{
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "is_active": true,
    "is_superuser": false,
    "is_verified": false,
    "avatar": "https://example.com/avatar.jpg",
    "role": "user"
}
```

## Database Migration

The database migration has been applied automatically. If you need to run it manually:

```bash
cd backend
python script/add_user_avatar_role_migration.py
```

## Frontend Integration

The frontend TypeScript interface has been updated in `authStore.ts`:

```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;  // NEW
  role: string;     // NEW
  [key: string]: unknown;
}
```

## Security Considerations

- **Avatar URLs**: Validate and sanitize avatar URLs to prevent XSS attacks
- **Role Management**: Implement proper authorization checks based on user roles
- **Role Updates**: Restrict role modifications to admin users only
