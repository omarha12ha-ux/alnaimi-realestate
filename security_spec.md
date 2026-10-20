# Security Specification - شركة البراء النعيمي للعقارات

## 1. Data Invariants
- A User document must have a `role` of either 'admin' or 'client'.
- A user cannot self-assign the 'admin' role during registration.
- An Appointment must be linked to a valid `userId` (the creator).
- Property data is public for reading but strictly admin-only for writes.
- Timestamps (`createdAt`) must be server-generated or verified.

## 2. The "Dirty Dozen" Payloads (Denial Expected)
1. **Identity Spoofing**: Creating a user profile for someone else's UID.
2. **Privilege Escalation**: Registering with `role: 'admin'`.
3. **Admin Hijack**: Updating another user's role to 'admin'.
4. **Appointment Poaching**: Reading appointments belonging to another user.
5. **Unauthorized Listing**: Non-admin creating a property.
6. **Property Vandalism**: Non-admin updating price or description of a property.
7. **Appointment Forgery**: Creating an appointment with a `userId` that is not the current user's.
8. **Status Manipulation**: A client changing an appointment status from 'cancelled' back to 'confirmed' after a terminal state (if implemented).
9. **Large Payload Attack**: Injecting 1MB of text into the property description.
10. **ID Poisoning**: Using a 2KB string as a document ID.
11. **Timestamp Forgery**: Explicitly setting `createdAt` to a past date instead of `request.time`.
12. **orphaned Appointments**: Creating an appointment for a deleted/non-existent property (if strict validation enabled).

## 3. Test Runner Concept (firestore.rules.test.ts)
```typescript
// Pseudocode for tests
it('should deny a client from creating a property', () => {
  const db = authedApp({ uid: 'client1' });
  assertFails(db.collection('properties').add({ title: 'New Villa' }));
});

it('should deny a client from reading another user appointments', () => {
  const db = authedApp({ uid: 'client1' });
  assertFails(db.collection('appointments').where('userId', '==', 'client2').get());
});

it('should allow a client to read their own profile', () => {
  const db = authedApp({ uid: 'client1' });
  assertSucceeds(db.collection('users').doc('client1').get());
});
```
