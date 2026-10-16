# Public installed-app OAuth configuration

`electron/public-google-client.json` contains the public installed-client identifiers referenced by the experimental Antigravity connection. It contains no user's API key, authorization code, access token or refresh token.

## Provenance

- [OmniRoute's Antigravity configuration](https://github.com/diegosouzapw/OmniRoute/blob/release/v3.8.52/src/lib/oauth/constants/oauth.ts) identifies these as public values distributed with the Antigravity CLI.
- [OmniRoute's public configuration source](https://github.com/diegosouzapw/OmniRoute/blob/release/v3.8.52/open-sse/utils/publicCreds.ts) supplies the corresponding `antigravity_id` and `antigravity_alt` entries. Its MIT license is included at `electron/OMNIROUTE-LICENSE.txt`.
- On 2026-10-16, an anonymous HTTPS fetch and in-memory comparison confirmed an exact match between both bundled fields and those public entries. No values or user tokens were printed. The upstream source file's SHA-256 was `9c5e36c3294cb7d4bd4e37add6efcfbe727efb3bb533867acdf3a5d3fce7b914`.

[Google's installed-application OAuth documentation](https://developers.google.com/identity/protocols/oauth2/#installed) describes embedding the installed-client ID and, where applicable, client secret in app source; it distinguishes that value from a confidential secret. This does not establish permission, entitlement, quota or support for the community integration.

User sessions are obtained only after explicit browser sign-in. Sotto encrypts those account tokens locally through Windows safeStorage and does not include them in the source or release. The README's experimental-connection warning still applies.
