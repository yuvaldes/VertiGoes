# Google Play Data safety draft

This is an implementation-based draft for Play Console. The developer account owner must verify and attest the final answers.

## Collection and sharing

- Collects user data: **Yes**
- Shares user data with third parties for their own purposes: **No**
- Data encrypted in transit: **Yes**
- Users can request deletion: **Yes**
- External deletion URL: https://app.vertigoes.co/account-deletion.html

## Data types collected

| Play data type | Examples in VertiGoes | Required? | Purpose |
| --- | --- | --- | --- |
| Email address | Supabase account email | Required for email accounts | Account management, authentication |
| User IDs | Supabase account identifier | Required | App functionality, account management |
| Name | Optional profile and emergency-contact name | Optional | App functionality, personalization |
| Phone number | Optional emergency-contact phone | Optional | App functionality; VertiGoes does not call the contact |
| Health info | Diagnoses, medications, safety answers, dizziness events, sleep, mood, notes and exercise progress | Optional except safety/onboarding fields selected by the user | App functionality |
| Other user-generated content | Optional mood and health text notes | Optional | App functionality |

## Not collected by the Android app

- Precise or approximate location
- Contacts/address book
- Photos or videos
- Advertising ID or advertising data
- Payment data
- Voice-note audio: recorded only after permission, stored locally on the device, and not uploaded by the current implementation

## Processors

- Supabase processes authentication and account-linked application data on VertiGoes' behalf.
- Google OAuth processes Google sign-in when the user chooses it. Review Google's current SDK/data-safety guidance before the final declaration.

## Retention and deletion

The in-app deletion action invokes the protected account-deletion function and removes account-linked profile and health records. Anonymized consent/security metadata may be retained where needed for compliance or abuse prevention. Temporary backup copies may remain until normal rotation.
