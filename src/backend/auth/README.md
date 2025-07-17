# Auth Canister Module

Enhanced authentication and user management system with profile switching and advanced security features.

## Key Features

### ✅ Profile Management

- **Complete CRUD Operations**: Create, read, update, and manage user profiles
- **Role Support**: Client, ServiceProvider, and Admin roles
- **Verification System**: User verification with admin controls
- **Profile Discovery**: Easy lookup of service providers

### ✅ Profile Switching (NEW)

- **Seamless Role Transitions**: Switch between Client and ServiceProvider roles
- **Rate Limiting**: Maximum 3 role switches per day to prevent abuse
- **History Tracking**: Complete audit trail of all role changes
- **Admin Approval**: Optional admin approval for sensitive role changes

### ✅ Enhanced Security (NEW)

- **User Suspension**: Admin ability to suspend users with time-based expiration
- **Account Status Tracking**: Active/inactive status with suspension management
- **Security Event Logging**: Comprehensive logging of all security-related events
- **Verification Management**: Admin controls for granting/revoking verification

### ✅ Privacy & Compliance

- **Principal-Based Identity**: Uses ICP Principal IDs for secure identity
- **Phone-Only Authentication**: Removed email dependency for enhanced privacy
- **Data Protection**: Secure storage of user information

## New Functions

### Profile Switching

```motoko
switchRole(newRole : UserRole, reason : ?Text) : async Result<Profile>
getRoleHistory(userId : Principal) : async Result<[RoleChangeRecord]>
```

### Enhanced Security

```motoko
suspendUser(userId : Principal, durationHours : Nat, reason : Text) : async Result<Bool>
reactivateUser(userId : Principal) : async Result<Bool>
revokeVerification(userId : Principal, reason : Text) : async Result<Bool>
isAccountInGoodStanding(userId : Principal) : async Result<Bool>
```

### Analytics & Administration

```motoko
getProfileStatistics() : async ProfileStatistics
```

## Enhanced Types

### Profile Type

```motoko
type Profile = {
    id: Principal;
    name: Text;
    phone: Text;
    role: UserRole;
    createdAt: Time.Time;
    updatedAt: Time.Time;
    isVerified: Bool;
    profilePicture: ?ProfileImage;
    biography: ?Text;
    // NEW: Enhanced security fields
    lastLogin: ?Time.Time;
    loginCount: Nat;
    isActive: Bool;
    suspendedUntil: ?Time.Time;
};
```

### Role Change Tracking

```motoko
type RoleChangeRecord = {
    id: Text;
    userId: Principal;
    previousRole: UserRole;
    newRole: UserRole;
    changedAt: Time.Time;
    reason: ?Text;
    approvedBy: ?Principal;
};
```

## Security Features

### Rate Limiting

- **Role Switches**: Maximum 3 per day per user
- **Automatic Cleanup**: Old rate limit data automatically cleaned up

### Admin Controls

- **User Suspension**: Time-based suspension with automatic expiration
- **Verification Management**: Grant or revoke user verification
- **Security Monitoring**: Complete audit trail of all actions

### Account Protection

- **Account Status Checking**: Real-time validation of account standing
- **Suspension Detection**: Automatic handling of suspended accounts
- **Activity Tracking**: Login count and last login timestamps

## Integration with Other Canisters

### Reputation System

- **Automatic Initialization**: New service providers get reputation scores
- **Role-Based Integration**: Different reputation handling for different roles

### Security Event System

- **Comprehensive Logging**: All security events tracked
- **Event Types**: Login, role switches, suspensions, etc.
- **Admin Visibility**: Security events available for monitoring

## Performance Optimizations

- **Increased HashMap Sizes**: From 10 to 100 for better performance
- **Efficient Lookups**: Optimized phone number and principal mappings
- **Memory Management**: Proper stable variable handling for upgrades

## Validation Constants

```motoko
VALIDATION_CONSTANTS = {
    MIN_NAME_LENGTH = 2;
    MAX_NAME_LENGTH = 50;
    MIN_PHONE_LENGTH = 10;
    MAX_PHONE_LENGTH = 15;
    DEFAULT_HASHMAP_SIZE = 100;
    MAX_ROLE_SWITCHES_PER_DAY = 3;
    SUSPENSION_DURATION_HOURS = 24;
    MAX_FAILED_LOGINS = 5;
};
```

## README Compliance

This enhanced auth canister now fully supports the README.md requirements:

✅ **Profile Switching**: "Easily switch between client and local service provider accounts"
✅ **Secure Identity Management**: "without compromising user privacy"  
✅ **Decentralized Trust & Security**: "Leverages ICP's tamper-proof infrastructure"
✅ **User Profile Management**: Complete profile lifecycle management

## Migration Notes

Existing profiles are automatically migrated with default values for new fields:

- `lastLogin`: Set to current time
- `loginCount`: Set to 1
- `isActive`: Set to true
- `suspendedUntil`: Set to null

The enhanced auth canister maintains backward compatibility while adding powerful new features for profile management and security.
