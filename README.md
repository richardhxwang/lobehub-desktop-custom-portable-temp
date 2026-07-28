# Temporary LobeHub Desktop Custom Portable Release

This public repository builds a temporary customized Windows x64 portable package from the official LobeHub Desktop **v2.2.11** installer.

## Temporary download

When the workflow is running, the asset is published here:

https://github.com/richardhxwang/lobehub-desktop-custom-portable-temp/releases/download/temporary-download/LobeHub-Portable-2.2.11-Custom-win-x64.zip

The workflow automatically deletes the Release, its downloadable asset, and its tag approximately **15 minutes after publication**. The repository remains public.

## Customizations

- Hides paid-upgrade promotional cards and purchase entry points.
- Keeps account, usage, normal settings, and Provider pages visible.
- Keeps the `LobeHub` Provider visible and gives it the normal on/off switch.
- Disables the `LobeHub` Provider once on the first launch for each user profile.
- Preserves later manual Provider choices.
- Does not unlock paid features or change server-side subscriptions, quotas, or permissions.

## Reproducibility and provenance

The workflow:

1. Downloads the official LobeHub v2.2.11 Windows installer.
2. Verifies its fixed SHA-256 hash.
3. Extracts it without executing the installer.
4. Patches the Electron `app.asar` resources.
5. Preserves all unpacked native Node modules.
6. Validates and publishes the ZIP as a temporary GitHub Release.
7. Deletes the Release after 15 minutes.

Upstream project and license terms remain applicable. This repository contains only the patch/build automation; the upstream binary is downloaded during the workflow run.
