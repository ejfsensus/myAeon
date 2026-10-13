# Third-Party Notices

Updated 10 October 2026.

## Kerykeion

The local chart core uses Kerykeion 6.0.2 without modifying its library source.

- Source: https://github.com/g-battaglia/kerykeion
- Release source: https://github.com/g-battaglia/kerykeion/tree/v6.0.2
- License: GNU Affero General Public License v3.0 (AGPL-3.0), subject to upstream
  package notices.
- Licensing guidance: https://github.com/g-battaglia/kerykeion/blob/main/LICENSING.md

## Swiss Ephemeris

The worker explicitly selects Kerykeion's Swiss Ephemeris backend and the built-in
Moshier calculation path. It does not fetch external ephemeris files. The Python
Swiss Ephemeris binding and underlying engine have their own AGPL/commercial
licensing terms; retain their distributed notices and review the applicable
terms alongside Kerykeion's license.

- Binding source: https://github.com/astrorigin/pyswisseph
- Engine/license information: https://www.astro.com/swisseph/swephinfo_e.htm

## Libephemeris

Kerykeion's installed dependencies also include libephemeris 3.2.1, licensed
AGPL-3.0-only. This deployment does not select that backend or download its JPL
data, but its distribution notices still apply to the installed package.

- Source: https://github.com/g-battaglia/libephemeris

## Network Use and Source

The application source, worker integration, Dockerfile and dependency manifests
are published at https://github.com/sensuslab/myAeon. The privacy page links this
source location. The upstream dependency sources are linked above.

Publishing a repository is not a blanket assertion of legal compliance. Review
the combined work, corresponding source, notices and any network-interaction
obligations before wider availability. AGPL obligations may apply even to a
non-commercial network service. Using a separately licensed hosted service in
future does not change the license of prior self-hosted deployments.

## Other Dependencies

Optional chart interpretations use jsonrepair 3.15.0 (ISC license) to recover
malformed JSON syntax before complete response validation.

- Source and license: https://github.com/josdejong/jsonrepair

Node and Python dependencies retain their respective licenses. The JavaScript
dependency tree is recorded in package-lock.json; Python dependencies are pinned
in requirements.txt. No paid Astrologer API code or API credentials are bundled.

## Experience assets

- Zeus Dark and Zeus Light: supplied by the project owner for the myAeon interface; copied without alteration.
- `public/audio/reading-ambience.m4a`: project-owner supplied ten-minute ambient recording, normalised for background playback. No rights ownership is inferred from its filename.
- DejaVu Sans fonts: Bitstream Vera / DejaVu licences, included at `public/fonts/DEJAVU-LICENSE.txt`.
- Procedural planet textures are authored by this project; they are illustrative, not photographic maps.
- Place search uses Open-Meteo / GeoNames. Commercial deployments can configure the customer endpoint/key or a compatible self-hosted endpoint.
