---
title: Hololight work
url: https://ackeskin.github.io/#experience
---

## Role in one sentence

At Hololight (Munich, since June 2022) Ali owns what runs on the headset for Hololight Stream and Hololight Hub. He is turning the Stream client from a separate app per device into a standard OpenXR layer that works on any device.

## In plain terms

Hololight Stream renders 3D apps on a PC or server and streams them to headsets, phones and the browser. Ali builds the client side: everything between the decoded video frame and the headset, including input, tracking, networking, rendering and UI. A simple way to put it: OpenXR is like USB for headsets, and his work builds to that standard instead of to each device.

## Devices and platforms

He has shipped Stream clients on 9 device families: HoloLens 2, Meta Quest, Magic Leap 2, PICO, HTC Vive Focus 3, Snap Spectacles, Windows, Android and Web.

## How the work grew

- 2022 to 2023: features for the HoloLens 2 client, such as voice commands and dictation, scene understanding and mesh streaming, and profiling of the encoder and render loop. Then one shared UI across HoloLens 2, Quest and Magic Leap 2.
- 2024: new clients. A desktop client, the Hub client and a browser client, each taken from first setup to release.
- 2025: hardening. Release work, browser fixes for Safari and video codecs, ports to HTC and PICO, motion and reprojection settings, and team tooling such as CI with code formatting checks and a PR template.
- 2026: OpenXR itself. The client API layer, the runtime and the company's OpenXR extensions.

Each step widened the scope by one layer: from one device's UI, to every device's client, to the product platform, and then into OpenXR.

## OpenXR API layer

He is replacing the per-device Stream clients with one device-agnostic OpenXR API layer that handles the session, hands, controllers and frame override. With it, supporting a new headset takes far less work. He also built frame output for colour and depth through OpenGL, and a reprojection testbed for Android in Godot.

## OpenXR runtime and extensions

He added reprojection and motion estimation to the company's Monado-based OpenXR runtime and tested it with the OpenXR conformance test suite (CTS). He is designing Hololight's OpenXR extensions for remote rendering and is a member of the Khronos OpenXR working group.

## Hub client

He is the lead developer of the Hub client, the app customers open on the headset to sign in, browse their company's XR apps and launch a streamed session. It has shipped on Meta Quest, PICO and HoloLens 2, with live app status over server-sent events (SSE), token refresh and a release pipeline per vendor.

## Browser client and networking

He built the browser client from scratch in JavaScript with WebSockets and WebXR, so streaming works with nothing to install. He designed the shared WebRTC connection layer all clients use, with signaling over TCP and WebSockets and central ICE configuration, and wrote native C++/JNI code for Android headsets tuned for low latency.

## Team tooling and AI

He led the team's move to AI-assisted development: LLM-written PR summaries, a PR template with hygiene checks, guidance and skills for coding agents, and build instructions agents can follow. He prefers small, stacked pull requests and changed CI so stacked PRs build faster. He also set up CI/CD for every platform.

## Skills this work shows

Deep: cross-device XR clients. Growing fast: OpenXR internals (API layers, conformance, extension design). Solid: streaming and networking, web clients. Recent: graphics (OpenGL colour and depth, reprojection). Proven: performance profiling. Next areas he is working toward: Vulkan, spec writing, and automated conformance testing.
