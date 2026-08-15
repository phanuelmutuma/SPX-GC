
# SPX Graphics Controller

**Manage and control HTML graphics in live production.**

>  Readme updated 2026-05-28
<br>

## SPX in a nut shell

<img src="./static/img/spx_online.png" WIDTH="60" align="left" style="margin:0 1em 0 0"> **SPX Graphics Controller** is an application using web technologies for managing and for playing back realtime graphics such as lower thirds, titles, logos, news tickers and more for live streaming, live events, live TV broadcast and other productions.  SPX runs locally on your computer or in the cloud and works seamlessly with
[OBS](https://obsproject.com/?ref=spxgraphics.com),
[vMIX](https://www.vmix.com/?ref=spxgraphics.com),
[LiveU Studio](https://www.liveu.tv/products/produce/liveu-studio),
[ToolsOnAir](https://www.toolsonair.com/),
[CasparCG](https://github.com/CasparCG),
[Wirecast](https://www.wirecast.io/en/?ref=spxgraphics.com),
[XSplit](https://www.xsplit.com/?ref=spxgraphics.com), 
[MimoLive](https://mimolive.com/?ref=spxgraphics.com),
[TopDirector](https://www.topdirector.com/?ref=spxgraphics.com),
[Tricaster](https://www.vizrt.com/products/tricaster/?ref=spxgraphics.com),
[LiveOS](https://www.neton.live/products/liveos-production-suites/?ref=spxgraphics.com),
[Tellyo](https://www.tellyo.com/?ref=spxgraphics.com),
[Sienna](https://www.sienna-tv.com/newsite/?ref=spxgraphics.com),
[AWS Elemental](https://aws.amazon.com/media-services/elemental/?ref=spxgraphics.com),
[Panasonic Kairos](https://pro-av.panasonic.net/en/products/it_ip_platform/?ref=spxgraphics.com),
[Amagi](https://www.amagi.com/?ref=spxgraphics.com)
or any other video pipeline supporting HTML sources.

* **On-Premise** - SPX can run completely on-prem without internet connection
* **Simple but feature rich** - From manual playout to 100% automated workflows
* **File system based** - simple and robust architecture
* **Bring Your Design** - SPX does not come with a design tool - use your favorite tools
* **OGraf Compliant** - SPX supports EBU OGraf file format 
* **Layers and Outputs** - use several layers of realtime graphics and target different outputs
* **Extendable** - create custom graphics workflows with plugins and APIs
* **Full graphics ecosystem** - Please visit [spxgraphics.com](https://spxgraphics.com) 🌐


<br>

> [!IMPORTANT]
> # Full docs available at → [docs.spxgraphics.com](https://docs.spxgraphics.com)



## OPEN SOURCE VERSION

Latest version 1.4.1 (May 2026)

This repository contains the open source version of the SPX Graphics Controller. You can clone the repo and use it freely. The open source version does not contain all features or API functionalities of the commercial applications, but it can be used without any other limitations or watermarks.

See [installation instructions](https://docs.spxgraphics.com/Guides/Getting+Started/Installation).

## Desktop downloads (GitHub Releases)

Prebuilt apps are on the **[Releases](https://github.com/phanuelmutuma/SPX-GC/releases)** page.

**Latest: [v1.4.1](https://github.com/phanuelmutuma/SPX-GC/releases/tag/v1.4.1)**

| Your computer | Download |
|---|---|
| Mac Apple silicon (M1 / M2 / M3 / M4) | [SPX-1.4.1-macos-arm64.zip](https://github.com/phanuelmutuma/SPX-GC/releases/download/v1.4.1/SPX-1.4.1-macos-arm64.zip) |
| Intel Mac | [SPX-1.4.1-macos-x64.zip](https://github.com/phanuelmutuma/SPX-GC/releases/download/v1.4.1/SPX-1.4.1-macos-x64.zip) |
| Windows 64-bit | [SPX-1.4.1-windows-x64.zip](https://github.com/phanuelmutuma/SPX-GC/releases/download/v1.4.1/SPX-1.4.1-windows-x64.zip) |
| Linux 64-bit | [SPX-1.4.1-linux-x64.zip](https://github.com/phanuelmutuma/SPX-GC/releases/download/v1.4.1/SPX-1.4.1-linux-x64.zip) |

On a Mac: unzip, right-click `SPX.app` → **Open**. If Gatekeeper blocks it, run `xattr -cr SPX.app` and Open again. The controller loads at http://localhost:5656

Future versions: push a `v*` tag (for example `v1.4.2`) and GitHub Actions will build and attach new files on the Releases page.

## Run from source

Requires Node.js 18 or newer.

```sh
npm install
npm start
```

Then open `http://localhost:5656` in a browser. `npm start` runs `node server.js` (the previous `pm2` command is still available as `npm run start:pm2`).

## Build desktop apps

This repo can pack SPX into a standalone app with [`@yao-pkg/pkg`](https://github.com/yao-pkg/pkg) — the same approach used by official SPX binaries. Mac is first: you get a double-clickable `SPX.app` that starts the server and opens the controller UI.

```sh
npm install
npm run build:macos          # Apple Silicon + Intel .app bundles
npm run build:macos:arm64    # Apple Silicon only
npm run build:macos:x64      # Intel only
npm run build:windows        # Windows x64 folder + zip
npm run build:linux          # Linux x64 folder + zip
```

Builds land in `dist/`. The Mac zip contains `SPX.app`. On Linux the build script downloads `ldid` and ad-hoc signs the Mac binary so macOS will launch it. Gatekeeper still blocks first open of an internet-downloaded app until you right-click → Open, or run `xattr -cr SPX.app`.

Windows and Linux builds are a folder with `SPX.exe` / `SPX` plus `ASSETS`, `DATAROOT`, and `locales`. Double-click the binary (or `start-spx.cmd` on Windows).



## COMMERCIAL VERSIONS

There are commercial SPX Graphics versions for professional users with additional productivity features, API endpoints, support options, Professional Services and more.

  * **[SPX Solo](https://spxgraphics.com/software/solo)** is the open source version compiled to an easy to install software for Windows, Mac and Linux and it comes with example graphics, plugins and a launcher for easy use.

  * **[SPX Production](https://spxgraphics.com/software/production)** is targeted to professional live projects, such as events, streaming, sports and other OB-productions and has additional features for professional graphics playout.

  * **[SPX Broadcast](https://spxgraphics.com/software/broadcast)** is targeted to TV broadcasters and media companies with additional features and integration options for automated graphics workflows such as 24/7 playout and newsroom with MOS, NLE and NRCS plugins.
  
<br>

  > For more information visit SPX website to [compare SPX versions](https://spxgraphics.com/software#compare) or [contact us](https://spxgraphics.com/contact).
<br>
<br>



# Screenshots <a id="screenshots"></a>

![snapshot](screenshots/00-spx-gc-principle2.png)

|  | |
| ------ | ------ |
| ![animation](screenshots/spx-gc-ui-anim-v1-0.gif) | SPX's UI is browser based and can be operated with a mouse or keyboard. Additonal _extra controls_ can be added as _plugins_ to execute specific tasks or to trigger events in external devices. |
| ![project list](screenshots/01-spx-gc-projectlist.png) | Content is managed in _projects_. Each project can have unlimited amount of _rundowns_ and _graphics templates_. Projects and their rundowns and settings are stored in _dataroot -folder_. |
| ![controller](screenshots/05-spx-gc-controller-rundown.png) | Main Controller: rundown with few items and a local preview. Items can be edited and controlled also with keyboard shortcuts. Fullscreen viewing mode recommended. Buttons below preview are customizeable. | 
| [![intro video on Youtube](screenshots/yt_mockup.png)](https://www.youtube.com/watch?v=JAo689wOL2Q) | A 20 min intro video on Youtube to learn the core concepts of the application.  | 
| [![intro video on Youtube](screenshots/yt_mockup-showreel.png)](https://youtu.be/Ruxz4DACDT4) | A showreel of SPX Graphics.  | 



## Anatomy of an example rundown item
![anatomy-of-an-item](screenshots/anatomy-of-an-item.png)


# MIT License <a id="license"></a>
Copyright 2020-2026 Tuomo Kulomaa & [SPX Graphics](http://spxgraphics.com). This project is licensed under the terms of the MIT license.
See [LICENSE.txt](LICENSE.txt)

